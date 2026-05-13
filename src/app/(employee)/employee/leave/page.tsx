import type { Metadata } from "next";
import { EmployeeLeave } from "@/components/employee/leave/employee-leave";

export const metadata: Metadata = {
  title: "Leave Management | SHYFT",
  description: "Apply and track your leave requests.",
};

export default function LeavePage() {
  return <EmployeeLeave />;
}
