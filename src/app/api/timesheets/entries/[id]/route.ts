/**
 * PATCH /api/timesheets/entries/[id] — update a single timesheet entry
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinEditWindow, isFutureDate } from "@/lib/timesheet-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch entry with timesheet and employee
  const entry = await prisma.timesheetEntry.findUnique({
    where: { id },
    include: {
      timesheet: {
        include: { employee: { select: { userId: true } } },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  // Verify ownership
  if (entry.timesheet.employee.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only DRAFT or REJECTED timesheets can be edited
  if (
    entry.timesheet.status !== "DRAFT" &&
    entry.timesheet.status !== "REJECTED"
  ) {
    return NextResponse.json(
      { error: "This timesheet has been submitted and cannot be edited." },
      { status: 400 }
    );
  }

  // 48-hour edit window check
  if (isFutureDate(entry.date)) {
    return NextResponse.json(
      { error: "Cannot fill timesheet for future dates." },
      { status: 400 }
    );
  }

  if (!isWithinEditWindow(entry.date)) {
    return NextResponse.json(
      {
        error:
          "This date is outside the 48-hour edit window. You can only fill timesheets for today and yesterday.",
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const {
    dayType,
    startTime,
    endTime,
    breakMinutes,
    workDone,
    links,
  } = body;

  // Validate time fields if dayType is WORKING or HALF_DAY
  if (
    (dayType === "WORKING" || dayType === "HALF_DAY") &&
    startTime &&
    endTime
  ) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.timesheetEntry.update({
    where: { id },
    data: {
      ...(dayType !== undefined && { dayType }),
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      breakMinutes: breakMinutes !== undefined ? Number(breakMinutes) : 0,
      workDone: workDone?.trim() || null,
      links: Array.isArray(links) ? links.filter(Boolean) : [],
    },
  });

  return NextResponse.json({ success: true, entry: updated });
}
