import { Metadata } from "next";
import { LeadApprovals } from "@/components/employee/lead-approvals";

export const metadata: Metadata = {
  title: "Team Approvals | SHYFT",
  description: "Review and approve your team's timesheets.",
};

export default function ApprovalsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <LeadApprovals />
    </div>
  );
}
