/**
 * DELETE /api/employees/[id]/delete
 *
 * Permanently deletes an employee and their linked User account.
 * This is irreversible — all timesheets and data are also deleted (cascade).
 *
 * Requires: authenticated HR/Admin session, employee must belong to their org.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
    select: { id: true, firstName: true, lastName: true, userId: true },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  // Delete employee (cascades to timesheets, entries via schema)
  await prisma.employee.delete({ where: { id } });

  // Also delete the linked User account (and their sessions/accounts via cascade)
  if (employee.userId) {
    await prisma.user.delete({ where: { id: employee.userId } }).catch(() => {
      // Ignore if user was already deleted
    });
  }

  return NextResponse.json({
    success: true,
    message: `${employee.firstName} ${employee.lastName} has been permanently deleted.`,
  });
}
