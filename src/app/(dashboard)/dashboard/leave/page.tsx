import type { Metadata } from "next";
import { HRLeaveManagement } from "@/components/dashboard/leave/hr-leave-management";

export const metadata: Metadata = {
  title: "Leave Requests",
  description: "Review and manage employee leave applications.",
};

export default function LeaveManagementPage() {
  return <HRLeaveManagement />;
}
