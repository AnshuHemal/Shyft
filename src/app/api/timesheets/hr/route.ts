/**
 * GET /api/timesheets/hr?month=M&year=Y
 * Returns all employees' timesheets for the given month — HR only.
 * Includes full entry + task data for the expandable timesheet view.
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

  const employees = await prisma.employee.findMany({
    where: { organizationId: ctx.orgId, status: { not: "TERMINATED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      employeeId: true,
      avatar: true,
      timesheets: {
        where: { month, year },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          hrSubmittedAt: true,
          hrReviewedAt: true,
          rejectionNote: true,
          // Full entries with tasks for the expandable view
          entries: {
            orderBy: { date: "asc" },
            include: {
              tasks: {
                include: {
                  project: { select: { id: true, name: true, isLearning: true } },
                },
                orderBy: { startTime: "asc" },
              },
            },
          },
        },
      },
    },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
  });

  // Fetch org holidays for the month
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const holidays = await prisma.holiday.findMany({
    where: {
      organizationId: ctx.orgId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { date: true, name: true },
  });

  return NextResponse.json({
    employees,
    month,
    year,
    holidays: holidays.map((h) => ({ date: h.date.toISOString(), name: h.name })),
  });
}
