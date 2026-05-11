"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendIcon, UsersIcon, UserIcon, CheckCircle2Icon } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
}

interface AdminEmailComposeProps {
  users: UserOption[];
}

const TEMPLATES = [
  {
    label: "Welcome approved",
    subject: "Welcome to SHYFT!",
    message:
      "Hi there,\n\nWelcome to SHYFT! Your account has been approved and you now have full access to the platform.\n\nIf you have any questions, don't hesitate to reach out.\n\nBest,\nThe SHYFT Team",
  },
  {
    label: "More info needed",
    subject: "Additional information required",
    message:
      "Hi there,\n\nThank you for signing up for SHYFT. We need a bit more information before we can approve your account.\n\nPlease reply to this email with the following details:\n- Your company name\n- Your role\n- How you plan to use SHYFT\n\nBest,\nThe SHYFT Team",
  },
  {
    label: "Account rejected",
    subject: "Update on your SHYFT account",
    message:
      "Hi there,\n\nThank you for your interest in SHYFT. After reviewing your application, we're unable to approve your account at this time.\n\nIf you believe this is a mistake or would like to provide additional context, please reply to this email.\n\nBest,\nThe SHYFT Team",
  },
];

export function AdminEmailCompose({ users }: AdminEmailComposeProps) {
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const [recipientType, setRecipientType] = React.useState<"single" | "all" | "pending">("single");
  const [selectedUser, setSelectedUser] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function applyTemplate(template: (typeof TEMPLATES)[0]) {
    setSubject(template.subject);
    setMessage(template.message);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (recipientType === "single" && !selectedUser)
      errs.recipient = "Select a recipient.";
    if (!subject.trim()) errs.subject = "Subject is required.";
    if (!message.trim()) errs.message = "Message is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let recipients: string[] = [];

      if (recipientType === "single") {
        const user = users.find((u) => u.id === selectedUser);
        if (user) recipients = [user.email];
      } else if (recipientType === "all") {
        recipients = users.map((u) => u.email);
      } else {
        recipients = users
          .filter((u) => u.accountStatus === "PENDING_REVIEW")
          .map((u) => u.email);
      }

      if (recipients.length === 0) {
        toast.error("No recipients found.");
        return;
      }

      // Send to each recipient
      await Promise.all(
        recipients.map((to) =>
          fetch("/api/admin/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, subject, message }),
          })
        )
      );

      setSent(true);
      toast.success(
        `Email sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}.`
      );
    } catch {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSent(false);
    setSubject("");
    setMessage("");
    setSelectedUser("");
    setErrors({});
  }

  if (sent) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-20 gap-4 transition-all duration-500",
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 ring-8 ring-green-500/5">
          <CheckCircle2Icon className="size-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Email sent!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your message has been delivered successfully.
          </p>
        </div>
        <Button onClick={handleReset} variant="outline" className="mt-2">
          Send another
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-6 max-w-2xl transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send Email</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compose and send emails to users directly from the admin console.
        </p>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Quick templates</CardTitle>
          <CardDescription>Click to pre-fill the compose form.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              {t.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Compose form */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSend} className="space-y-5" noValidate>
            {/* Recipient type */}
            <Field>
              <FieldLabel>Recipients</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "single", label: "Single user", icon: UserIcon },
                  { value: "all", label: `All users (${users.length})`, icon: UsersIcon },
                  {
                    value: "pending",
                    label: `Pending (${users.filter((u) => u.accountStatus === "PENDING_REVIEW").length})`,
                    icon: UsersIcon,
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecipientType(opt.value as typeof recipientType)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                      recipientType === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <opt.icon className="size-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Single user selector */}
            {recipientType === "single" && (
              <Field>
                <FieldLabel htmlFor="recipient">Select user</FieldLabel>
                <select
                  id="recipient"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setErrors((p) => ({ ...p, recipient: "" }));
                  }}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                >
                  <option value="">Choose a user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                {errors.recipient && (
                  <FieldError>{errors.recipient}</FieldError>
                )}
              </Field>
            )}

            {/* Subject */}
            <Field>
              <FieldLabel htmlFor="subject">Subject</FieldLabel>
              <Input
                id="subject"
                placeholder="Email subject…"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((p) => ({ ...p, subject: "" }));
                }}
                aria-invalid={!!errors.subject}
              />
              {errors.subject && <FieldError>{errors.subject}</FieldError>}
            </Field>

            {/* Message */}
            <Field>
              <FieldLabel htmlFor="message">Message</FieldLabel>
              <textarea
                id="message"
                rows={8}
                placeholder="Write your message here…"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: "" }));
                }}
                className={cn(
                  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none",
                  errors.message && "border-destructive"
                )}
              />
              <FieldDescription>
                {message.length} characters
              </FieldDescription>
              {errors.message && <FieldError>{errors.message}</FieldError>}
            </Field>

            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? <Spinner className="size-4" /> : <SendIcon className="size-4" />}
              {loading ? "Sending…" : "Send email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
