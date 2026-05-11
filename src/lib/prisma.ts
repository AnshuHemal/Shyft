import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

// In Node.js environments (dev server, build workers) the native WebSocket API
// is not available, so we polyfill it with the `ws` package.
// In Neon's edge / serverless runtime the global WebSocket is present.
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local file.\n" +
        "Get your connection string from https://console.neon.tech"
    );
  }

  // PrismaNeon is a SqlDriverAdapterFactory — Prisma 7 accepts it directly
  // in the `adapter` constructor option (no `previewFeatures` needed).
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// ── Global singleton ──────────────────────────────────────────────────────────
// Prevents exhausting the Neon connection pool during Next.js hot-reloads in
// development, where module-level code re-runs on every file change.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
