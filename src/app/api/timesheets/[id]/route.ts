/**
 * PATCH /api/timesheets/[id]  — submit / approve / reject / hr_submit / hr_approve / hr_reject
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUser() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  return session;
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { action, rejectionNote } = body as {
    action: "submit" | "approve" | "reject" | "hr_submit" | "hr_approve" | "hr_reject";
    rejectionNote?: string;
  };

  const user = session.user as typeof session.user & { role: string };

  const timesheet = await prisma.timesheet.findUnique({
    where: { id },
    include: { employee: { select: { userId: true, organizationId: true } } },
  });

  if (!timesheet) {
    return NextResponse.json({ error: "Timesheet not found." }, { status: 404 });
  }

  // ── 1. Employee submitting to reporting lead ──────────────────────────────
  if (action === "submit") {
    if (user.role !== "EMPLOYEE" || timesheet.employee.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (timesheet.status !== "DRAFT" && timesheet.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Only DRAFT or REJECTED timesheets can be submitted." },
        { status: 400 }
      );
    }

    const { reportingLeadId: requestedLeadId } = body as { reportingLeadId?: string };
    const emp = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { reportingToId: true },
    });
    const finalLeadId = requestedLeadId || emp?.reportingToId;

    if (!finalLeadId) {
      return NextResponse.json(
        { error: "No reporting person assigned. Please contact HR to set up your reporting line before submitting." },
        { status: 400 }
      );
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date(), reportingLeadId: finalLeadId },
    });
    return NextResponse.json({ success: true, timesheet: updated });
  }

  // ── 2. Lead approving / rejecting ─────────────────────────────────────────
  if (action === "approve" || action === "reject") {
    let isAuthorized = false;

    if (user.role === "USER") {
      const org = await prisma.organization.findUnique({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (org && org.id === timesheet.employee.organizationId) isAuthorized = true;
    }

    if (!isAuthorized && user.role === "EMPLOYEE") {
      const currentEmployee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (currentEmployee && currentEmployee.id === timesheet.reportingLeadId) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized to review this timesheet." }, { status: 403 });
    }
    if (timesheet.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Only SUBMITTED timesheets can be reviewed." }, { status: 400 });
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: user.id,
        rejectionNote: action === "reject" ? (rejectionNote ?? null) : null,
      },
    });
    return NextResponse.json({ success: true, timesheet: updated });
  }

  // ── 3. Employee forwarding lead-approved timesheet to HR ──────────────────
  if (action === "hr_submit") {
    if (user.role !== "EMPLOYEE" || timesheet.employee.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (timesheet.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only lead-approved timesheets can be forwarded to HR." },
        { status: 400 }
      );
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: { status: "HR_SUBMITTED", hrSubmittedAt: new Date() },
    });
    return NextResponse.json({ success: true, timesheet: updated });
  }

  // ── 4. HR final approve / reject ──────────────────────────────────────────
  if (action === "hr_approve" || action === "hr_reject") {
    if (user.role !== "USER") {
      return NextResponse.json({ error: "Only HR can perform final approval." }, { status: 403 });
    }
    const org = await prisma.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!org || org.id !== timesheet.employee.organizationId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }
    if (timesheet.status !== "HR_SUBMITTED") {
      return NextResponse.json(
        { error: "Only HR_SUBMITTED timesheets can be finally reviewed." },
        { status: 400 }
      );
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: action === "hr_approve" ? "HR_APPROVED" : "REJECTED",
        hrReviewedAt: new Date(),
        reviewedBy: user.id,
        rejectionNote: action === "hr_reject" ? (rejectionNote ?? null) : null,
      },
    });
    return NextResponse.json({ success: true, timesheet: updated });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
