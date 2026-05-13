import type { Metadata } from "next";
import { TeamLeave } from "@/components/employee/leave/team-leave";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Team Leave | SHYFT",
  description: "View approved leaves for your team members.",
};

export default async function TeamLeavePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "EMPLOYEE") redirect("/dashboard");

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!employee) redirect("/login");

  const directReportsCount = await prisma.employee.count({
    where: { reportingToId: employee.id },
  });

  if (directReportsCount === 0) redirect("/employee");

  return <TeamLeave />;
}
