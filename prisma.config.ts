import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import path from "node:path";

// Prisma 7 evaluates this file before loading .env, so we load it manually.
// We load .env first, then .env.local so that .env.local values take precedence.
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED (or DATABASE_URL) must be set for Prisma CLI operations."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: migrationUrl,
  },
});
