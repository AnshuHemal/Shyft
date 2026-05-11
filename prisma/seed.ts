/**
 * Seed script — creates the SuperAdmin account.
 * Run: npx tsx prisma/seed.ts
 *
 * Safe to run multiple times — updates existing SuperAdmin if found.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "node:path";
import { scrypt, randomBytes } from "node:crypto";

// Load env files
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

function stripUnsupportedParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

const rawUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is not set.");

const connectionString = stripUnsupportedParams(rawUrl);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Hash password using the exact same parameters as better-auth:
 * scrypt with N=16384, r=16, p=1, dkLen=64
 * Password is NFKC-normalized before hashing.
 * Format: "<salt_hex>:<derived_key_hex>"
 */
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

async function main() {
  const SUPERADMIN_EMAIL = "hemu@gmail.com";
  const SUPERADMIN_PASSWORD = "Live@s@#er04488";
  const SUPERADMIN_NAME = "SHYFT SuperAdmin";

  console.log("🌱 Seeding SuperAdmin account…");

  const passwordHash = await hashPassword(SUPERADMIN_PASSWORD);

  const existing = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });

  if (existing) {
    // Update user role/status
    await prisma.user.update({
      where: { email: SUPERADMIN_EMAIL },
      data: {
        role: "SUPERADMIN",
        accountStatus: "APPROVED",
        emailVerified: true,
      },
    });

    // Re-hash and update the password so it uses the correct parameters
    const accountExists = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (accountExists) {
      await prisma.account.update({
        where: { id: accountExists.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: existing.id,
          accountId: existing.id,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }

    console.log("✅ SuperAdmin updated — role, status, and password refreshed.");
    return;
  }

  // Create new SuperAdmin
  const user = await prisma.user.create({
    data: {
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      emailVerified: true,
      role: "SUPERADMIN",
      accountStatus: "APPROVED",
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: passwordHash,
    },
  });

  console.log(`✅ SuperAdmin created: ${SUPERADMIN_EMAIL}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
