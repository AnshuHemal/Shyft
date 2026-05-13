import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/employees/team
 * Returns all direct reports for the currently logged-in employee (lead).
 */
export async function GET() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = session.user as any;
  
  // Only employees can have teams (leads)
  if (user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });

  if (!currentEmployee) {
    return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
  }

  const team = await prisma.employee.findMany({
    where: {
      reportingToId: currentEmployee.id,
      organizationId: currentEmployee.organizationId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      designation: true,
      department: true,
      employeeId: true,
      avatar: true,
      status: true,
    },
    orderBy: { firstName: "asc" },
  });

  return NextResponse.json({ team });
}
