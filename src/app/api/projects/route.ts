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
    return { user, orgId: org?.id, employeeId: null, role: "ADMIN" };
  }

  if (user.role === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true, organizationId: true, position: true },
    });
    if (!employee) return null;
    return { 
      user, 
      orgId: employee.organizationId, 
      employeeId: employee.id, 
      role: "EMPLOYEE",
      position: employee.position 
    };
  }

  return null;
}

export async function GET(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: {
      organizationId: ctx.orgId,
      ...(status && { status }),
      ...(ctx.role === "EMPLOYEE" && {
        OR: [
          { leadId: ctx.employeeId },
          { members: { some: { employeeId: ctx.employeeId! } } }
        ]
      })
    },
    include: {
      lead: {
        select: { id: true, firstName: true, lastName: true, avatar: true }
      },
      _count: {
        select: { members: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const ctx = await getCtx();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Seniority check for employees
  if (ctx.role === "EMPLOYEE") {
    const p = ctx.position?.toLowerCase() || "";
    const isSenior = p.includes("senior") || 
                     p.includes("lead") || 
                     p.includes("manager") ||
                     p.includes("head") ||
                     p.includes("architect") ||
                     p.includes("vp") ||
                     p.includes("director");
    
    if (!isSenior) {
      return NextResponse.json({ error: "Only senior employees can create projects" }, { status: 403 });
    }
  }

  try {
    const json = await request.json();
    const { name, description, client, budget, color, isLearning } = json;

    if (!name) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        client,
        budget: budget ? parseFloat(budget) : null,
        color: color || "bg-primary",
        isLearning: !!isLearning,
        organizationId: ctx.orgId!,
        leadId: ctx.employeeId,
      },
    });

    // If created by employee, automatically add them as a member too
    if (ctx.employeeId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          employeeId: ctx.employeeId,
          role: "Project Lead",
        }
      });
    }

    // Fetch the full project with relations to match the GET response structure
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        lead: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    return NextResponse.json({ project: fullProject }, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
