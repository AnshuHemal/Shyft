/**
 * PATCH /api/timesheets/entries/[id] — update a single timesheet entry
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinEditWindow, isFutureDate, calcNetMinutes } from "@/lib/timesheet-utils";

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
  const { dayType, tasks, breakMinutes } = body;

  // Validate task times: End time must strictly exceed Start time
  if (dayType !== "LEAVE" && Array.isArray(tasks)) {
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.startTime || !t.endTime) {
        return NextResponse.json(
          { error: `Task #${i + 1}: Both Start time and End time are required.` },
          { status: 400 }
        );
      }
      if (calcNetMinutes(t.startTime, t.endTime, 0) <= 0) {
        return NextResponse.json(
          { error: `Task #${i + 1}: End time must be after start time.` },
          { status: 400 }
        );
      }
      if (!t.subject || !String(t.subject).trim()) {
        return NextResponse.json(
          { error: `Task #${i + 1}: Task subject is required.` },
          { status: 400 }
        );
      }
    }
  }

  const updated = await prisma.timesheetEntry.update({
    where: { id },
    data: {
      ...(dayType !== undefined && { dayType }),
      ...(breakMinutes !== undefined && { breakMinutes: parseInt(breakMinutes) || 0 }),
      // Clear legacy fields if they exist
      startTime: null,
      endTime: null,
      workDone: null,
      links: [],
      
      // Update tasks
      tasks: tasks ? {
        deleteMany: {}, // Simplest way to sync: remove all and recreate
        create: tasks.map((t: any) => ({
          startTime: t.startTime,
          endTime: t.endTime,
          taskId: t.taskId ? String(t.taskId).trim() : null,
          subject: t.subject,
          description: t.description,
          isLearning: !!t.isLearning,
          links: t.links || [],
          projectId: t.projectId || null,
        })),
      } : undefined,
    },
    include: {
      tasks: {
        include: { project: true }
      }
    }
  });

  return NextResponse.json({ success: true, entry: updated });
}
