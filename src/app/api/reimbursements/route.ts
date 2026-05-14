import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      select: { id: true, organizationId: true },
    });
    if (!emp) return null;
    return {
      user,
      orgId: emp.organizationId,
      role: "EMPLOYEE" as const,
      employeeId: emp.id,
    };
  }

  return null;
}

// ── GET /api/reimbursements — list reimbursements ───────────────────────────
export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  if (ctx.role === "ADMIN") {
    const reimbursements = await prisma.reimbursement.findMany({
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
        proofs: true,
      },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ reimbursements });
  }

  // Employee sees only their own
  const reimbursements = await prisma.reimbursement.findMany({
    where: {
      employeeId: ctx.employeeId!,
      ...(statusFilter ? { status: statusFilter as any } : {}),
    },
    include: {
      proofs: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ reimbursements });
}

// ── POST /api/reimbursements — submit application ───────────────────────────
export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (ctx.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Only employees can submit reimbursements" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      amount,
      category,
      purpose,
      expenseDate,
      proofs, // Array of { storageUrl, storagePublicId, fileName, fileType, fileSize }
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "A valid amount is required." }, { status: 400 });
    }
    if (!purpose || purpose.trim().length < 5) {
      return NextResponse.json({ error: "Please provide a more detailed purpose." }, { status: 400 });
    }
    if (!expenseDate) {
      return NextResponse.json({ error: "Expense date is required." }, { status: 400 });
    }
    if (!Array.isArray(proofs) || proofs.length === 0) {
      return NextResponse.json({ error: "At least 1 proof of payment is required." }, { status: 400 });
    }
    if (proofs.length > 5) {
      return NextResponse.json({ error: "Maximum of 5 proof files allowed." }, { status: 400 });
    }

    // ── Create the record with proofs ─────────────────────────────────────────
    const reimbursement = await prisma.reimbursement.create({
      data: {
        amount: Number(amount),
        category: category || "OTHER",
        purpose: purpose.trim(),
        expenseDate: new Date(expenseDate),
        employeeId: ctx.employeeId!,
        organizationId: ctx.orgId,
        proofs: {
          create: proofs.map((p) => ({
            fileName: p.fileName,
            fileType: p.fileType,
            fileSize: p.fileSize,
            storageUrl: p.storageUrl,
            storagePublicId: p.storagePublicId,
          })),
        },
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    const empName = `${reimbursement.employee.firstName} ${reimbursement.employee.lastName}`;
    const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(reimbursement.amount);

    // ── Notification: HR ──────────────────────────────────────────────────────
    const orgOwner = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { ownerId: true },
    });
    if (orgOwner) {
      await prisma.notification.create({
        data: {
          type: "REIMBURSEMENT_SUBMITTED",
          title: "New Reimbursement Application",
          message: `${empName} submitted a ${formattedAmount} reimbursement for ${category}.`,
          recipientId: orgOwner.ownerId,
          reimbursementId: reimbursement.id,
        },
      });
    }

    // Also notify the employee that it was successfully submitted
    if (ctx.user.id) {
       await prisma.notification.create({
        data: {
          type: "REIMBURSEMENT_SUBMITTED",
          title: "Reimbursement Submitted",
          message: `Your ${formattedAmount} reimbursement application has been sent for review.`,
          recipientId: ctx.user.id,
          reimbursementId: reimbursement.id,
        },
      });
    }

    return NextResponse.json({ reimbursement }, { status: 201 });
  } catch (error: any) {
    console.error("Submit reimbursement error:", error);
    return NextResponse.json({ error: "Failed to submit reimbursement application." }, { status: 500 });
  }
}
