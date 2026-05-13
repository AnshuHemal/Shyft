import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SkillMapBoard } from "@/components/employee/skill-map/skill-map-board";
import { PageHeader } from "@/components/dashboard/page-header";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export const metadata: Metadata = { title: "Employee Skill Map" };

export default async function EmployeeSkillsPage({
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

  const actions = (
    <Link
      href="/dashboard/employees"
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 shadow-xs"
    >
      <ArrowLeftIcon className="size-4" />
      Back to Employees
    </Link>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.designation}${employee.department ? ` · ${employee.department}` : ""}`}
        actions={actions}
      />
      
      <div className="bg-background/50 rounded-3xl border border-border/40 p-1">
        <SkillMapBoard 
          employeeId={employee.id} 
          isReadOnly={true} 
          employeeName={`${employee.firstName} ${employee.lastName}`} 
        />
      </div>
    </div>
  );
}
