import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & { role: string };

  if (user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
