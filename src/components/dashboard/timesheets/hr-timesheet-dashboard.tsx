"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  MONTH_NAMES,
  calcNetMinutes,
  formatHours,
} from "@/lib/timesheet-utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UsersIcon,
  CalendarIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  timesheets: {
    id: string;
    status: TimesheetStatus;
    submittedAt: string | null;
    rejectionNote: string | null;
    _count: { entries: number };
    entries: { startTime: string | null; endTime: string | null; breakMinutes: number | null }[];
  }[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus | "NONE", { label: string; color: string; dot: string }> = {
  NONE: { label: "Not started", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  DRAFT: { label: "In progress", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  SUBMITTED: { label: "Pending review", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500" },
  APPROVED: { label: "Approved", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", dot: "bg-green-500" },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  timesheetId: string | null;
  employeeName: string;
  action: "approve" | "reject" | null;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
  loading: boolean;
}

function ReviewDialog({ timesheetId, employeeName, action, onClose, onConfirm, loading }: ReviewDialogProps) {
  const [note, setNote] = React.useState("");

  if (!timesheetId || !action) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve" ? "Approve timesheet" : "Reject timesheet"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? `Approve ${employeeName}'s timesheet? They will be notified.`
              : `Reject ${employeeName}'s timesheet. Please provide a reason.`}
          </DialogDescription>
        </DialogHeader>

        {action === "reject" && (
          <div className="py-2">
            <Field>
              <FieldLabel htmlFor="rejection-note">Rejection reason</FieldLabel>
              <textarea
                id="rejection-note"
                rows={3}
                placeholder="Explain what needs to be corrected…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={action === "approve" ? "default" : "destructive"}
            onClick={() => onConfirm(action === "reject" ? note : undefined)}
            disabled={loading || (action === "reject" && !note.trim())}
            className="gap-2"
          >
            {loading ? <Spinner className="size-4" /> : action === "approve" ? <CheckCircle2Icon className="size-4" /> : <XCircleIcon className="size-4" />}
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HRTimesheetDashboard() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Review dialog
  const [reviewTarget, setReviewTarget] = React.useState<{
    timesheetId: string;
    employeeName: string;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets/hr?month=${month}&year=${year}`);
      const json = await res.json();
      if (res.ok) setEmployees(json.employees);
    } catch {
      toast.error("Failed to load timesheets.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchData(); }, [month, year]);

  async function handleReview(note?: string) {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/timesheets/${reviewTarget.timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewTarget.action,
          rejectionNote: note,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed."); return; }

      toast.success(
        reviewTarget.action === "approve"
          ? `${reviewTarget.employeeName}'s timesheet approved.`
          : `${reviewTarget.employeeName}'s timesheet rejected.`
      );
      setReviewTarget(null);
      fetchData();
    } finally {
      setReviewLoading(false);
    }
  }

  function navigateMonth(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  // Summary counts
  const counts = {
    total: employees.length,
    submitted: employees.filter((e) => e.timesheets[0]?.status === "SUBMITTED").length,
    approved: employees.filter((e) => e.timesheets[0]?.status === "APPROVED").length,
    pending: employees.filter((e) => !e.timesheets[0] || e.timesheets[0].status === "DRAFT").length,
  };

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timesheets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve employee timesheets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/dashboard/timesheets/holidays" />} className="gap-1.5">
            <CalendarIcon className="size-4" />
            Holidays
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total employees", value: counts.total, icon: UsersIcon, color: "text-primary bg-primary/10" },
          { label: "Pending review", value: counts.submitted, icon: ClockIcon, color: "text-blue-500 bg-blue-500/10" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2Icon, color: "text-green-500 bg-green-500/10" },
          { label: "Not submitted", value: counts.pending, icon: CalendarDaysIcon, color: "text-muted-foreground bg-muted" },
        ].map((s, i) => (
          <Card key={s.label} size="sm" className={cn("transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{ transitionDelay: `${i * 60}ms` }}>
            <CardContent className="pt-4">
              <div className={cn("flex size-9 items-center justify-center rounded-lg mb-3", s.color)}>
                <s.icon className="size-4" />
              </div>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee timesheet table */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Employee timesheets</CardTitle>
          <CardDescription>{MONTH_NAMES[month - 1]} {year}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Spinner className="size-5" />
              Loading…
            </div>
          ) : employees.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No employees found.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {employees.map((emp) => {
                const ts = emp.timesheets[0];
                const status = (ts?.status ?? "NONE") as keyof typeof STATUS_CONFIG;
                const cfg = STATUS_CONFIG[status];
                const totalMins = ts?.entries.reduce((acc, e) => {
                  if (e.startTime && e.endTime) return acc + calcNetMinutes(e.startTime, e.endTime, e.breakMinutes ?? 0);
                  return acc;
                }, 0) ?? 0;
                const daysLogged = ts?.entries.filter((e) => e.startTime && e.endTime).length ?? 0;

                return (
                  <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.designation}{emp.department ? ` · ${emp.department}` : ""}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span>{daysLogged} days</span>
                      <span>{totalMins > 0 ? formatHours(totalMins) : "—"}</span>
                    </div>

                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0", cfg.color)}>
                      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>

                    {ts && status === "SUBMITTED" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setReviewTarget({ timesheetId: ts.id, employeeName: `${emp.firstName} ${emp.lastName}`, action: "approve" })}
                        >
                          <CheckCircle2Icon className="size-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => setReviewTarget({ timesheetId: ts.id, employeeName: `${emp.firstName} ${emp.lastName}`, action: "reject" })}
                        >
                          <XCircleIcon className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        timesheetId={reviewTarget?.timesheetId ?? null}
        employeeName={reviewTarget?.employeeName ?? ""}
        action={reviewTarget?.action ?? null}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReview}
        loading={reviewLoading}
      />
    </div>
  );
}
