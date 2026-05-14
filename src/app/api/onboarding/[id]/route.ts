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
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

  const onboarding = await prisma.employeeOnboarding.findFirst({
    where: { id, organizationId: ctx.orgId },
    include: {
      employee: { select: { userId: true, id: true } }
    },
  });

  if (!onboarding) return NextResponse.json({ error: "Onboarding form not found" }, { status: 404 });
  if (onboarding.status !== "UNDER_REVIEW") {
    return NextResponse.json({ error: "Onboarding is not pending review" }, { status: 409 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.employeeOnboarding.update({
      where: { id },
      data: {
        status: newStatus,
        hrNote: hrNote?.trim() || null,
      },
    });

    if (action === "approve") {
      // 1. Sync data to Employee record
      await tx.employee.update({
        where: { id: onboarding.employee.id },
        data: {
          phone: onboarding.contactNumber,
          dateOfBirth: onboarding.dateOfBirth,
          address: onboarding.currentAddress,
          emergencyPhone: onboarding.emergencyContactNumber,
          // We can add more fields if needed
        }
      });

      // 2. Unlock the user account
      if (onboarding.employee.userId) {
        await tx.user.update({
          where: { id: onboarding.employee.userId },
          data: {
            onboardingCompleted: true,
            accountStatus: "APPROVED",
          }
        });
      }
    }
    
    // Notify Employee
    if (onboarding.employee.userId) {
      let type: any = newStatus === "APPROVED" ? "ONBOARDING_APPROVED" : "ONBOARDING_REJECTED";
      let title = newStatus === "APPROVED" ? "Onboarding Approved" : "Onboarding Rejected";
      let message = newStatus === "APPROVED" 
          ? "Welcome! Your onboarding has been approved. You now have full access." 
          : `Your onboarding documents were rejected: ${hrNote}`;

      await tx.notification.create({
        data: {
          type,
          title,
          message,
          recipientId: onboarding.employee.userId,
          onboardingId: onboarding.id,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
