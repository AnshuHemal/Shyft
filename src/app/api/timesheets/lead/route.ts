/**
 * GET /api/timesheets/lead?month=M&year=Y
 * Returns all SUBMITTED timesheets assigned to the current employee as reporting lead.
 * Includes full entry data (tasks, links, dayType, workDone) for the tabular review view.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireLead() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;

  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "EMPLOYEE") return null;

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });

  if (!employee) return null;
  return { session, employee };
}

export async function GET(request: Request) {
  const ctx = await requireLead();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  // Fetch all timesheets where this lead is the assigned reviewer (any status for history)
  const timesheets = await prisma.timesheet.findMany({
    where: {
      reportingLeadId: ctx.employee.id,
      month,
      year,
      organizationId: ctx.employee.organizationId,
      // Show SUBMITTED (pending) + APPROVED/REJECTED (history) — not DRAFT
      status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          department: true,
          employeeId: true,
          avatar: true,
        },
      },
      entries: {
        orderBy: { date: "asc" },
        include: {
          tasks: {
            include: {
              project: {
                select: { id: true, name: true, isLearning: true },
              },
            },
            orderBy: { startTime: "asc" },
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Also fetch org holidays for the month so the review view can show holiday names
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const holidays = await prisma.holiday.findMany({
    where: {
      organizationId: ctx.employee.organizationId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { date: true, name: true },
  });

  // Transform to match the expected structure
  const approvals = timesheets.map((ts) => ({
    ...ts.employee,
    timesheets: [
      {
        id: ts.id,
        status: ts.status,
        submittedAt: ts.submittedAt,
        reviewedAt: ts.reviewedAt,
        rejectionNote: ts.rejectionNote,
        entries: ts.entries.map((e) => ({
          id: e.id,
          date: e.date,
          dayType: e.dayType,
          breakMinutes: e.breakMinutes ?? 0,
          workDone: e.workDone,
          links: e.links ?? [],
          tasks: e.tasks.map((t) => ({
            id: t.id,
            startTime: t.startTime,
            endTime: t.endTime,
            subject: t.subject,
            description: t.description,
            isLearning: t.isLearning,
            links: (t.links as { url: string; label: string }[]) ?? [],
            project: t.project,
          })),
        })),
      },
    ],
  }));

  return NextResponse.json({
    approvals,
    month,
    year,
    holidays: holidays.map((h) => ({
      date: h.date.toISOString(),
      name: h.name,
    })),
  });
}
