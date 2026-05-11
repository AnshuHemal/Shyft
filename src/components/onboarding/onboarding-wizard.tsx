"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { authClient } from "@/lib/auth-client";
import {
  ZapIcon,
  BuildingIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  LogOutIcon,
  UsersIcon,
  BriefcaseIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgData {
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

interface ExistingOrg {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
}

interface OnboardingWizardProps {
  user: User;
  existingOrg: ExistingOrg | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_SIZES = [
  { value: "SIZE_1_10", label: "1–10 employees" },
  { value: "SIZE_11_50", label: "11–50 employees" },
  { value: "SIZE_51_200", label: "51–200 employees" },
  { value: "SIZE_201_500", label: "201–500 employees" },
  { value: "SIZE_500_PLUS", label: "500+ employees" },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Retail",
  "Manufacturing", "Consulting", "Media & Entertainment", "Real Estate",
  "Logistics", "Legal", "Non-profit", "Government", "Other",
];

const STEPS = [
  { id: 1, label: "Organisation", icon: BuildingIcon },
  { id: 2, label: "Details", icon: BriefcaseIcon },
  { id: 3, label: "Location", icon: MapPinIcon },
];

// ── Slug generator ────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const isDone = step.id < current;
        const isActive = step.id === current;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10 text-primary scale-110",
                  !isDone && !isActive && "border-border bg-background text-muted-foreground opacity-40"
                )}
              >
                {isDone ? (
                  <CheckCircle2Icon className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                  isActive ? "text-foreground" : isDone ? "text-primary" : "text-muted-foreground opacity-40"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-16 mb-5 mx-1 rounded-full transition-all duration-500",
                  step.id < current ? "bg-primary" : "bg-border opacity-40"
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

export function OnboardingWizard({ user, existingOrg }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [data, setData] = React.useState<OrgData>({
    name: existingOrg?.name ?? "",
    slug: existingOrg?.slug ?? "",
    website: existingOrg?.website ?? "",
    industry: existingOrg?.industry ?? "",
    size: existingOrg?.size ?? "",
    description: existingOrg?.description ?? "",
    address: existingOrg?.address ?? "",
    city: existingOrg?.city ?? "",
    country: existingOrg?.country ?? "",
    phone: existingOrg?.phone ?? "",
  });

  const [errors, setErrors] = React.useState<Partial<OrgData>>({});

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!slugManuallyEdited && data.name) {
      setData((d) => ({ ...d, slug: generateSlug(data.name) }));
    }
  }, [data.name, slugManuallyEdited]);

  function set(field: keyof OrgData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep1() {
    const errs: Partial<OrgData> = {};
    if (!data.name.trim()) errs.name = "Organisation name is required.";
    if (!data.slug.trim()) errs.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(data.slug))
      errs.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2() {
    // All optional in step 2
    return true;
  }

  function validateStep3() {
    // All optional in step 3
    return true;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
    setErrors({});
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to save organisation.");
        if (json.error?.includes("slug")) {
          setErrors({ slug: json.error });
          setStep(1);
        }
        return;
      }

      toast.success("Organisation set up successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOutIcon className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className={cn(
            "w-full max-w-xl transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Welcome text */}
          <div className="text-center mb-8">
            <p className="text-sm text-primary font-medium mb-1">
              Welcome, {user.name.split(" ")[0]} 👋
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Set up your organisation
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Tell us about your company so your team can get started.
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* Card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

            <form onSubmit={handleSubmit} noValidate>
              {/* ── Step 1: Basic info ─────────────────────────────────────── */}
              {step === 1 && (
                <div className="p-8 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">Organisation basics</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your company name and unique identifier.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="org-name">
                      Organisation name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="org-name"
                      placeholder="Acme Corporation"
                      value={data.name}
                      onChange={(e) => set("name", e.target.value)}
                      autoFocus
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="org-slug">
                      Workspace URL <span className="text-destructive">*</span>
                    </FieldLabel>
                    <div className="flex items-center rounded-md border border-input bg-transparent overflow-hidden focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring">
                      <span className="px-3 py-2 text-sm text-muted-foreground bg-muted/50 border-r border-input shrink-0">
                        shyft.app/
                      </span>
                      <input
                        id="org-slug"
                        type="text"
                        placeholder="acme-corp"
                        value={data.slug}
                        onChange={(e) => {
                          setSlugManuallyEdited(true);
                          set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                        aria-invalid={!!errors.slug}
                      />
                    </div>
                    <FieldDescription>
                      Lowercase letters, numbers, and hyphens only.
                    </FieldDescription>
                    {errors.slug && <FieldError>{errors.slug}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="org-industry">Industry</FieldLabel>
                    <select
                      id="org-industry"
                      value={data.industry}
                      onChange={(e) => set("industry", e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                    >
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel>Company size</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {COMPANY_SIZES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => set("size", s.value)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all",
                            data.size === s.value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <UsersIcon className="size-3.5" />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* ── Step 2: Details ────────────────────────────────────────── */}
              {step === 2 && (
                <div className="p-8 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">Company details</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Help your team know more about the company.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="org-website">
                      <GlobeIcon className="size-3.5" />
                      Website
                    </FieldLabel>
                    <Input
                      id="org-website"
                      type="url"
                      placeholder="https://acme.com"
                      value={data.website}
                      onChange={(e) => set("website", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="org-phone">
                      <PhoneIcon className="size-3.5" />
                      Phone number
                    </FieldLabel>
                    <Input
                      id="org-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={data.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="org-description">About the company</FieldLabel>
                    <textarea
                      id="org-description"
                      rows={4}
                      placeholder="Brief description of what your company does…"
                      value={data.description}
                      onChange={(e) => set("description", e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
                    />
                    <FieldDescription>
                      {data.description.length}/500 characters
                    </FieldDescription>
                  </Field>
                </div>
              )}

              {/* ── Step 3: Location ───────────────────────────────────────── */}
              {step === 3 && (
                <div className="p-8 space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold">Location</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Where is your company based?
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="org-address">Street address</FieldLabel>
                    <Input
                      id="org-address"
                      placeholder="123 Main Street"
                      value={data.address}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="org-city">City</FieldLabel>
                      <Input
                        id="org-city"
                        placeholder="New York"
                        value={data.city}
                        onChange={(e) => set("city", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="org-country">Country</FieldLabel>
                      <Input
                        id="org-country"
                        placeholder="United States"
                        value={data.country}
                        onChange={(e) => set("country", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      Summary
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{data.name || "—"}</p>
                      {data.industry && (
                        <p className="text-xs text-muted-foreground">{data.industry}</p>
                      )}
                      {data.size && (
                        <p className="text-xs text-muted-foreground">
                          {COMPANY_SIZES.find((s) => s.value === data.size)?.label}
                        </p>
                      )}
                      {(data.city || data.country) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPinIcon className="size-3" />
                          {[data.city, data.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Footer ─────────────────────────────────────────────────── */}
              <div className="px-8 pb-8 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ArrowLeftIcon className="size-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner className="size-4" />
                    ) : (
                      <CheckCircle2Icon className="size-4" />
                    )}
                    {loading ? "Setting up…" : "Complete setup"}
                  </Button>
                )}
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            You can update these details anytime from your dashboard settings.
          </p>
        </div>
      </main>
    </div>
  );
}
