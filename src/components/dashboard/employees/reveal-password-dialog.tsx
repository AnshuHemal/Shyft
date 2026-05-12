"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OTPInput } from "@/components/auth/otp-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldAlertIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
  KeyRoundIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  PencilIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "confirm" | "otp" | "revealed" | "no-password";

interface RevealPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  adminEmail: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RevealPasswordDialog({
  open,
  onClose,
  employeeId,
  employeeName,
  adminEmail,
}: RevealPasswordDialogProps) {
  const [step, setStep] = React.useState<Step>("confirm");
  const [loading, setLoading] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [otpError, setOtpError] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("confirm");
        setOtp("");
        setOtpError("");
        setPassword("");
        setShowPassword(false);
        setCopied(false);
        setResendCooldown(0);
      }, 300);
    }
  }, [open]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────

  async function handleSendOTP() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/reveal-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp" }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === "NO_ENCRYPTED_PASSWORD") {
          // Show a specific step for this case
          setStep("no-password");
        } else {
          toast.error(json.error ?? "Failed to send verification code.");
        }
        return;
      }

      setStep("otp");
      setResendCooldown(60);
      toast.success(`Verification code sent to ${adminEmail}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 8) {
      setOtpError("Enter the 8-character code.");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      const res = await fetch(`/api/employees/${employeeId}/reveal-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", otp }),
      });

      const json = await res.json();

      if (!res.ok) {
        setOtpError(json.error ?? "Invalid or expired code.");
        return;
      }

      setPassword(json.password);
      setStep("revealed");
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Copy to clipboard ───────────────────────────────────────────────────────

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">

        {/* ── Step: Confirm ─────────────────────────────────────────────────── */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-8 ring-yellow-500/5">
                  <ShieldAlertIcon className="size-7" />
                </div>
              </div>
              <DialogTitle className="text-center">View employee password?</DialogTitle>
              <DialogDescription className="text-center">
                You&apos;re about to view the password for{" "}
                <span className="font-medium text-foreground">{employeeName}</span>.
                For security, we&apos;ll send a verification code to your email first.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 flex items-center gap-3 my-2">
              <MailIcon className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Verification code will be sent to</p>
                <p className="text-sm font-medium truncate">{adminEmail}</p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full sm:w-auto gap-2"
              >
                {loading ? <Spinner className="size-4" /> : <MailIcon className="size-4" />}
                {loading ? "Sending…" : "Send verification code"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step: OTP ─────────────────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => { setStep("confirm"); setOtp(""); setOtpError(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeftIcon className="size-3.5" />
                Back
              </button>
              <div className="flex justify-center mb-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                  <MailIcon className="size-7" />
                </div>
              </div>
              <DialogTitle className="text-center">Check your inbox</DialogTitle>
              <DialogDescription className="text-center">
                We sent an 8-character code to{" "}
                <span className="font-medium text-foreground">{adminEmail}</span>.
                Enter it below to reveal the password.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleVerify} className="space-y-4 py-2">
              <div className="space-y-2">
                <OTPInput
                  value={otp}
                  onChange={(v) => { setOtp(v); setOtpError(""); }}
                  disabled={loading}
                  length={8}
                />
                {otpError && (
                  <p className="text-sm text-destructive text-center">{otpError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || otp.length !== 8}
              >
                {loading ? <Spinner className="size-4" /> : <KeyRoundIcon className="size-4" />}
                {loading ? "Verifying…" : "Reveal password"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className={cn(
                    "font-medium transition-colors",
                    resendCooldown > 0
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-primary hover:text-primary/80"
                  )}
                >
                  {resendCooldown > 0 ? (
                    <span className="flex items-center gap-1">
                      <RefreshCwIcon className="size-3" />
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    "Resend code"
                  )}
                </button>
              </p>
            </form>
          </>
        )}

        {/* ── Step: Revealed ────────────────────────────────────────────────── */}
        {step === "revealed" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 ring-8 ring-green-500/5">
                  <KeyRoundIcon className="size-7" />
                </div>
              </div>
              <DialogTitle className="text-center">Password revealed</DialogTitle>
              <DialogDescription className="text-center">
                This is the current password for{" "}
                <span className="font-medium text-foreground">{employeeName}</span>.
                Keep it secure and don&apos;t share it unnecessarily.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              {/* Password display */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-medium">
                  Password
                </p>
                <div className="flex items-center gap-3">
                  <p
                    className={cn(
                      "flex-1 font-mono text-lg font-semibold tracking-wide transition-all duration-200",
                      showPassword ? "text-foreground" : "blur-sm select-none"
                    )}
                  >
                    {password}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Copy password"
                    >
                      {copied ? (
                        <CheckIcon className="size-4 text-green-500" />
                      ) : (
                        <CopyIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This dialog will close when you navigate away. The password is not stored in your browser.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step: No encrypted password ───────────────────────────────── */}
        {step === "no-password" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-8 ring-yellow-500/5">
                  <AlertCircleIcon className="size-7" />
                </div>
              </div>
              <DialogTitle className="text-center">Password reveal unavailable</DialogTitle>
              <DialogDescription className="text-center">
                <span className="font-medium text-foreground">{employeeName}</span>'s
                password was set before the secure reveal feature was enabled.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 my-2 space-y-1.5">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <AlertCircleIcon className="size-4 shrink-0" />
                Action required
              </p>
              <p className="text-sm text-muted-foreground">
                To enable password reveal for this employee, open their profile and
                set a new password. Future passwords will be securely stored for reveal.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                className="w-full sm:w-auto gap-2"
                nativeButton={false}
                render={
                  <a
                    href={`/dashboard/employees/${employeeId}`}
                    onClick={onClose}
                  />
                }
              >
                <PencilIcon className="size-4" />
                Edit employee
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
