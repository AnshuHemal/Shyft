import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your free SHYFT account.",
};

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <SignupForm />;
}
