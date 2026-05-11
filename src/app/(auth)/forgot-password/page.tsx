import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your SHYFT account password.",
};

export default async function ForgotPasswordPage() {
  // Already signed in — no reason to be here
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <ForgotPasswordForm />;
}
