import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set up your organisation",
  description: "Tell us about your company to get started with SHYFT.",
};

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & {
    role: string;
    accountStatus: string;
    onboardingCompleted: boolean;
  };

  // Guards
  if (user.role === "SUPERADMIN") redirect("/admin");
  if (user.accountStatus !== "APPROVED") redirect("/under-review");

  // Already onboarded — go to dashboard
  if (user.onboardingCompleted) redirect("/dashboard");

  // Check if org already exists (e.g. page refresh mid-wizard)
  const existingOrg = await prisma.organization.findUnique({
    where: { ownerId: user.id },
  });

  return (
    <OnboardingWizard
      user={session.user}
      existingOrg={existingOrg}
    />
  );
}
