/**
 * GET /api/timesheets/hr?month=M&year=Y
 * Returns all employees' timesheets for the given month — HR only.
 */

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

export async function GET(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  // Get all employees in org
  const employees = await prisma.employee.findMany({
    where: { organizationId: ctx.orgId, status: { not: "TERMINATED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      employeeId: true,
      timesheets: {
        where: { month, year },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionNote: true,
          _count: { select: { entries: true } },
          entries: {
            where: { dayType: "WORKING", startTime: { not: null } },
            select: { startTime: true, endTime: true, breakMinutes: true },
          },
        },
      },
    },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({ employees, month, year });
}
