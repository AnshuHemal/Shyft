import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/employees/reporting-persons
 * Returns the employee's current reporting manager (pre-populated from profile)
 * along with any other eligible managers in the org for override selection.
 */
export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const user = session.user as any;
  if (user.role !== "EMPLOYEE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true, organizationId: true, reportingToId: true },
  });

  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Walk up the full reporting chain: direct manager, their manager, and so on.
  const persons: { id: string; firstName: string; lastName: string; designation: string; avatar: string | null }[] = [];

  let currentReportingToId: string | null = employee.reportingToId;

  while (currentReportingToId) {
    const manager = await prisma.employee.findUnique({
      where: { id: currentReportingToId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        avatar: true,
        reportingToId: true,
        organizationId: true,
      },
    });

    // Stop if manager not found or belongs to a different org (safety check)
    if (!manager || manager.organizationId !== employee.organizationId) break;

    persons.push({
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      designation: manager.designation,
      avatar: manager.avatar,
    });

    currentReportingToId = manager.reportingToId;
  }

  return NextResponse.json({
    persons,
    defaultId: employee.reportingToId ?? null,
  });
}
