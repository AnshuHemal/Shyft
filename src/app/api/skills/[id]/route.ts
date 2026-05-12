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
    return { user, orgId: org.id, role: "ADMIN" as const };
  }

  return null;
}

// ── DELETE /api/skills/[id] — HR removes a skill from the library ─────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  // Verify skill belongs to this org
  const skill = await prisma.skill.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  await prisma.skill.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

// ── PATCH /api/skills/[id] — HR updates a skill ───────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const skill = await prisma.skill.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  try {
    const json = await request.json();
    const { name, category, description, color } = json;

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(category?.trim() && { category: category.trim() }),
        description: description?.trim() ?? skill.description,
        ...(color && { color }),
      },
    });

    return NextResponse.json({ skill: updated });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A skill with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}
