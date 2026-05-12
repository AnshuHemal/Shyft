import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmployeeShell } from "@/components/employee/employee-shell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & { role: string };

  // Only EMPLOYEE role can access this layout
  if (user.role !== "EMPLOYEE") {
    if (user.role === "SUPERADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  // Fetch the employee profile linked to this user
  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      employeeId: true,
      organization: {
        select: { id: true, name: true },
      },
    },
  });

  if (!employee) {
    // Employee record not found — sign out and redirect
    redirect("/login");
  }

  return (
    <EmployeeShell
      user={session.user}
      orgName={employee.organization.name}
      employeeProfile={{
        firstName: employee.firstName,
        lastName: employee.lastName,
        designation: employee.designation,
        department: employee.department,
        employeeId: employee.employeeId,
      }}
    >
      {children}
    </EmployeeShell>
  );
}
