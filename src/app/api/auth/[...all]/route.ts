import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

// 15 second timeout for auth operations to prevent hanging on DB connection issues
const TIMEOUT_MS = 15000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout: ${context} exceeded ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

export async function GET(request: NextRequest) {
  try {
    return await withTimeout(
      handler.GET(request),
      TIMEOUT_MS,
      "Auth GET"
    );
  } catch (error) {
    console.error("Auth GET error:", error);

    // Return proper JSON error response instead of throwing
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await withTimeout(
      handler.POST(request),
      TIMEOUT_MS,
      "Auth POST"
    );
  } catch (error) {
    console.error("Auth POST error:", error);

    // Return proper JSON error response instead of throwing
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "Database connection timeout. Please check your internet connection and try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
