import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Shyft account.",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <LoginForm />;
}
