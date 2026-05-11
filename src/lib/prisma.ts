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

// Configure Neon connection settings to prevent timeouts
neonConfig.fetchConnectionCache = true;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env.local file.\n" +
        "Get your connection string from https://console.neon.tech"
    );
  }

  // Warn if not using pooled connection (Neon pooled URLs contain '-pooler')
  if (!connectionString.includes("-pooler") && process.env.NODE_ENV === "development") {
    console.warn(
      "[Prisma] Warning: DATABASE_URL does not appear to be a pooled connection.\n" +
        "For serverless environments, use the pooled connection string from Neon (ends with -pooler)."
    );
  }

  // PrismaNeon with connection string
  const adapter = new PrismaNeon({ connectionString });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Add connection error handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).$on("error", (e: Error) => {
    console.error("[Prisma] Connection error:", e.message);
  });

  return client;
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
