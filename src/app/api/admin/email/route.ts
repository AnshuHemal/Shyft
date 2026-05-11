import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendCustomEmail } from "@/lib/email";

async function requireSuperAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;
  const user = session.user as typeof session.user & { role: string };
  if (user.role !== "SUPERADMIN") return null;
  return session;
}

// POST /api/admin/email — send a custom email to a user
export async function POST(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { to, subject, message } = body as {
    to: string;
    subject: string;
    message: string;
  };

  if (!to || !subject || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await sendCustomEmail({ to, subject, message });

  return NextResponse.json({ success: true });
}
