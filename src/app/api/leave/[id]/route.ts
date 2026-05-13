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
      select: { id: true, organizationId: true },
    });
    if (!emp) return null;
    return { user, orgId: emp.organizationId, role: "EMPLOYEE" as const, employeeId: emp.id };
  }

  return null;
}

// ── PATCH /api/leave/[id] — HR approves or rejects ───────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only HR can review leave applications" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, hrNote } = body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !hrNote?.trim()) {
    return NextResponse.json({ error: "A reason is required when rejecting" }, { status: 400 });
  }

  const leave = await prisma.leaveApplication.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: {
      employee: {
        select: {
          userId: true, firstName: true, lastName: true,
          reportingTo: { select: { userId: true } },
        },
      },
      reportingTo: { select: { userId: true } },
    },
  });

  if (!leave) return NextResponse.json({ error: "Leave not found" }, { status: 404 });
  if (leave.status !== "PENDING") {
    return NextResponse.json({ error: "This leave has already been reviewed" }, { status: 409 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  const updated = await prisma.leaveApplication.update({
    where: { id },
    data: {
      status: newStatus,
      hrNote: hrNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    },
  });

  const start = leave.startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const end = leave.endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const dateStr = leave.leaveType === "MULTI_DAY" ? `${start} – ${end}` : start;
  const empName = `${leave.employee.firstName} ${leave.employee.lastName}`;

  // Notify employee
  if (leave.employee.userId) {
    await prisma.notification.create({
      data: {
        type: newStatus === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
        title: newStatus === "APPROVED" ? "Leave Approved ✓" : "Leave Rejected",
        message: newStatus === "APPROVED"
          ? `Your leave request for ${dateStr} has been approved.`
          : `Your leave request for ${dateStr} was rejected. Reason: ${hrNote}`,
        recipientId: leave.employee.userId,
        leaveId: leave.id,
      },
    });
  }

  // Notify reporting person (approved absences are relevant for planning)
  const reporterUserId = leave.reportingTo?.userId ?? leave.employee.reportingTo?.userId;
  if (reporterUserId && newStatus === "APPROVED") {
    await prisma.notification.create({
      data: {
        type: "LEAVE_APPROVED",
        title: "Team Leave Confirmed",
        message: `${empName}'s leave for ${dateStr} has been approved by HR.`,
        recipientId: reporterUserId,
        leaveId: leave.id,
      },
    });
  }

  return NextResponse.json({ leave: updated });
}

// ── GET /api/leave/[id] — single leave detail ────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const leave = await prisma.leaveApplication.findFirst({
    where: {
      id,
      organizationId: ctx.orgId,
      ...(ctx.role === "EMPLOYEE" ? { employeeId: ctx.employeeId! } : {}),
    },
    include: {
      employee: { select: { firstName: true, lastName: true, designation: true, department: true, avatar: true } },
      reportingTo: { select: { firstName: true, lastName: true, designation: true } },
    },
  });

  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ leave });
}
