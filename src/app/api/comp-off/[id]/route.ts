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

// ── GET /api/comp-off/[id] — single record ────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const compOff = await prisma.leaveCompensation.findFirst({
    where: {
      id,
      organizationId: ctx.orgId,
      ...(ctx.role === "EMPLOYEE" ? { employeeId: ctx.employeeId! } : {}),
    },
    include: {
      employee: {
        select: { firstName: true, lastName: true, designation: true, department: true, avatar: true },
      },
      reportingTo: {
        select: { firstName: true, lastName: true, designation: true },
      },
    },
  });

  if (!compOff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ compOff });
}

// ── PATCH /api/comp-off/[id] — HR acknowledges or rejects ────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only HR can review comp-off requests" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, hrNote } = body; // action: "acknowledge" | "reject"

  if (!["acknowledge", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !hrNote?.trim()) {
    return NextResponse.json({ error: "A reason is required when rejecting" }, { status: 400 });
  }

  const compOff = await prisma.leaveCompensation.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: {
      employee: {
        select: {
          userId: true, firstName: true, lastName: true,
          reportingTo: { select: { userId: true } },
        },
      },
    },
  });

  if (!compOff) return NextResponse.json({ error: "Comp-off request not found" }, { status: 404 });
  if (compOff.status !== "PENDING") {
    return NextResponse.json({ error: "This request has already been reviewed" }, { status: 409 });
  }

  const newStatus = action === "acknowledge" ? "ACKNOWLEDGED" : "REJECTED";

  const updated = await prisma.leaveCompensation.update({
    where: { id },
    data: {
      status: newStatus,
      hrNote: hrNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    },
  });

  const empName = `${compOff.employee.firstName} ${compOff.employee.lastName}`;
  const onStr = compOff.compensationOn.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const forStr = compOff.compensationFor.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  // Notify the employee
  if (compOff.employee.userId) {
    await prisma.notification.create({
      data: {
        type: newStatus === "ACKNOWLEDGED" ? "COMP_OFF_ACKNOWLEDGED" : "COMP_OFF_REJECTED",
        title: newStatus === "ACKNOWLEDGED" ? "Comp-Off Acknowledged ✓" : "Comp-Off Rejected",
        message: newStatus === "ACKNOWLEDGED"
          ? `Your comp-off request (worked ${onStr}, leave ${forStr}) has been acknowledged. The leave is cleared.`
          : `Your comp-off request for leave on ${forStr} was rejected. Reason: ${hrNote}`,
        recipientId: compOff.employee.userId,
        compOffId: compOff.id,
      },
    });
  }

  return NextResponse.json({ compOff: updated });
}
