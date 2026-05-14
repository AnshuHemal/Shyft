import type { Metadata } from "next";
import { HROnboardingManagement } from "@/components/dashboard/onboarding/hr-onboarding-management";

export const metadata: Metadata = {
  title: "Employee Onboarding",
  description: "Review and manage new employee onboarding documents.",
};

export default function OnboardingManagementPage() {
  return <HROnboardingManagement />;
}
