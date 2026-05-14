import type { Metadata } from "next";
import { HRLeavePageWrapper } from "@/components/dashboard/leave/hr-leave-page-wrapper";

export const metadata: Metadata = {
  title: "Leave & Comp-Off",
  description: "Review and manage employee leave and comp-off requests.",
};

export default function LeaveManagementPage() {
  return <HRLeavePageWrapper />;
}
