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
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, organizationId: true },
    });
    if (!employee) return null;
    return {
      user,
      orgId: employee.organizationId,
      role: "EMPLOYEE" as const,
      employeeId: employee.id,
    };
  }

  return null;
}

// ── PATCH /api/employees/[id]/skills/[skillId] — update proficiency (drag) ───

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, skillId } = await params;

  if (ctx.role === "EMPLOYEE" && ctx.employeeId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const { proficiency } = json;

    if (!["BEGINNER", "INTERMEDIATE", "PROFICIENT"].includes(proficiency)) {
      return NextResponse.json({ error: "Invalid proficiency value" }, { status: 400 });
    }

    const updated = await prisma.employeeSkill.update({
      where: {
        employeeId_skillId: { employeeId: id, skillId },
      },
      data: { proficiency },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
            color: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({ employeeSkill: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Skill not found on this employee's map" }, { status: 404 });
    }
    console.error("Update skill proficiency error:", error);
    return NextResponse.json({ error: "Failed to update proficiency" }, { status: 500 });
  }
}

// ── DELETE /api/employees/[id]/skills/[skillId] — remove skill from map ──────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, skillId } = await params;

  if (ctx.role === "EMPLOYEE" && ctx.employeeId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.employeeSkill.delete({
      where: {
        employeeId_skillId: { employeeId: id, skillId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to remove skill" }, { status: 500 });
  }
}
