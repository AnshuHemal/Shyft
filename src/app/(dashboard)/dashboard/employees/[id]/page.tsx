import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmployeeForm } from "@/components/dashboard/employees/employee-form";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Edit Employee" };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const user = session!.user;

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!org) notFound();

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: org.id },
  });

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.designation}${employee.department ? ` · ${employee.department}` : ""}`}
      />
      <EmployeeForm mode="edit" employee={employee} />
    </div>
  );
}
