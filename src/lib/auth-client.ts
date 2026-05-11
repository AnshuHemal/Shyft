import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [emailOTPClient()],
  // Fetch options for better error handling
  fetchOptions: {
    credentials: "include",
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
