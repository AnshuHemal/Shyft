"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { RevealPasswordDialog } from "@/components/dashboard/employees/reveal-password-dialog";
import {
  SearchIcon,
  PlusIcon,
  MailIcon,
  PhoneIcon,
  BriefcaseIcon,
  FilterIcon,
  UserCheckIcon,
  UserXIcon,
  ClockIcon,
  EyeIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  employeeId: string | null;
  designation: string;
  department: string | null;
  position: string | null;
  employmentType: string;
  status: string;
  joiningDate: Date | null;
}

interface EmployeeListProps {
  initialEmployees: Employee[];
  departments: string[];
  adminEmail: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: UserCheckIcon,
    dot: "bg-green-500",
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
    icon: UserXIcon,
    dot: "bg-muted-foreground",
  },
  ON_LEAVE: {
    label: "On leave",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: ClockIcon,
    dot: "bg-yellow-500",
  },
  TERMINATED: {
    label: "Terminated",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: UserXIcon,
    dot: "bg-destructive",
  },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERN: "Intern",
  FREELANCE: "Freelance",
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeList({ initialEmployees, departments, adminEmail }: EmployeeListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [deptFilter, setDeptFilter] = React.useState("ALL");
  const [mounted, setMounted] = React.useState(false);

  // Reveal password dialog state
  const [revealTarget, setRevealTarget] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = initialEmployees.filter((e) => {
    const matchesSearch =
      !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchesDept = deptFilter === "ALL" || e.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const counts = {
    ALL: initialEmployees.length,
    ACTIVE: initialEmployees.filter((e) => e.status === "ACTIVE").length,
    ON_LEAVE: initialEmployees.filter((e) => e.status === "ON_LEAVE").length,
    INACTIVE: initialEmployees.filter((e) => e.status === "INACTIVE").length,
    TERMINATED: initialEmployees.filter((e) => e.status === "TERMINATED").length,
  };

  return (
    <div
      className={cn(
        "space-y-4 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Department filter */}
        {departments.length > 0 && (
          <div className="flex items-center gap-1.5">
            <FilterIcon className="size-4 text-muted-foreground shrink-0" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="ALL">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["ALL", "ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              statusFilter === s
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            {s !== "ALL" && (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  STATUS_CONFIG[s]?.dot ?? "bg-muted-foreground"
                )}
              />
            )}
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
            <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <BriefcaseIcon className="size-7 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">
            {search || statusFilter !== "ALL" || deptFilter !== "ALL"
              ? "No employees match your filters"
              : "No employees yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {search || statusFilter !== "ALL" || deptFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Add your first employee to get started."}
          </p>
          {!search && statusFilter === "ALL" && deptFilter === "ALL" && (
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard/employees/new" />} className="gap-1.5">
              <PlusIcon className="size-4" />
              Add employee
            </Button>
          )}
        </div>
      )}

      {/* Employee grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((employee, i) => {
            const statusCfg = STATUS_CONFIG[employee.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;

            return (
              <div
                key={employee.id}
                className={cn(
                  "transition-all duration-300",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <Card className="hover:shadow-md hover:border-border transition-all duration-200 group">
                  <CardContent className="pt-5">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background",
                            statusCfg.dot
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="font-medium text-sm truncate block hover:text-primary transition-colors"
                        >
                          {employee.firstName} {employee.lastName}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.designation}
                        </p>
                      </div>
                      {/* Right column: status badge + eye button stacked */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                            statusCfg.className
                          )}
                        >
                          {statusCfg.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealTarget({
                              id: employee.id,
                              name: `${employee.firstName} ${employee.lastName}`,
                            })
                          }
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium",
                            "text-muted-foreground border border-border/60 bg-transparent",
                            "hover:bg-muted/60 hover:text-foreground hover:border-border",
                            "transition-all duration-200"
                          )}
                          title="View employee password"
                        >
                          <EyeIcon className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <MailIcon className="size-3 shrink-0" />
                        {employee.email}
                      </p>
                      {employee.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <PhoneIcon className="size-3 shrink-0" />
                          {employee.phone}
                        </p>
                      )}
                    </div>

                    {/* Footer row */}
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {employee.department && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {employee.department}
                          </span>
                        )}
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {EMPLOYMENT_LABELS[employee.employmentType] ?? employee.employmentType}
                        </span>
                      </div>
                      {employee.employeeId && (
                        <span className="text-xs text-muted-foreground font-mono shrink-0">
                          {employee.employeeId}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Reveal password dialog */}
      <RevealPasswordDialog
        open={!!revealTarget}
        onClose={() => setRevealTarget(null)}
        employeeId={revealTarget?.id ?? ""}
        employeeName={revealTarget?.name ?? ""}
        adminEmail={adminEmail}
      />
    </div>
  );
}
