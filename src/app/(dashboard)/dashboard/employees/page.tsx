import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmployeeList } from "@/components/dashboard/employees/employee-list";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlusIcon } from "lucide-react";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const session = await getSession();
  const user = session!.user;

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true },
  });

  const employees = org
    ? await prisma.employee.findMany({
        where: { organizationId: org.id },
        orderBy: [{ status: "asc" }, { firstName: "asc" }],
      })
    : [];

  // Get unique departments for filter
  const departments = [
    ...new Set(
      employees.map((e) => e.department).filter(Boolean) as string[]
    ),
  ].sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`${employees.length} ${employees.length === 1 ? "employee" : "employees"} in ${org?.name ?? "your organisation"}`}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/employees/new" />} className="gap-1.5">
            <PlusIcon className="size-4" />
            Add employee
          </Button>
        }
      />
      <EmployeeList initialEmployees={employees} departments={departments} adminEmail={user.email} />
    </div>
  );
}
