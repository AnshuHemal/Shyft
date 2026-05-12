import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmployeeProfile } from "@/components/employee/employee-profile";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  const user = session!.user;

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
  });

  return <EmployeeProfile employee={employee!} />;
}
