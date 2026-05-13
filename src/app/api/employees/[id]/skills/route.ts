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

// ── GET /api/employees/[id]/skills — get employee's skill map ─────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  // Authorization logic:
  // 1. HR Admins (ctx.role === "ADMIN") can view any employee in their org.
  // 2. Employees (ctx.role === "EMPLOYEE") can view:
  //    a. Their own skills (ctx.employeeId === id)
  //    b. Skills of employees reporting to them (direct reports)
  
  const isSelf = ctx.role === "EMPLOYEE" && ctx.employeeId === id;
  const isAdmin = ctx.role === "ADMIN";
  
  let isLead = false;
  if (ctx.role === "EMPLOYEE" && !isSelf) {
    const report = await prisma.employee.findFirst({
      where: { id, reportingToId: ctx.employeeId! },
      select: { id: true },
    });
    if (report) isLead = true;
  }

  if (!isAdmin && !isSelf && !isLead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify employee belongs to this org
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const employeeSkills = await prisma.employeeSkill.findMany({
    where: { employeeId: id },
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
    orderBy: [{ skill: { category: "asc" } }, { skill: { name: "asc" } }],
  });

  return NextResponse.json({ employeeSkills });
}

// ── POST /api/employees/[id]/skills — add a skill to employee's map ───────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  // Employees can only modify their own skills
  if (ctx.role === "EMPLOYEE" && ctx.employeeId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  try {
    const json = await request.json();
    const { skillId, proficiency = "BEGINNER" } = json;

    if (!skillId) return NextResponse.json({ error: "skillId is required" }, { status: 400 });

    // Verify skill belongs to this org
    const skill = await prisma.skill.findFirst({
      where: { id: skillId, organizationId: ctx.orgId },
    });
    if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    const employeeSkill = await prisma.employeeSkill.create({
      data: {
        employeeId: id,
        skillId,
        proficiency,
      },
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

    return NextResponse.json({ employeeSkill }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "This skill is already on your map" }, { status: 409 });
    }
    console.error("Add skill error:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}
