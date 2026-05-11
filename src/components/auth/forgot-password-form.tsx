"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { OTPInput } from "@/components/auth/otp-input";

import {
  ArrowLeftIcon,
  MailIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircle2Icon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "email" | "otp" | "new-password" | "success";

// ── Password strength ─────────────────────────────────────────────────────────

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: "Weak", color: "bg-destructive", text: "text-destructive" },
    { label: "Weak", color: "bg-destructive", text: "text-destructive" },
    { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" },
    { label: "Good", color: "bg-blue-500", text: "text-blue-500" },
    { label: "Strong", color: "bg-green-500", text: "text-green-500" },
  ];
  return { score, ...map[score] };
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "otp", label: "Verify" },
  { id: "new-password", label: "Reset" },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                  isDone &&
                    "border-primary bg-primary text-primary-foreground scale-95",
                  isActive &&
                    "border-primary bg-primary/10 text-primary scale-100",
                  !isDone &&
                    !isActive &&
                    "border-border bg-background text-muted-foreground scale-90 opacity-50"
                )}
              >
                {isDone ? (
                  <CheckCircle2Icon className="size-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs transition-colors duration-300",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-10 mb-4 rounded-full transition-all duration-500",
                  i < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("email");
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Form state
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = React.useState(0);
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Entrance animation
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const strength = getPasswordStrength(password);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      setErrors({});
      setStep("otp");
      setResendCooldown(60);
      toast.success("Reset code sent — check your inbox.");
    } catch {
      setErrors({ form: "Failed to send reset code. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 8) {
      setErrors({ otp: "Enter the 8-character code." });
      return;
    }
    // We don't call resetPassword yet — just move to the password step.
    // The OTP is verified together with the new password in step 3.
    setErrors({});
    setStep("new-password");
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      setResendCooldown(60);
      toast.success("New code sent.");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Reset password ──────────────────────────────────────────────────

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (!confirmPassword) errs.confirm = "Please confirm your password.";
    else if (password !== confirmPassword)
      errs.confirm = "Passwords don't match.";
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });
      if (result.error) {
        // OTP may have expired — send them back to verify step
        if (
          result.error.code === "OTP_EXPIRED" ||
          result.error.code === "INVALID_OTP"
        ) {
          setErrors({
            form: "Your code has expired or is invalid. Please request a new one.",
          });
          setStep("otp");
          setOtp("");
        } else {
          setErrors({
            form: result.error.message ?? "Failed to reset password.",
          });
        }
      } else {
        setStep("success");
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const cardClass = cn(
    "transition-all duration-500",
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  );

  // ── Success ─────────────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <AuthCard className={cardClass}>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 ring-8 ring-green-500/5">
            <CheckCircle2Icon className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Password reset!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated successfully. You can now sign in
              with your new password.
            </p>
          </div>
          <Button
            className="w-full mt-2"
            onClick={() => router.push("/login")}
          >
            Sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  // ── Step 1: Email ────────────────────────────────────────────────────────────

  if (step === "email") {
    return (
      <AuthCard className={cardClass}>
        <StepIndicator current={step} />

        <div className="flex justify-center mb-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRoundIcon className="size-6" />
          </div>
        </div>

        <AuthCardHeader
          title="Forgot password?"
          description="Enter your account email and we'll send you a reset code."
        />

        <form onSubmit={handleSendOTP} className="space-y-4" noValidate>
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
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
              autoFocus
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>

          {errors.form && (
            <p className="text-sm text-destructive text-center rounded-lg bg-destructive/10 px-3 py-2">
              {errors.form}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner className="mr-2" /> : null}
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  // ── Step 2: OTP ──────────────────────────────────────────────────────────────

  if (step === "otp") {
    return (
      <AuthCard className={cardClass}>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setOtp("");
            setErrors({});
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </button>

        <StepIndicator current={step} />

        <div className="flex justify-center mb-5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailIcon className="size-6" />
          </div>
        </div>

        <AuthCardHeader
          title="Check your inbox"
          description={`We sent an 8-character reset code to ${email}`}
        />

        <form onSubmit={handleVerifyOTP} className="space-y-6">
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
            {errors.form && (
              <p className="text-sm text-destructive text-center rounded-lg bg-destructive/10 px-3 py-2 mt-2">
                {errors.form}
              </p>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length !== 8}
          >
            {loading ? <Spinner className="mr-2" /> : null}
            Continue
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

  // ── Step 3: New password ──────────────────────────────────────────────────────

  return (
    <AuthCard className={cardClass}>
      <button
        type="button"
        onClick={() => {
          setStep("otp");
          setPassword("");
          setConfirmPassword("");
          setErrors({});
        }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back
      </button>

      <StepIndicator current={step} />

      <div className="flex justify-center mb-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheckIcon className="size-6" />
        </div>
      </div>

      <AuthCardHeader
        title="Create new password"
        description="Choose a strong password for your account."
      />

      <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
        {/* New password */}
        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              disabled={loading}
              autoComplete="new-password"
              autoFocus
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

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="space-y-1.5 mt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      i <= strength.score ? strength.color : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <FieldDescription>
                Strength:{" "}
                <span className={cn("font-medium", strength.text)}>
                  {strength.label}
                </span>
              </FieldDescription>
            </div>
          )}
          {errors.password && <FieldError>{errors.password}</FieldError>}
        </Field>

        {/* Confirm password */}
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((p) => ({ ...p, confirm: "" }));
              }}
              disabled={loading}
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <FieldDescription>
              {password === confirmPassword ? (
                <span className="text-green-500 font-medium flex items-center gap-1">
                  <CheckCircle2Icon className="size-3.5" />
                  Passwords match
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Passwords don't match yet
                </span>
              )}
            </FieldDescription>
          )}
          {errors.confirm && <FieldError>{errors.confirm}</FieldError>}
        </Field>

        {errors.form && (
          <p className="text-sm text-destructive text-center rounded-lg bg-destructive/10 px-3 py-2">
            {errors.form}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            loading ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword
          }
        >
          {loading ? <Spinner className="mr-2" /> : null}
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
