import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/shell";
import { prisma } from "@/lib/prisma";

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
    onboardingCompleted: boolean;
  };

  // SuperAdmin goes to their own console
  if (user.role === "SUPERADMIN") redirect("/admin");

  // Must be approved to access the dashboard
  if (user.accountStatus !== "APPROVED") redirect("/under-review");

  // Must complete org onboarding before accessing the dashboard
  if (!user.onboardingCompleted) redirect("/onboarding");

  // Fetch the org for the shell (sidebar org name)
  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, logo: true, slug: true },
  });

  return (
    <DashboardShell user={session.user} org={org}>
      {children}
    </DashboardShell>
  );
}
