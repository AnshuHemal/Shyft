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

// ── GET /api/reimbursements/[id] — single record ────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const reimbursement = await prisma.reimbursement.findFirst({
    where: {
      id,
      organizationId: ctx.orgId,
      ...(ctx.role === "EMPLOYEE" ? { employeeId: ctx.employeeId! } : {}),
    },
    include: {
      employee: {
        select: { firstName: true, lastName: true, designation: true, department: true, avatar: true },
      },
      proofs: true,
    },
  });

  if (!reimbursement) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ reimbursement });
}

// ── PATCH /api/reimbursements/[id] — HR review & mark paid ───────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only HR can review reimbursements" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, hrNote } = body; // action: "approve" | "reject" | "mark_paid"

  if (!["approve", "reject", "mark_paid"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (action === "reject" && !hrNote?.trim()) {
    return NextResponse.json({ error: "A reason is required when rejecting" }, { status: 400 });
  }

  const reimbursement = await prisma.reimbursement.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: {
      employee: {
        select: { userId: true, firstName: true, lastName: true },
      },
    },
  });

  if (!reimbursement) return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });

  let newStatus: any;
  let updateData: any = {};

  if (action === "approve") {
    if (reimbursement.status !== "PENDING") {
      return NextResponse.json({ error: "Can only approve pending requests" }, { status: 409 });
    }
    newStatus = "APPROVED";
    updateData = {
      status: newStatus,
      hrNote: hrNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    };
  } else if (action === "reject") {
    if (reimbursement.status !== "PENDING") {
      return NextResponse.json({ error: "Can only reject pending requests" }, { status: 409 });
    }
    newStatus = "REJECTED";
    updateData = {
      status: newStatus,
      hrNote: hrNote?.trim() || null,
      reviewedAt: new Date(),
      reviewedById: ctx.user.id,
    };
  } else if (action === "mark_paid") {
    if (reimbursement.status !== "APPROVED") {
      return NextResponse.json({ error: "Can only mark approved requests as paid" }, { status: 409 });
    }
    newStatus = "PAID";
    updateData = {
      status: newStatus,
      paidAt: new Date(),
      paidById: ctx.user.id,
    };
  }

  const updated = await prisma.reimbursement.update({
    where: { id },
    data: updateData,
  });

  const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(reimbursement.amount);

  // Notify the employee
  if (reimbursement.employee.userId) {
    let type: any = "";
    let title = "";
    let message = "";

    if (newStatus === "APPROVED") {
      type = "REIMBURSEMENT_APPROVED";
      title = "Reimbursement Approved ✓";
      message = `Your ${formattedAmount} reimbursement has been approved. Payout will be processed.`;
    } else if (newStatus === "REJECTED") {
      type = "REIMBURSEMENT_REJECTED";
      title = "Reimbursement Rejected";
      message = `Your ${formattedAmount} reimbursement was rejected. Reason: ${hrNote}`;
    } else if (newStatus === "PAID") {
      type = "REIMBURSEMENT_PAID";
      title = "Reimbursement Paid 💸";
      message = `Your ${formattedAmount} reimbursement has been paid out.`;
    }

    await prisma.notification.create({
      data: {
        type,
        title,
        message,
        recipientId: reimbursement.employee.userId,
        reimbursementId: reimbursement.id,
      },
    });
  }

  return NextResponse.json({ reimbursement: updated });
}
