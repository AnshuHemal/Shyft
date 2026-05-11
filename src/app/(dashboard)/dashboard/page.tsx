import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { DashboardOverview } from "@/components/dashboard/overview";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();

  return <DashboardOverview user={session!.user} />;
}
