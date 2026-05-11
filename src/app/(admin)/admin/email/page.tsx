import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminEmailCompose } from "@/components/admin/admin-email-compose";

export const metadata: Metadata = { title: "Send Email | Shyft Admin" };

export default async function AdminEmailPage() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, accountStatus: true },
  });

  return <AdminEmailCompose users={users} />;
}
