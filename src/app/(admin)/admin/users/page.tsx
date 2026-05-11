import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UserReviewTable } from "@/components/admin/user-review-table";

export const metadata: Metadata = { title: "User Reviews" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: [
      // Pending first, then by date
      { accountStatus: "asc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      accountStatus: true,
      reviewNotes: true,
      reviewedAt: true,
    },
  });

  return <UserReviewTable initialUsers={users} />;
}
