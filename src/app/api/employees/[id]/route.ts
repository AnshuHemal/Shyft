import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrypt, randomBytes, createHash } from "node:crypto";

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

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => {
        if (err) reject(err);
        else resolve(`${salt}:${key.toString("hex")}`);
      }
    );
  });
}

// ── GET /api/employees/[id] ───────────────────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  return NextResponse.json({ employee });
}

// ── PATCH /api/employees/[id] — update employee ───────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const body = await request.json();

  // ── Employee ID uniqueness check ──────────────────────────────────────────
  if (body.employeeId?.trim() && body.employeeId.trim() !== employee.employeeId) {
    const idInUse = await prisma.employee.findFirst({
      where: {
        organizationId: ctx.orgId,
        employeeId: body.employeeId.trim(),
        id: { not: id },
      },
      select: { id: true },
    });
    if (idInUse) {
      return NextResponse.json(
        { error: "This Employee ID is already assigned to another employee." },
        { status: 409 }
      );
    }
  }

  // ── Password uniqueness check ─────────────────────────────────────────────
  let passwordHash: string | undefined;
  let passwordCheck: string | undefined;

  if (body.password?.trim() && body.password.trim().length >= 6) {
    const plain = body.password.trim();
    passwordCheck = createHash("sha256").update(plain).digest("hex");

    const inUse = await prisma.employee.findFirst({
      where: {
        organizationId: ctx.orgId,
        passwordCheck,
        id: { not: id },
      },
      select: { id: true },
    });

    if (inUse) {
      return NextResponse.json(
        { error: "This password is already in use by another employee. Please choose a different one." },
        { status: 409 }
      );
    }

    passwordHash = await hashPassword(plain);
  }

  try {
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(body.firstName?.trim() && { firstName: body.firstName.trim() }),
        ...(body.lastName?.trim() && { lastName: body.lastName.trim() }),
        ...(body.email?.trim() && { email: body.email.trim().toLowerCase() }),
        phone: body.phone?.trim() || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        address: body.address?.trim() || null,
        employeeId: body.employeeId?.trim() || null,
        ...(body.designation?.trim() && { designation: body.designation.trim() }),
        department: body.department?.trim() || null,
        position: body.position?.trim() || null,
        ...(body.employmentType && { employmentType: body.employmentType }),
        ...(body.status && { status: body.status }),
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
        leavingDate: body.leavingDate ? new Date(body.leavingDate) : null,
        salary:
          body.salary !== undefined
            ? body.salary ? parseFloat(body.salary) : null
            : undefined,
        currency: body.currency || null,
        notes: body.notes?.trim() || null,
        ...(passwordHash && { password: passwordHash }),
        ...(passwordCheck && { passwordCheck }),
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error("[Employees] Update failed:", error);
    return NextResponse.json(
      { error: "Failed to update employee." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/employees/[id] — soft delete (set TERMINATED) ────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: ctx.orgId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  await prisma.employee.update({
    where: { id },
    data: { status: "TERMINATED", leavingDate: new Date() },
  });

  return NextResponse.json({ success: true });
}
