import type { Metadata } from "next";
import { HRReimbursementManagement } from "@/components/dashboard/reimbursements/hr-reimbursement-management";

export const metadata: Metadata = {
  title: "Reimbursements",
  description: "Review and manage employee expense claims.",
};

export default function ReimbursementManagementPage() {
  return <HRReimbursementManagement />;
}
