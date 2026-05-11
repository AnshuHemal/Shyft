import type { Metadata } from "next";
import { EmployeeForm } from "@/components/dashboard/employees/employee-form";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = { title: "Add Employee" };

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add employee"
        description="Create a new employee profile for your organisation."
      />
      <EmployeeForm mode="create" />
    </div>
  );
}
