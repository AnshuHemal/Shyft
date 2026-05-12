import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmployeeOverview } from "@/components/employee/employee-overview";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function EmployeeDashboardPage() {
  const session = await getSession();
  const user = session!.user;

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      employeeId: true,
      joiningDate: true,
      employmentType: true,
      status: true,
      position: true,
      organization: { select: { name: true } },
    },
  });

  // Current month timesheet summary
  const now = new Date();
  const timesheet = await prisma.timesheet.findUnique({
    where: {
      employeeId_month_year: {
        employeeId: employee!.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
    select: {
      id: true,
      status: true,
      _count: { select: { entries: true } },
      entries: {
        where: { dayType: "WORKING", startTime: { not: null } },
        select: { startTime: true, endTime: true, breakMinutes: true },
      },
    },
  });

  return (
    <EmployeeOverview
      employee={employee!}
      timesheet={timesheet}
      currentMonth={now.getMonth() + 1}
      currentYear={now.getFullYear()}
    />
  );
}
