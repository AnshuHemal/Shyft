import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReviewEmail } from "@/lib/email";

async function requireSuperAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "SUPERADMIN") return null;
  return session;
}

// PATCH /api/admin/users/[id] — approve or reject a user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { accountStatus, reviewNotes } = body as {
    accountStatus: "APPROVED" | "REJECTED";
    reviewNotes?: string;
  };

  if (!["APPROVED", "REJECTED"].includes(accountStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      accountStatus,
      reviewNotes: reviewNotes ?? null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  // Send notification email to the user
  try {
    await sendReviewEmail({
      to: user.email,
      name: user.name,
      status: accountStatus,
      notes: reviewNotes,
    });
  } catch (err) {
    console.error("[Admin] Failed to send review email:", err);
    // Don't fail the request if email fails
  }

  return NextResponse.json({ success: true, user });
}
