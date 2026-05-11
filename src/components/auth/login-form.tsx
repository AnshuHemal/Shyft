"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { OTPInput } from "@/components/auth/otp-input";
import { authClient } from "@/lib/auth-client";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Login has two steps:
//   1. credentials — email + password
//   2. otp         — email verification (only shown if account is unverified)
//
// Forgot password is a dedicated route: /forgot-password
type Step = "credentials" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [step, setStep] = React.useState<Step>("credentials");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
          setStep("otp");
          setResendCooldown(60);
          toast.info("Check your email for a verification code.");
        } else {
          setErrors({ form: result.error.message ?? "Invalid credentials." });
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 8) {
      setErrors({ otp: "Enter the 8-character code." });
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) {
        setErrors({ otp: result.error.message ?? "Invalid or expired code." });
      } else {
        toast.success("Email verified! Signing you in…");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrors({ otp: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      setResendCooldown(60);
      toast.success("New code sent.");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const cardClass = cn(
    "transition-all duration-500",
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  );

  // ── OTP verification step (unverified email) ─────────────────────────────────

  if (step === "otp") {
    return (
      <AuthCard className={cardClass}>
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setOtp("");
            setErrors({});
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </button>

        <div className="flex justify-center mb-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailIcon className="size-6" />
          </div>
        </div>

        <AuthCardHeader
          title="Verify your email"
          description={`We sent an 8-character code to ${email}`}
        />

        <form onSubmit={handleOTPVerify} className="space-y-6">
          <Field>
            <OTPInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setErrors((p) => ({ ...p, otp: "" }));
              }}
              disabled={loading}
              length={8}
            />
            {errors.otp && (
              <FieldError className="text-center">{errors.otp}</FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length !== 8}
          >
            {loading ? <Spinner className="mr-2" /> : null}
            Verify email
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className={cn(
                "font-medium transition-colors",
                resendCooldown > 0
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:text-primary/80"
              )}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </p>
        </form>
      </AuthCard>
    );
  }

  // ── Credentials step ──────────────────────────────────────────────────────────

  return (
    <AuthCard className={cardClass}>
      <AuthCardHeader
        title="Welcome back"
        description="Sign in to your SHYFT account"
      />

      <SocialButtons mode="login" />

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleCredentialLogin} className="space-y-4" noValidate>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: "" }));
            }}
            disabled={loading}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              disabled={loading}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {errors.password && <FieldError>{errors.password}</FieldError>}
        </Field>

        {errors.form && (
          <p className="text-sm text-destructive text-center rounded-lg bg-destructive/10 px-3 py-2">
            {errors.form}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign up free
        </Link>
      </p>
    </AuthCard>
  );
}
