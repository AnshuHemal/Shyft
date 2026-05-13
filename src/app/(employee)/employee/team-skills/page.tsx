import { Metadata } from "next";
import { TeamSkills } from "@/components/employee/team-skills";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Team Skills | SHYFT",
  description: "Monitor and manage the skill maps of your team.",
};

export default async function TeamSkillsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "EMPLOYEE") redirect("/dashboard");

  // Verify they are a lead (have direct reports)
  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!employee) redirect("/login");

  const directReportsCount = await prisma.employee.count({
    where: { reportingToId: employee.id },
  });

  // If not a lead, redirect to overview
  if (directReportsCount === 0) redirect("/employee");

  return <TeamSkills />;
}
