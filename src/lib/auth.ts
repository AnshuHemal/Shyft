import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail, type OTPEmailType } from "@/lib/email";

// ── Alphanumeric OTP generator ────────────────────────────────────────────────
// Uppercase letters + digits, excluding visually ambiguous chars (0, O, I, 1, L).
const OTP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateAlphanumericOTP(length: number = 8): string {
  const bytes = new Uint8Array(length);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomFillSync } = require("crypto");
    randomFillSync(bytes);
  }

  return Array.from(bytes)
    .map((b) => OTP_ALPHABET[b % OTP_ALPHABET.length])
    .join("");
}

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Auth instance ─────────────────────────────────────────────────────────────
// Exported directly — toNextJsHandler and auth.api.* both need the real object,
// not a Proxy. Next.js marks all /api routes as dynamic so this never runs
// during static build.
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-in-production",
  baseURL,
  // Required for social login to work in production/Vercel
  trustedOrigins: [baseURL],

  // ── Database ───────────────────────────────────────────────────────────────
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // ── Email + password ───────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // ── Social providers ───────────────────────────────────────────────────────
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Match the redirect URI registered in Google Cloud Console
            redirectURI: `${baseURL}/api/auth/callback/google`,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            // Match the redirect URI registered in GitHub OAuth App settings
            redirectURI: `${baseURL}/api/auth/callback/github`,
          },
        }
      : {}),
  },

  // ── Plugins ────────────────────────────────────────────────────────────────
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail({ email, otp, type: type as OTPEmailType });
      },
      otpLength: 8,
      expiresIn: 600, // 10 minutes
      generateOTP: () => generateAlphanumericOTP(8),
    }),
  ],

  // ── Session ────────────────────────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  // ── User ──────────────────────────────────────────────────────────────────
  user: {
    additionalFields: {
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        defaultValue: "USER",
      },
      accountStatus: {
        type: "string",
        defaultValue: "PENDING_REVIEW",
      },
      reviewNotes: {
        type: "string",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
export type UserRole = "USER" | "SUPERADMIN";
export type AccountStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
