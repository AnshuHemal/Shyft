import type { Metadata } from "next";
import { HRTimesheetDashboard } from "@/components/dashboard/timesheets/hr-timesheet-dashboard";

export const metadata: Metadata = { title: "Timesheets" };

export default function TimesheetsPage() {
  return <HRTimesheetDashboard />;
}
