import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrypt, randomBytes, createHash, createCipheriv } from "node:crypto";

// ── Encryption helpers ────────────────────────────────────────────────────────

function deriveKey(): Buffer {
  return createHash("sha256")
    .update(process.env.BETTER_AUTH_SECRET ?? "dev-secret")
    .digest();
}

// Encrypt plaintext with AES-256-GCM
// Returns: "iv_hex:authTag_hex:ciphertext_hex"
function encryptPassword(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

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

// Hash password using better-auth's exact scrypt parameters
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

// Auto-generate employee ID: EMP-XXXX (4 random uppercase alphanumeric)
function generateEmployeeId(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `EMP-${suffix}`;
}

// ── GET /api/employees ────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department") ?? "";
  const status = searchParams.get("status") ?? "";

  const employees = await prisma.employee.findMany({
    where: {
      organizationId: ctx.orgId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { designation: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(department && { department }),
      ...(status && {
        status: status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED",
      }),
    },
    orderBy: [{ status: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({ employees });
}

// ── POST /api/employees — create employee ─────────────────────────────────────
export async function POST(request: Request) {
  const ctx = await requireAdminWithOrg();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { firstName, lastName, email, designation, password } = body;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !designation?.trim()
  ) {
    return NextResponse.json(
      { error: "First name, last name, email, and designation are required." },
      { status: 400 }
    );
  }

  if (!password?.trim() || password.trim().length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  // Check email uniqueness within org
  const existing = await prisma.employee.findUnique({
    where: {
      email_organizationId: {
        email: email.trim().toLowerCase(),
        organizationId: ctx.orgId,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "An employee with this email already exists in your organisation.",
      },
      { status: 409 }
    );
  }

  // Auto-generate unique employee ID
  let employeeId = body.employeeId?.trim() || null;
  if (employeeId) {
    // Check if manually provided ID is already taken
    const idInUse = await prisma.employee.findFirst({
      where: { employeeId, organizationId: ctx.orgId },
      select: { id: true },
    });
    if (idInUse) {
      return NextResponse.json(
        { error: "This Employee ID is already assigned to another employee." },
        { status: 409 }
      );
    }
  } else {
    // Auto-generate and ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const candidate = generateEmployeeId();
      const idExists = await prisma.employee.findFirst({
        where: { employeeId: candidate, organizationId: ctx.orgId },
      });
      if (!idExists) {
        employeeId = candidate;
        break;
      }
      attempts++;
    }
  }

  const hashedPassword = await hashPassword(password.trim());
  const passwordCheck = createHash("sha256").update(password.trim()).digest("hex");

  // Check password uniqueness within org
  const passwordInUse = await prisma.employee.findFirst({
    where: { organizationId: ctx.orgId, passwordCheck },
    select: { id: true },
  });
  if (passwordInUse) {
    return NextResponse.json(
      { error: "This password is already in use by another employee in your organisation. Please generate a new one." },
      { status: 409 }
    );
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        address: body.address?.trim() || null,
        employeeId,
        designation: designation.trim(),
        department: body.department?.trim() || null,
        position: body.position?.trim() || null,
        employmentType: body.employmentType || "FULL_TIME",
        status: body.status || "ACTIVE",
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
        salary: body.salary ? parseFloat(body.salary) : null,
        currency: body.currency || "INR",
        password: hashedPassword,
        passwordCheck,
        passwordEncrypted: encryptPassword(password.trim()),
        notes: body.notes?.trim() || null,
        organizationId: ctx.orgId,
      },
    });

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error) {
    console.error("[Employees] Create failed:", error);
    return NextResponse.json(
      { error: "Failed to create employee. Please try again." },
      { status: 500 }
    );
  }
}
