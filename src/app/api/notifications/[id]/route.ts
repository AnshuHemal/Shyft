import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  await prisma.notification.updateMany({
    where: { id, recipientId: session.user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
