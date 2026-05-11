import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminOverview } from "@/components/admin/admin-overview";

export const metadata: Metadata = { title: "Admin Overview | Shyft" };

export default async function AdminPage() {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", accountStatus: "PENDING_REVIEW" } }),
    prisma.user.count({ where: { role: "USER", accountStatus: "APPROVED" } }),
    prisma.user.count({ where: { role: "USER", accountStatus: "REJECTED" } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  return (
    <AdminOverview
      stats={{ total, pending, approved, rejected }}
      recentUsers={recentUsers}
    />
  );
}
