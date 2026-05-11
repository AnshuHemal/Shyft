import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & {
    role: string;
    accountStatus: string;
  };

  // SuperAdmin goes to their own dashboard
  if (user.role === "SUPERADMIN") {
    redirect("/admin");
  }

  // Regular users must be approved to access the dashboard
  if (user.accountStatus !== "APPROVED") {
    redirect("/under-review");
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
