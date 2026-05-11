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

// ── GET /api/departments — list all departments in org ────────────────────────
export async function GET() {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const departments = await prisma.department.findMany({
    where: { organizationId: ctx.orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });

  return NextResponse.json({ departments });
}

// ── POST /api/departments — create a new department ───────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Department name is required." },
      { status: 400 }
    );
  }

  // Check uniqueness within org
  const existing = await prisma.department.findUnique({
    where: {
      name_organizationId: { name, organizationId: ctx.orgId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A department with this name already exists." },
      { status: 409 }
    );
  }

  const department = await prisma.department.create({
    data: {
      name,
      description: body.description?.trim() || null,
      organizationId: ctx.orgId,
    },
    select: { id: true, name: true, description: true },
  });

  return NextResponse.json({ success: true, department }, { status: 201 });
}
