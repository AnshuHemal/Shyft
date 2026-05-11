"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  BuildingIcon,
  GlobeIcon,
  MapPinIcon,
  PhoneIcon,
  SaveIcon,
  UsersIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgData {
  name: string;
  website: string;
  industry: string;
  size: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

interface OrgRecord {
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

interface OrganisationSettingsProps {
  org: OrgRecord | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_SIZES = [
  { value: "SIZE_1_10", label: "1–10" },
  { value: "SIZE_11_50", label: "11–50" },
  { value: "SIZE_51_200", label: "51–200" },
  { value: "SIZE_201_500", label: "201–500" },
  { value: "SIZE_500_PLUS", label: "500+" },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Retail",
  "Manufacturing", "Consulting", "Media & Entertainment", "Real Estate",
  "Logistics", "Legal", "Non-profit", "Government", "Other",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function OrganisationSettings({ org }: OrganisationSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const [data, setData] = React.useState<OrgData>({
    name: org?.name ?? "",
    website: org?.website ?? "",
    industry: org?.industry ?? "",
    size: org?.size ?? "",
    description: org?.description ?? "",
    address: org?.address ?? "",
    city: org?.city ?? "",
    country: org?.country ?? "",
    phone: org?.phone ?? "",
  });

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function set(field: keyof OrgData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error("Organisation name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save changes.");
        return;
      }
      toast.success("Organisation updated successfully.");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "space-y-6 max-w-2xl transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <PageHeader
        title="Organisation"
        description="Manage your company profile and details."
      />

      <form onSubmit={handleSave} noValidate>
        {/* Basic info */}
        <Card className="mb-6">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <BuildingIcon className="size-4 text-muted-foreground" />
              <CardTitle>Basic information</CardTitle>
            </div>
            <CardDescription>Your organisation's name, industry, and size.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Org name */}
            <Field>
              <FieldLabel htmlFor="org-name">
                Organisation name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="org-name"
                placeholder="Acme Corporation"
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            {/* Slug (read-only) */}
            {org?.slug && (
              <Field>
                <FieldLabel>Workspace URL</FieldLabel>
                <div className="flex items-center rounded-md border border-input bg-muted/30 overflow-hidden">
                  <span className="px-3 py-2 text-sm text-muted-foreground bg-muted/50 border-r border-input shrink-0">
                    shyft.app/
                  </span>
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    {org.slug}
                  </span>
                </div>
                <FieldDescription>
                  Workspace URL cannot be changed after setup.
                </FieldDescription>
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Industry */}
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

              {/* Size */}
              <Field>
                <FieldLabel>Company size</FieldLabel>
                <select
                  value={data.size}
                  onChange={(e) => set("size", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                >
                  <option value="">Select size…</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label} employees</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="org-description">About the company</FieldLabel>
              <textarea
                id="org-description"
                rows={3}
                placeholder="Brief description of what your company does…"
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <GlobeIcon className="size-4 text-muted-foreground" />
              <CardTitle>Contact & web</CardTitle>
            </div>
            <CardDescription>Website and phone number.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-website">Website</FieldLabel>
                <Input
                  id="org-website"
                  type="url"
                  placeholder="https://acme.com"
                  value={data.website}
                  onChange={(e) => set("website", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org-phone">Phone</FieldLabel>
                <Input
                  id="org-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={data.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4 text-muted-foreground" />
              <CardTitle>Location</CardTitle>
            </div>
            <CardDescription>Where your company is based.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
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
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={loading}>
            {loading ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
