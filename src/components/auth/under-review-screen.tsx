"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ClockIcon,
  ShieldCheckIcon,
  MailIcon,
  LogOutIcon,
  CheckCircle2Icon,
  ZapIcon,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STEPS = [
  {
    icon: CheckCircle2Icon,
    label: "Account created",
    done: true,
  },
  {
    icon: ShieldCheckIcon,
    label: "Under review",
    done: false,
    active: true,
  },
  {
    icon: ZapIcon,
    label: "Access granted",
    done: false,
  },
];

interface UnderReviewScreenProps {
  user: User;
}

export function UnderReviewScreen({ user }: UnderReviewScreenProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ZapIcon className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Shyft</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="gap-2 text-muted-foreground"
        >
          <LogOutIcon className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className={cn(
            "w-full max-w-lg transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 bg-linear-to-r from-primary/60 via-primary to-primary/60" />

            <div className="p-8">
              {/* Icon */}
              <div
                className={cn(
                  "flex justify-center mb-6 transition-all duration-700 delay-100",
                  mounted
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75"
                )}
              >
                <div className="relative">
                  <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ClockIcon className="size-10" />
                  </div>
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                </div>
              </div>

              {/* Text */}
              <div
                className={cn(
                  "text-center mb-8 transition-all duration-700 delay-200",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                  Your account is under review
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  The Shyft team will review your account within{" "}
                  <span className="font-medium text-foreground">24 hours</span>.
                  You&apos;ll receive an email once your account is approved.
                </p>
              </div>

              {/* Progress steps */}
              <div
                className={cn(
                  "flex items-center justify-center gap-0 mb-8 transition-all duration-700 delay-300",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                {STEPS.map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                          step.done &&
                            "border-primary bg-primary text-primary-foreground",
                          step.active &&
                            "border-primary bg-primary/10 text-primary",
                          !step.done &&
                            !step.active &&
                            "border-border bg-background text-muted-foreground opacity-40"
                        )}
                      >
                        <step.icon className="size-4" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium whitespace-nowrap",
                          step.active
                            ? "text-primary"
                            : step.done
                            ? "text-foreground"
                            : "text-muted-foreground opacity-40"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-px w-16 mb-5 mx-1 rounded-full transition-all duration-500",
                          i === 0 ? "bg-primary" : "bg-border opacity-40"
                        )}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* User info card */}
              <div
                className={cn(
                  "rounded-xl border border-border/60 bg-muted/30 p-4 mb-6 transition-all duration-700 delay-[400ms]",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MailIcon className="size-3 shrink-0" />
                      {user.email}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 text-xs font-medium">
                      <ClockIcon className="size-3" />
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Info list */}
              <div
                className={cn(
                  "space-y-3 mb-6 transition-all duration-700 delay-500",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                {[
                  "We review every account to ensure a safe workspace.",
                  "You'll get an email at " + user.email + " when approved.",
                  "The review typically takes less than 24 hours.",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="size-4 shrink-0 text-primary mt-0.5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Sign out */}
              <div
                className={cn(
                  "transition-all duration-700 delay-[600ms]",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOutIcon className="size-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Questions?{" "}
            <a
              href="mailto:support@shyft.app"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
