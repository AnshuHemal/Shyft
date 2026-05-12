/**
 * GET  /api/timesheets?month=M&year=Y  — get or auto-create timesheet for current employee
 * POST /api/timesheets/submit           — submit timesheet for review
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysInMonth, isWeekend } from "@/lib/timesheet-utils";

async function requireEmployee() {
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

// ── GET — fetch timesheet (auto-create if missing) ────────────────────────────
export async function GET(request: Request) {
  const ctx = await requireEmployee();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  // Fetch org holidays for this month
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const holidays = await prisma.holiday.findMany({
    where: {
      organizationId: ctx.employee.organizationId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { date: true, name: true },
  });

  const holidayDates = new Set(
    holidays.map((h) => h.date.toISOString().split("T")[0])
  );

  // Get or create timesheet
  let timesheet = await prisma.timesheet.findUnique({
    where: {
      employeeId_month_year: {
        employeeId: ctx.employee.id,
        month,
        year,
      },
    },
    include: { entries: { orderBy: { date: "asc" } } },
  });

  if (!timesheet) {
    // Auto-create with all days pre-populated
    const days = getDaysInMonth(month, year);

    timesheet = await prisma.timesheet.create({
      data: {
        month,
        year,
        employeeId: ctx.employee.id,
        organizationId: ctx.employee.organizationId,
        entries: {
          create: days.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const weekend = isWeekend(date);
            const holiday = holidayDates.has(dateStr);
            return {
              date,
              dayType: holiday ? "HOLIDAY" : weekend ? "WEEKEND" : "WORKING",
              links: [],
            };
          }),
        },
      },
      include: { entries: { orderBy: { date: "asc" } } },
    });
  } else {
    // Sync any missing days (e.g. if timesheet was created before holidays were added)
    const existingDates = new Set(
      timesheet.entries.map((e) => e.date.toISOString().split("T")[0])
    );
    const days = getDaysInMonth(month, year);
    const missingDays = days.filter(
      (d) => !existingDates.has(d.toISOString().split("T")[0])
    );

    if (missingDays.length > 0) {
      await prisma.timesheetEntry.createMany({
        data: missingDays.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const weekend = isWeekend(date);
          const holiday = holidayDates.has(dateStr);
          return {
            date,
            dayType: holiday ? "HOLIDAY" : weekend ? "WEEKEND" : "WORKING",
            links: [],
            timesheetId: timesheet!.id,
          };
        }),
      });
    }

    // ── Sync holiday changes on existing entries ──────────────────────────────
    // Only sync entries that are in DRAFT or REJECTED status (not submitted/approved)
    if (timesheet.status === "DRAFT" || timesheet.status === "REJECTED") {
      const entriesToUpdate: { id: string; newDayType: string }[] = [];

      for (const entry of timesheet.entries) {
        const dateStr = entry.date.toISOString().split("T")[0];
        const isHolidayDate = holidayDates.has(dateStr);
        const isWeekendDate = isWeekend(entry.date);

        // Working/Weekend day that is now a holiday → mark as HOLIDAY
        if (
          isHolidayDate &&
          entry.dayType !== "HOLIDAY" &&
          entry.dayType !== "LEAVE" &&
          entry.dayType !== "HALF_DAY"
        ) {
          entriesToUpdate.push({ id: entry.id, newDayType: "HOLIDAY" });
        }

        // Was marked as HOLIDAY but holiday was removed → revert to WORKING or WEEKEND
        if (
          !isHolidayDate &&
          entry.dayType === "HOLIDAY"
        ) {
          entriesToUpdate.push({
            id: entry.id,
            newDayType: isWeekendDate ? "WEEKEND" : "WORKING",
          });
        }
      }

      // Batch update changed entries
      if (entriesToUpdate.length > 0) {
        await Promise.all(
          entriesToUpdate.map(({ id, newDayType }) =>
            prisma.timesheetEntry.update({
              where: { id },
              data: {
                dayType: newDayType as "HOLIDAY" | "WORKING" | "WEEKEND",
                // Clear time fields when marking as holiday
                ...(newDayType === "HOLIDAY" && {
                  startTime: null,
                  endTime: null,
                  breakMinutes: 0,
                }),
              },
            })
          )
        );
      }
    }

    // Re-fetch with all updated entries
    timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheet.id },
      include: { entries: { orderBy: { date: "asc" } } },
    });
  }

  return NextResponse.json({ timesheet, holidays });
}
