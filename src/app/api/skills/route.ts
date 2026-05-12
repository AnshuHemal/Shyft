import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Auth context helper ───────────────────────────────────────────────────────

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

// ── GET /api/skills — list org skill library ──────────────────────────────────

export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";

  const skills = await prisma.skill.findMany({
    where: {
      organizationId: ctx.orgId,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(category && { category }),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ skills });
}

// ── POST /api/skills — HR creates a new skill in the library ─────────────────

export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Only HR/Admin can manage the skill library
  if (ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only HR admins can manage the skill library" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const { name, category, description, color } = json;

    if (!name?.trim()) return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    if (!category?.trim()) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        color: color || "bg-primary",
        organizationId: ctx.orgId,
      },
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A skill with this name already exists" }, { status: 409 });
    }
    console.error("Skill creation error:", error);
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
