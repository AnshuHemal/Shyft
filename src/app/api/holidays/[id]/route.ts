import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdminWithOrg() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as typeof session.user & { accountStatus: string; role: string };
  if (user.accountStatus !== "APPROVED" || user.role !== "USER") return null;
  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (!org) return null;
  return { session, orgId: org.id };
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const holiday = await prisma.holiday.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!holiday) return NextResponse.json({ error: "Holiday not found." }, { status: 404 });

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
