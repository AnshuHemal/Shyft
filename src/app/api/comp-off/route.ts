import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── IST helpers ───────────────────────────────────────────────────────────────

/** Returns today's date string (YYYY-MM-DD) in IST */
function getTodayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/** Returns the weekday (0=Sun … 6=Sat) of a date string in IST */
function getWeekdayIST(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00+05:30`);
  return d.getDay();
}

// ── Auth context ──────────────────────────────────────────────────────────────

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

// ── GET /api/comp-off — list comp-off requests ───────────────────────────────
export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  if (ctx.role === "ADMIN") {
    const compOffs = await prisma.leaveCompensation.findMany({
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
    return NextResponse.json({ compOffs });
  }

  // Employee sees only their own
  const compOffs = await prisma.leaveCompensation.findMany({
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

  return NextResponse.json({ compOffs });
}

// ── POST /api/comp-off — submit comp-off request ──────────────────────────────
export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit comp-off requests" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      compensationOn,   // date string YYYY-MM-DD
      compOnDuration,   // HALF_DAY | FULL_DAY | OTHER
      compOnOther,      // string when OTHER
      compensationFor,  // date string YYYY-MM-DD
      compForDuration,  // HALF_DAY | FULL_DAY | OTHER
      compForOther,     // string when OTHER
      awarenessNote,
      reportingToId,
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!compensationOn || !compOnDuration || !compensationFor || !compForDuration || !awarenessNote) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }
    if (compOnDuration === "OTHER" && !compOnOther?.trim()) {
      return NextResponse.json({ error: "Please specify the duration for your work session." }, { status: 400 });
    }
    if (compForDuration === "OTHER" && !compForOther?.trim()) {
      return NextResponse.json({ error: "Please specify the duration for your leave." }, { status: 400 });
    }
    if (!awarenessNote.trim()) {
      return NextResponse.json({ error: "Awareness note is required. Write 'No' if nothing to report." }, { status: 400 });
    }

    // ── Saturday check (IST) ──────────────────────────────────────────────────
    if (getWeekdayIST(compensationOn) !== 6) {
      return NextResponse.json({ error: "Compensation day must be a Saturday." }, { status: 400 });
    }

    // ── Must be submitted on the comp-off day itself ──────────────────────────
    const todayIST = getTodayIST();
    if (compensationOn !== todayIST) {
      return NextResponse.json({
        error: "Comp-off forms must be submitted on the day you come to office (today).",
      }, { status: 400 });
    }

    // ── Leave date must be before comp-off date ───────────────────────────────
    if (compensationFor >= compensationOn) {
      return NextResponse.json({ error: "Leave date must be before the compensation day." }, { status: 400 });
    }

    // ── Same-month policy computation ─────────────────────────────────────────
    const onDate = new Date(`${compensationOn}T00:00:00+05:30`);
    const forDate = new Date(`${compensationFor}T00:00:00+05:30`);
    const isSameMonth =
      onDate.getFullYear() === forDate.getFullYear() &&
      onDate.getMonth() === forDate.getMonth();

    // ── Resolve reporting person ───────────────────────────────────────────────
    let resolvedReportingToId: string | null = reportingToId ?? ctx.reportingToId ?? null;
    if (resolvedReportingToId) {
      const reporter = await prisma.employee.findFirst({
        where: { id: resolvedReportingToId, organizationId: ctx.orgId },
        select: { id: true, userId: true },
      });
      if (!reporter) resolvedReportingToId = null;
    }

    // ── Create the record ─────────────────────────────────────────────────────
    const compOff = await prisma.leaveCompensation.create({
      data: {
        compensationOn: new Date(`${compensationOn}T00:00:00+05:30`),
        compOnDuration,
        compOnOther: compOnDuration === "OTHER" ? compOnOther?.trim() : null,
        compensationFor: new Date(`${compensationFor}T00:00:00+05:30`),
        compForDuration,
        compForOther: compForDuration === "OTHER" ? compForOther?.trim() : null,
        isSameMonth,
        awarenessNote: awarenessNote.trim(),
        employeeId: ctx.employeeId!,
        organizationId: ctx.orgId,
        reportingToId: resolvedReportingToId,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        reportingTo: { select: { userId: true, firstName: true, lastName: true } },
      },
    });

    const empName = `${compOff.employee.firstName} ${compOff.employee.lastName}`;
    const onStr = onDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const forStr = forDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    // ── Notification: HR ──────────────────────────────────────────────────────
    const orgOwner = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { ownerId: true },
    });
    if (orgOwner) {
      await prisma.notification.create({
        data: {
          type: "COMP_OFF_SUBMITTED",
          title: "New Comp-Off Request",
          message: `${empName} submitted a comp-off request. Worked on ${onStr} to compensate for leave on ${forStr}.`,
          recipientId: orgOwner.ownerId,
          compOffId: compOff.id,
        },
      });
    }

    // ── Notification: Reporting Manager (FYI) ─────────────────────────────────
    if (compOff.reportingTo?.userId) {
      await prisma.notification.create({
        data: {
          type: "COMP_OFF_SUBMITTED",
          title: "Team Comp-Off Request (FYI)",
          message: `${empName} submitted a comp-off request for leave on ${forStr}. Awaiting HR acknowledgement.`,
          recipientId: compOff.reportingTo.userId,
          compOffId: compOff.id,
        },
      });
    }

    // ── Notification: Policy warning if different month ───────────────────────
    if (!isSameMonth && ctx.user.id) {
      await prisma.notification.create({
        data: {
          type: "COMP_OFF_SUBMITTED",
          title: "⚠️ Policy Notice — Leave Not Cleared",
          message: `Your comp-off on ${onStr} is in a different month than your leave on ${forStr}. This leave will NOT be cleared and will count against your leave balance.`,
          recipientId: ctx.user.id,
          compOffId: compOff.id,
        },
      });
    }

    return NextResponse.json({ compOff }, { status: 201 });
  } catch (error: any) {
    // Unique constraint violation — already submitted comp-off for this leave date
    if (error?.code === "P2002") {
      return NextResponse.json({
        error: "You have already submitted a comp-off request for this leave date.",
      }, { status: 409 });
    }
    console.error("Submit comp-off error:", error);
    return NextResponse.json({ error: "Failed to submit comp-off request." }, { status: 500 });
  }
}
