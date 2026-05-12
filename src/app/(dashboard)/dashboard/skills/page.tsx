import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SkillLibraryManager } from "@/components/dashboard/skills/skill-library-manager";

export default async function SkillsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & {
    role: string;
    accountStatus: string;
    onboardingCompleted: boolean;
  };

  if (user.role !== "USER") redirect("/employee");
  if (user.accountStatus !== "APPROVED") redirect("/under-review");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!org) redirect("/onboarding");

  return <SkillLibraryManager orgId={org.id} />;
}
