import type { Metadata } from "next";
import { TimesheetView } from "@/components/employee/timesheet-view";

export const metadata: Metadata = { title: "My Timesheet" };

export default function TimesheetPage() {
  return <TimesheetView />;
}
