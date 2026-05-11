import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Get the current session in a Server Component or Route Handler.
 * Uses the request headers (cookie) to resolve the session.
 */
export async function getSession() {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
}

/**
 * Lightweight session check for the proxy (middleware).
 * Reads the session token cookie directly without a DB call.
 */
export async function getSessionFromRequest(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  // better-auth stores the session token in "better-auth.session_token"
  const hasToken = cookieHeader.includes("better-auth.session_token");
  return hasToken ? true : null;
}
