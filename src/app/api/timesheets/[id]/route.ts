/**
 * PATCH /api/timesheets/[id]        — submit timesheet (employee)
 * GET   /api/timesheets/[id]        — get timesheet by id (HR or employee)
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

// ── PATCH — submit or approve/reject timesheet ────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { action, rejectionNote } = body as {
    action: "submit" | "approve" | "reject";
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

  // ── Employee submitting their own timesheet ──────────────────────────────
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

    const updated = await prisma.timesheet.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });

    return NextResponse.json({ success: true, timesheet: updated });
  }

  // ── HR approving or rejecting ────────────────────────────────────────────
  if (action === "approve" || action === "reject") {
    if (user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify HR owns the org
    const org = await prisma.organization.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!org || org.id !== timesheet.employee.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (timesheet.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Only SUBMITTED timesheets can be reviewed." },
        { status: 400 }
      );
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

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
