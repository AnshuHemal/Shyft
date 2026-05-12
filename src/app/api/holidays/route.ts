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

// GET /api/holidays?year=YYYY
export async function GET(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const holidays = await prisma.holiday.findMany({
    where: {
      organizationId: ctx.orgId,
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ holidays });
}

// POST /api/holidays — create holiday
export async function POST(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { name, date, description } = body;

  if (!name?.trim() || !date) {
    return NextResponse.json({ error: "Name and date are required." }, { status: 400 });
  }

  const holidayDate = new Date(date);
  if (isNaN(holidayDate.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  // Normalize to UTC midnight
  const normalizedDate = new Date(
    Date.UTC(holidayDate.getFullYear(), holidayDate.getMonth(), holidayDate.getDate())
  );

  try {
    const holiday = await prisma.holiday.create({
      data: {
        name: name.trim(),
        date: normalizedDate,
        description: description?.trim() || null,
        organizationId: ctx.orgId,
      },
    });
    return NextResponse.json({ success: true, holiday }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A holiday on this date already exists." },
      { status: 409 }
    );
  }
}
