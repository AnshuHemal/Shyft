import type { Metadata } from "next";
import { HolidayManager } from "@/components/dashboard/timesheets/holiday-manager";

export const metadata: Metadata = { title: "Holiday Calendar" };

export default function HolidaysPage() {
  return <HolidayManager />;
}
