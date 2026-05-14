import type { Metadata } from "next";
import { EmployeeOnboardingWizard } from "@/components/employee-onboarding/wizard";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Complete your onboarding",
  description: "Submit your KYC and documents to complete your onboarding.",
};

export default async function EmployeeOnboardingPage() {
  const session = await getSession();
  const user = session?.user as any;
  
  // If already approved, show a nice message instead of the wizard
  if (user?.onboardingCompleted && user?.accountStatus === "APPROVED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <svg className="size-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Onboarding Complete</h2>
        <p className="text-muted-foreground">You have successfully completed your onboarding. Your account is fully unlocked.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
         <h1 className="text-2xl font-bold tracking-tight">Employee Onboarding</h1>
         <p className="text-sm text-muted-foreground">Please complete your KYC details within 5 days of joining.</p>
      </div>
      <EmployeeOnboardingWizard />
    </div>
  );
}
