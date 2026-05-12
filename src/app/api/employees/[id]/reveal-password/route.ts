/**
 * POST /api/employees/[id]/reveal-password
 *
 * Two-step endpoint:
 *
 * Step 1 — action: "send-otp"
 *   Sends a verification OTP to the admin's email.
 *   Returns: { success: true, email: string }
 *
 * Step 2 — action: "verify"
 *   Verifies the OTP and returns the decrypted employee password.
 *   Body: { action: "verify", otp: string }
 *   Returns: { password: string, employeeName: string }
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDecipheriv, createHash } from "node:crypto";

// ── Auth guard ────────────────────────────────────────────────────────────────

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

// ── Decryption ────────────────────────────────────────────────────────────────

function deriveKey(): Buffer {
  return createHash("sha256")
    .update(process.env.BETTER_AUTH_SECRET ?? "dev-secret")
    .digest();
}

function decryptPassword(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const [ivHex, authTagHex, ciphertextHex] = parts;

  const key = deriveKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "send-otp" | "verify";

  // ── Step 1: Send OTP to admin's email ──────────────────────────────────────
  if (action === "send-otp") {
    // Check upfront whether the employee has a revealable password
    // so the admin doesn't waste an OTP on an employee that can't be revealed
    const employeeCheck = await prisma.employee.findFirst({
      where: { id, organizationId: ctx.orgId },
      select: { id: true, passwordEncrypted: true },
    });

    if (!employeeCheck) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (!employeeCheck.passwordEncrypted) {
      return NextResponse.json(
        {
          error:
            "This employee's password cannot be revealed because it was set before the secure reveal feature was enabled. " +
            "Please edit the employee and set a new password to enable this feature.",
          code: "NO_ENCRYPTED_PASSWORD",
        },
        { status: 404 }
      );
    }

    try {
      await auth.api.sendVerificationOTP({
        body: {
          email: ctx.session.user.email,
          type: "sign-in",
        },
      });

      return NextResponse.json({
        success: true,
        email: ctx.session.user.email,
      });
    } catch (error) {
      console.error("[reveal-password] send-otp failed:", error);
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── Step 2: Verify OTP and return decrypted password ──────────────────────
  if (action === "verify") {
    const { otp } = body as { otp: string };

    if (!otp?.trim() || otp.trim().length < 6) {
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    }

    // Verify OTP using better-auth's check endpoint (doesn't change session)
    try {
      const result = await auth.api.checkVerificationOTP({
        body: {
          email: ctx.session.user.email,
          otp: otp.trim(),
          type: "sign-in",
        },
      });

      if (!result?.success) {
        return NextResponse.json(
          { error: "Invalid or expired verification code." },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 }
      );
    }

    // Fetch employee
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: ctx.orgId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordEncrypted: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (!employee.passwordEncrypted) {
      return NextResponse.json(
        { error: "No password has been set for this employee." },
        { status: 404 }
      );
    }

    try {
      const password = decryptPassword(employee.passwordEncrypted);
      return NextResponse.json({
        password,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.email,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to decrypt password. Please contact support." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
