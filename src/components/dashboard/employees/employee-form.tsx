"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserIcon,
  BriefcaseIcon,
  LockIcon,
  SaveIcon,
  ArrowLeftIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  ZapIcon,
} from "lucide-react";
import { DepartmentSelect } from "@/components/dashboard/employees/department-select";
import { PositionSelect } from "@/components/dashboard/employees/position-select";
import { LeadSelect } from "@/components/dashboard/employees/lead-select";

import { getPasswordStrength } from "@/lib/password-generator";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  employeeId: string;
  designation: string;
  department: string;
  position: string;
  reportingToId: string;
  employmentType: string;
  status: string;
  joiningDate: string;
  leavingDate: string;
  salary: string;
  currency: string;
  password: string;
  notes: string;
}

interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  phone?: string | null;
  avatar?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  employeeId?: string | null;
  department?: string | null;
  position?: string | null;
  reportingToId?: string | null;
  employmentType?: string | null;
  status?: string | null;
  joiningDate?: Date | null;
  leavingDate?: Date | null;
  salary?: number | null;
  currency?: string | null;
  notes?: string | null;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  employee?: EmployeeRecord;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
  { value: "FREELANCE", label: "Freelance" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  { value: "INACTIVE", label: "Inactive", color: "bg-muted text-muted-foreground border-border" },
  { value: "ON_LEAVE", label: "On leave", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  { value: "TERMINATED", label: "Terminated", color: "bg-destructive/10 text-destructive border-destructive/20" },
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

// ── Client-side passphrase generator (for initial value on mount) ─────────────
// Mirrors the server-side format: word-word-word@digits
// Uses a small subset of words — the full list lives server-side.

const CLIENT_WORDS = [
  "swift","noble","brave","crisp","fresh","bright","smart","light","solid",
  "quiet","proud","lucky","happy","sunny","windy","rainy","silky","spicy",
  "golden","silver","copper","marble","velvet","cotton","linen","contact",
  "slender","puffy","round","plain","vivid","grand","clean","sharp","calm",
];

function clientPickWord(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return CLIENT_WORDS[arr[0] % CLIENT_WORDS.length];
}

function clientPickDigits(count: number): string {
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((n) => n % 10).join("");
}

function generateInitialPassword(): string {
  const seps = ["-", ".", "_"];
  const syms = ["@", "#", "!", "$"];
  const sepArr = new Uint32Array(1);
  const symArr = new Uint32Array(1);
  crypto.getRandomValues(sepArr);
  crypto.getRandomValues(symArr);
  const sep = seps[sepArr[0] % seps.length];
  const sym = syms[symArr[0] % syms.length];
  const words = [clientPickWord(), clientPickWord(), clientPickWord()];
  return `${words.join(sep)}${sym}${clientPickDigits(3)}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium text-sm text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────────

function Select({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 rounded-md border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
    >
      {children}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmployeeForm({ mode, employee }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<EmployeeData>>({});

  // Password generator state
  const [passwordUnique, setPasswordUnique] = React.useState<boolean | null>(null);
  const [checkingPassword, setCheckingPassword] = React.useState(false);
  const [fetchingPassword, setFetchingPassword] = React.useState(false);

  // Fetch a memorable passphrase password from our generator
  async function fetchDinoPassword() {
    setFetchingPassword(true);
    setPasswordUnique(null);
    try {
      const res = await fetch("/api/generate-password?words=3&digits=3");
      const json = await res.json();
      if (res.ok && json.password) {
        set("password", json.password);
        checkPasswordUniqueness(json.password);
      } else {
        toast.error("Failed to generate password. Try again.");
      }
    } catch {
      toast.error("Password service unavailable. Try again.");
    } finally {
      setFetchingPassword(false);
    }
  }

  // Debounced uniqueness check against the org's existing employees
  const uniquenessTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  async function checkPasswordUniqueness(pwd: string) {
    if (!pwd || pwd.length < 6) {
      setPasswordUnique(null);
      return;
    }
    if (uniquenessTimer.current) clearTimeout(uniquenessTimer.current);
    uniquenessTimer.current = setTimeout(async () => {
      setCheckingPassword(true);
      try {
        const res = await fetch("/api/employees/check-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: pwd,
            excludeEmployeeId: employee?.id,
          }),
        });
        const json = await res.json();
        setPasswordUnique(res.ok ? json.available : null);
      } catch {
        setPasswordUnique(null);
      } finally {
        setCheckingPassword(false);
      }
    }, 600);
  }

  const [data, setData] = React.useState<EmployeeData>({
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    dateOfBirth: formatDateForInput(employee?.dateOfBirth),
    gender: employee?.gender ?? "",
    address: employee?.address ?? "",
    employeeId: employee?.employeeId ?? "",
    designation: employee?.designation ?? "",
    department: employee?.department ?? "",
    position: employee?.position ?? "",
    reportingToId: employee?.reportingToId ?? "",
    employmentType: employee?.employmentType ?? "FULL_TIME",
    status: employee?.status ?? "ACTIVE",
    joiningDate: formatDateForInput(employee?.joiningDate),
    leavingDate: formatDateForInput(employee?.leavingDate),
    salary: employee?.salary != null ? String(employee.salary) : "",
    currency: employee?.currency ?? "INR",
    password: mode === "create" ? generateInitialPassword() : "",
    notes: employee?.notes ?? "",
  });

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function set(field: keyof EmployeeData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs: Partial<EmployeeData> = {};
    if (!data.firstName.trim()) errs.firstName = "First name is required.";
    if (!data.lastName.trim()) errs.lastName = "Last name is required.";
    if (!data.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Enter a valid email address.";
    if (!data.designation.trim()) errs.designation = "Designation is required.";
    if (mode === "create" && (!data.password.trim() || data.password.trim().length < 6))
      errs.password = "Password must be at least 6 characters.";
    if (mode === "edit" && data.password.trim() && data.password.trim().length < 6)
      errs.password = "New password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/employees"
          : `/api/employees/${employee!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to save employee.");
        return;
      }

      toast.success(
        mode === "create"
          ? `${data.firstName} ${data.lastName} added successfully.`
          : "Employee updated successfully."
      );
      router.push("/dashboard/employees");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminate() {
    if (!employee) return;
    if (
      !confirm(
        `Mark ${employee.firstName} ${employee.lastName} as terminated?`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Employee marked as terminated.");
      router.push("/dashboard/employees");
      router.refresh();
    } catch {
      toast.error("Failed to terminate employee.");
    } finally {
      setDeleting(false);
    }
  }

  const currentStatus = STATUSES.find((s) => s.value === data.status);
  const hasName = data.firstName || data.lastName;

  return (
    <div
      className={cn(
        "transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN — sticky profile card ──────────────────────────── */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-20 space-y-4">

              {/* Profile preview card */}
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                  <Avatar size="lg" className="size-16">
                    <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                      {hasName
                        ? getInitials(data.firstName, data.lastName)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 w-full">
                    <p className="font-semibold text-base truncate">
                      {hasName
                        ? `${data.firstName} ${data.lastName}`.trim()
                        : "New Employee"}
                    </p>
                    {data.designation && (
                      <p className="text-sm text-muted-foreground truncate">
                        {data.designation}
                      </p>
                    )}
                    {data.department && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.department}
                      </p>
                    )}
                  </div>

                  {currentStatus && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        currentStatus.color
                      )}
                    >
                      {currentStatus.label}
                    </span>
                  )}

                  {data.employeeId && (
                    <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {data.employeeId}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick fields */}
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Select id="status" value={data.status} onChange={(v) => set("status", v)}>
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="employmentType">Employment type</FieldLabel>
                    <Select id="employmentType" value={data.employmentType} onChange={(v) => set("employmentType", v)}>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="joiningDate">Joining date</FieldLabel>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={data.joiningDate}
                      onChange={(e) => set("joiningDate", e.target.value)}
                    />
                  </Field>

                  {(data.status === "TERMINATED" || data.leavingDate) && (
                    <Field>
                      <FieldLabel htmlFor="leavingDate">Leaving date</FieldLabel>
                      <Input
                        id="leavingDate"
                        type="date"
                        value={data.leavingDate}
                        onChange={(e) => set("leavingDate", e.target.value)}
                      />
                    </Field>
                  )}

                  {/* Salary */}
                  <div className="grid grid-cols-3 gap-2">
                    <Field className="col-span-2">
                      <FieldLabel htmlFor="salary">Salary</FieldLabel>
                      <Input
                        id="salary"
                        type="number"
                        placeholder="50000"
                        value={data.salary}
                        onChange={(e) => set("salary", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="currency">Currency</FieldLabel>
                      <Select id="currency" value={data.currency} onChange={(v) => set("currency", v)}>
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Spinner className="size-4" /> : <SaveIcon className="size-4" />}
                  {loading
                    ? mode === "create" ? "Adding…" : "Saving…"
                    : mode === "create" ? "Add employee" : "Save changes"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => router.back()}
                >
                  <ArrowLeftIcon className="size-4" />
                  Back
                </Button>

                {mode === "edit" && employee?.status !== "TERMINATED" && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={handleTerminate}
                    disabled={deleting}
                  >
                    {deleting ? <Spinner className="size-4" /> : <TrashIcon className="size-4" />}
                    Terminate employee
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — form sections ────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Personal information */}
            <Card>
              <CardContent className="pt-6">
                <SectionHeader
                  icon={UserIcon}
                  title="Personal information"
                  description="Basic details about the employee."
                />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="firstName">
                        First name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="firstName"
                        placeholder="Alex"
                        value={data.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        aria-invalid={!!errors.firstName}
                        autoFocus={mode === "create"}
                      />
                      {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="lastName">
                        Last name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="lastName"
                        placeholder="Johnson"
                        value={data.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        aria-invalid={!!errors.lastName}
                      />
                      {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="alex@company.com"
                        value={data.email}
                        onChange={(e) => set("email", e.target.value)}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <FieldError>{errors.email}</FieldError>}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={data.phone}
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={data.dateOfBirth}
                        onChange={(e) => set("dateOfBirth", e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="gender">Gender</FieldLabel>
                      <Select id="gender" value={data.gender} onChange={(v) => set("gender", v)}>
                        <option value="">Select…</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </Select>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, State"
                      value={data.address}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Professional information */}
            <Card>
              <CardContent className="pt-6">
                <SectionHeader
                  icon={BriefcaseIcon}
                  title="Professional information"
                  description="Role, department, and employment details."
                />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="designation">
                        Designation <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="designation"
                        placeholder="Senior Developer"
                        value={data.designation}
                        onChange={(e) => set("designation", e.target.value)}
                        aria-invalid={!!errors.designation}
                      />
                      {errors.designation && <FieldError>{errors.designation}</FieldError>}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="position">Position / Level</FieldLabel>
                      <div className="group/select relative">
                        <PositionSelect
                          value={data.position}
                          onChange={(v) => set("position", v)}
                          disabled={loading}
                          placeholder="Select a position…"
                        />
                        <div className="absolute inset-0 rounded-md ring-1 ring-primary/20 opacity-0 group-focus-within/select:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="lead">Reporting Lead</FieldLabel>
                      <div className="group/select relative">
                        <LeadSelect
                          value={data.reportingToId}
                          onChange={(v) => set("reportingToId", v)}
                          disabled={loading}
                          excludeId={employee?.id}
                          placeholder="Select a lead…"
                        />
                        <div className="absolute inset-0 rounded-md ring-1 ring-primary/20 opacity-0 group-focus-within/select:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="department">Department</FieldLabel>
                      <div className="group/select relative">
                        <DepartmentSelect
                          value={data.department}
                          onChange={(v) => set("department", v)}
                          disabled={loading}
                        />
                        <div className="absolute inset-0 rounded-md ring-1 ring-primary/20 opacity-0 group-focus-within/select:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="employeeId">Employee ID</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="employeeId"
                          placeholder="Auto-generated"
                          value={data.employeeId}
                          onChange={(e) => set("employeeId", e.target.value)}
                          className="font-mono"
                        />
                        {mode === "create" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="shrink-0 size-9"
                            onClick={() => {
                              // Generate a preview ID (server will ensure uniqueness)
                              const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
                              const suffix = Array.from({ length: 4 }, () =>
                                chars[Math.floor(Math.random() * chars.length)]
                              ).join("");
                              set("employeeId", `EMP-${suffix}`);
                            }}
                            title="Generate new ID"
                          >
                            <RefreshCwIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      <FieldDescription>
                        Leave blank to auto-generate on save.
                      </FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Any additional notes about this employee…"
                      value={data.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Account access */}
            <Card>
              <CardContent className="pt-6">
                <SectionHeader
                  icon={LockIcon}
                  title="Account access"
                  description={
                    mode === "create"
                      ? "Set the employee's login password. Share it with them securely."
                      : "Leave blank to keep the current password, or enter a new one to update it."
                  }
                />

                <div className="space-y-5">
                  {/* Password input */}
                  <Field>
                    <FieldLabel htmlFor="password">
                      {mode === "create" ? (
                        <>Password <span className="text-destructive">*</span></>
                      ) : (
                        "New password"
                      )}
                    </FieldLabel>

                    <div className="flex gap-2">
                      {/* Input with show/hide */}
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={
                            mode === "create"
                              ? "Min. 6 characters"
                              : "Leave blank to keep current"
                          }
                          value={data.password}
                          onChange={(e) => {
                            set("password", e.target.value);
                            setPasswordUnique(null);
                            checkPasswordUniqueness(e.target.value);
                          }}
                          aria-invalid={!!errors.password}
                          className="pr-10 font-mono"
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

                      {/* Generate via DinoPass */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5 px-3"
                        onClick={() => fetchDinoPassword()}
                        disabled={fetchingPassword}
                        title="Generate memorable password via DinoPass"
                      >
                        {fetchingPassword ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <ZapIcon className="size-3.5" />
                        )}
                        {fetchingPassword ? "Generating…" : "Generate"}
                      </Button>
                    </div>

                    {errors.password && <FieldError>{errors.password}</FieldError>}

                    {/* Strength meter + uniqueness indicator */}
                    {data.password.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {/* Strength bar */}
                        {(() => {
                          const s = getPasswordStrength(data.password);
                          return (
                            <div className="space-y-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "h-1 flex-1 rounded-full transition-all duration-300",
                                      i <= s.score ? s.color : "bg-muted"
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Strength:{" "}
                                <span className={cn("font-medium", s.textColor)}>
                                  {s.label}
                                </span>
                              </p>
                            </div>
                          );
                        })()}

                        {/* Uniqueness indicator */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {checkingPassword ? (
                            <>
                              <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                              <span className="text-muted-foreground">Checking uniqueness…</span>
                            </>
                          ) : passwordUnique === true ? (
                            <>
                              <CheckCircle2Icon className="size-3.5 text-green-500" />
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                Unique within your organisation
                              </span>
                            </>
                          ) : passwordUnique === false ? (
                            <>
                              <XCircleIcon className="size-3.5 text-destructive" />
                              <span className="text-destructive font-medium">
                                Already in use — generate a new one
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <FieldDescription>
                      Click <strong>Generate</strong> to fetch a memorable password from DinoPass,
                      or type your own. Adjust the length slider above.
                    </FieldDescription>
                  </Field>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </form>
    </div>
  );
}
