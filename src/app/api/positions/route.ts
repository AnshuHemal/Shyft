import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── Helper: require admin with org ────────────────────────────────────────────

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

// ── GET /api/positions — list all positions in org ─────────────────────────────
export async function GET(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const positions = await prisma.position.findMany({
    where: {
      organizationId: ctx.orgId,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, level: true },
  });

  return NextResponse.json({ positions });
}

// ── POST /api/positions — create a new position ──────────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const json = await request.json();
  const { name, description, level } = json;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Position name is required" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.position.findUnique({
      where: {
        name_organizationId: {
          name: name.trim(),
          organizationId: ctx.orgId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Position with this name already exists" },
        { status: 409 }
      );
    }

    const position = await prisma.position.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        level: typeof level === "number" ? level : null,
        organizationId: ctx.orgId,
      },
      select: { id: true, name: true, description: true, level: true },
    });

    return NextResponse.json({ success: true, position }, { status: 201 });
  } catch (error) {
    console.error("Position creation error:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
