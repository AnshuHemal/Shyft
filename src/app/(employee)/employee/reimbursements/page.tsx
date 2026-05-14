import type { Metadata } from "next";
import { EmployeeReimbursements } from "@/components/employee/reimbursements/employee-reimbursements";

export const metadata: Metadata = {
  title: "Reimbursements",
  description: "Submit and track company expenses.",
};

export default function ReimbursementsPage() {
  return <EmployeeReimbursements />;
}
