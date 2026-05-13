import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leave/team
 * Returns all APPROVED leave applications for the current employee's direct reports.
 * This is the read-only view for reporting managers.
 */
export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const user = session.user as any;
  if (user.role !== "EMPLOYEE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentEmployee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });

  if (!currentEmployee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leaves = await prisma.leaveApplication.findMany({
    where: {
      reportingToId: currentEmployee.id,
      organizationId: currentEmployee.organizationId,
      status: "APPROVED",
    },
    include: {
      employee: {
        select: {
          id: true, firstName: true, lastName: true,
          designation: true, department: true, avatar: true,
        },
      },
      reportingTo: {
        select: { firstName: true, lastName: true, designation: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ leaves });
}
