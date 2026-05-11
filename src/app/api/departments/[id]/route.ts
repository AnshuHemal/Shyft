import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdminWithOrg() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;

  const user = session.user as typeof session.user & {
    accountStatus: string;
    role: string;
  };

  if (user.accountStatus !== "APPROVED" || user.role === "SUPERADMIN") return null;

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!org) return null;
  return { session, orgId: org.id };
}

// ── PATCH /api/departments/[id] — rename department ──────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const dept = await prisma.department.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!dept) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Department name is required." },
      { status: 400 }
    );
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name,
      description: body.description?.trim() || null,
    },
    select: { id: true, name: true, description: true },
  });

  return NextResponse.json({ success: true, department: updated });
}

// ── DELETE /api/departments/[id] ──────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const dept = await prisma.department.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!dept) {
    return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  await prisma.department.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
