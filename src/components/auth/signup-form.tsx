"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { AuthCard, AuthCardHeader } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { OTPInput } from "@/components/auth/otp-input";
import { authClient } from "@/lib/auth-client";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, MailIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "details" | "verify";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score === 2) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export function SignupForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("details");
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = React.useState(0);
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const passwordStrength = getPasswordStrength(password);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        setErrors({ form: result.error.message ?? "Failed to create account." });
      } else {
        // Send verification OTP
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });
        setStep("verify");
        setResendCooldown(60);
        toast.success("Account created! Check your email for a verification code.");
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
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
        toast.success("Email verified! Welcome to SHYFT 🎉");
        router.push("/dashboard");
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

  // ── OTP verification step ────────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <AuthCard>
        <button
          onClick={() => {
            setStep("details");
            setOtp("");
            setErrors({});
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back
        </button>

        <div className="flex justify-center mb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailIcon className="size-6" />
          </div>
        </div>

        <AuthCardHeader
          title="Verify your email"
          description={`We sent an 8-character code to ${email}`}
        />

        <form onSubmit={handleVerify} className="space-y-6">
          <Field>
            <OTPInput value={otp} onChange={setOtp} disabled={loading} length={8} />
            {errors.otp && (
              <FieldError className="text-center">{errors.otp}</FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length !== 8}
          >
            {loading ? <Spinner className="mr-2" /> : <CheckIcon className="mr-2 size-4" />}
            Verify & activate account
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
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
        </form>
      </AuthCard>
    );
  }

  // ── Details step ─────────────────────────────────────────────────────────────
  return (
    <AuthCard>
      <AuthCardHeader
        title="Create your account"
        description="Start tracking work the right way — free forever."
      />

      <SocialButtons mode="signup" />

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">or sign up with email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            disabled={loading}
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              disabled={loading}
              autoComplete="new-password"
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
          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="space-y-1.5 mt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      i <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <FieldDescription>
                Password strength:{" "}
                <span
                  className={cn(
                    "font-medium",
                    passwordStrength.score <= 1 && "text-destructive",
                    passwordStrength.score === 2 && "text-yellow-500",
                    passwordStrength.score === 3 && "text-blue-500",
                    passwordStrength.score === 4 && "text-green-500"
                  )}
                >
                  {passwordStrength.label}
                </span>
              </FieldDescription>
            </div>
          )}
          {errors.password && <FieldError>{errors.password}</FieldError>}
        </Field>

        {errors.form && (
          <p className="text-sm text-destructive text-center rounded-lg bg-destructive/10 px-3 py-2">
            {errors.form}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          Create account
        </Button>

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          By creating an account you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
