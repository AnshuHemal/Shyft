/**
 * POST /api/employees/check-password
 *
 * Checks whether a given password is already in use within the organisation.
 * Uses SHA-256 of the plaintext for comparison — fast, deterministic, and
 * avoids storing plaintext while still enabling uniqueness checks.
 *
 * Body: { password: string, excludeEmployeeId?: string }
 * Response: { available: boolean }
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";

async function requireAdminWithOrg() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) return null;

  const user = session.user as typeof session.user & {
    accountStatus: string;
    role: string;
  };

  if (user.accountStatus !== "APPROVED" || user.role === "SUPERADMIN") return null;

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!org) return null;
  return { session, orgId: org.id };
}

export async function POST(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { password, excludeEmployeeId } = body as {
    password: string;
    excludeEmployeeId?: string;
  };

  if (!password?.trim()) {
    return NextResponse.json({ available: true });
  }

  // SHA-256 of the plaintext password — used only for uniqueness, not auth
  const check = createHash("sha256").update(password.trim()).digest("hex");

  const existing = await prisma.employee.findFirst({
    where: {
      organizationId: ctx.orgId,
      passwordCheck: check,
      ...(excludeEmployeeId && { id: { not: excludeEmployeeId } }),
    },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
