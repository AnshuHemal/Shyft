import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SkillMapBoard } from "@/components/employee/skill-map/skill-map-board";

export default async function SkillMapPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "EMPLOYEE") redirect("/dashboard");

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!employee) redirect("/login");

  return <SkillMapBoard employeeId={employee.id} />;
}
