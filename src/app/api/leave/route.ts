import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCtx() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as any;

  if (user.role === "USER") {
    const org = await prisma.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!org) return null;
    return { user, orgId: org.id, role: "ADMIN" as const, employeeId: null };
  }

  if (user.role === "EMPLOYEE") {
    const emp = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, organizationId: true, reportingToId: true },
    });
    if (!emp) return null;
    return {
      user,
      orgId: emp.organizationId,
      role: "EMPLOYEE" as const,
      employeeId: emp.id,
      reportingToId: emp.reportingToId,
    };
  }

  return null;
}

// ── GET — list leaves ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // optional filter

  if (ctx.role === "ADMIN") {
    // HR sees all leave applications for the org
    const leaves = await prisma.leaveApplication.findMany({
      where: {
        organizationId: ctx.orgId,
        ...(statusFilter ? { status: statusFilter as any } : {}),
      },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            designation: true, department: true, avatar: true, employeeId: true,
          },
        },
        reportingTo: {
          select: { id: true, firstName: true, lastName: true, designation: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ leaves });
  }

  // Employee sees only their own
  const leaves = await prisma.leaveApplication.findMany({
    where: {
      employeeId: ctx.employeeId!,
      ...(statusFilter ? { status: statusFilter as any } : {}),
    },
    include: {
      reportingTo: {
        select: { id: true, firstName: true, lastName: true, designation: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

// ── POST — submit leave ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit leaves" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { leaveType, halfDaySession, startDate, endDate, reason, reportingToId } = body;

    if (!leaveType || !startDate || !reason) {
      return NextResponse.json({ error: "leaveType, startDate, and reason are required" }, { status: 400 });
    }

    if (reason.trim().length < 10) {
      return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    // Validate reporting person is in same org
    let resolvedReportingToId: string | null = reportingToId ?? ctx.reportingToId ?? null;
    if (resolvedReportingToId) {
      const reporter = await prisma.employee.findFirst({
        where: { id: resolvedReportingToId, organizationId: ctx.orgId },
        select: { id: true, userId: true },
      });
      if (!reporter) resolvedReportingToId = null;
    }

    // Create leave application
    const leave = await prisma.leaveApplication.create({
      data: {
        leaveType,
        halfDaySession: leaveType === "HALF_DAY" ? halfDaySession : null,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
        employeeId: ctx.employeeId!,
        organizationId: ctx.orgId,
        reportingToId: resolvedReportingToId,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        reportingTo: { select: { userId: true, firstName: true, lastName: true } },
      },
    });

    // Format dates for notifications
    const dateStr = leaveType === "MULTI_DAY"
      ? `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
      : start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const empName = `${leave.employee.firstName} ${leave.employee.lastName}`;

    // Notification for HR (org owner)
    const orgOwner = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { ownerId: true },
    });
    if (orgOwner) {
      await prisma.notification.create({
        data: {
          type: "LEAVE_SUBMITTED",
          title: "New Leave Request",
          message: `${empName} has submitted a ${leaveType.replace("_", " ").toLowerCase()} leave request for ${dateStr}.`,
          recipientId: orgOwner.ownerId,
          leaveId: leave.id,
        },
      });
    }

    // Notification for reporting person (FYI — pending HR approval)
    if (leave.reportingTo?.userId) {
      await prisma.notification.create({
        data: {
          type: "LEAVE_SUBMITTED",
          title: "Team Leave Request (Pending)",
          message: `${empName} has submitted a leave request for ${dateStr}. Awaiting HR approval.`,
          recipientId: leave.reportingTo.userId,
          leaveId: leave.id,
        },
      });
    }

    return NextResponse.json({ leave }, { status: 201 });
  } catch (error) {
    console.error("Submit leave error:", error);
    return NextResponse.json({ error: "Failed to submit leave" }, { status: 500 });
  }
}
