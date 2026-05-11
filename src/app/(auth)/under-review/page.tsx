import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UnderReviewScreen } from "@/components/auth/under-review-screen";

export const metadata: Metadata = {
  title: "Account Under Review",
  description: "Your SHYFT account is currently under review.",
};

export default async function UnderReviewPage() {
  const session = await getSession();

  // Not logged in — send to login
  if (!session) redirect("/login");

  // SuperAdmin or approved users shouldn't be here
  const user = session.user as typeof session.user & {
    role: string;
    accountStatus: string;
  };

  if (user.role === "SUPERADMIN" || user.accountStatus === "APPROVED") {
    redirect("/dashboard");
  }

  return <UnderReviewScreen user={session.user} />;
}
