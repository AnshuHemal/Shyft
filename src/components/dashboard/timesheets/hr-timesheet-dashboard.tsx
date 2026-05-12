"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  UsersIcon,
  CalendarIcon,
  Building2Icon,
  EyeIcon,
  ArrowRightIcon,
} from "lucide-react";
import { TimesheetModal, type TimesheetModalEmployee } from "./timesheet-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "HR_SUBMITTED" | "HR_APPROVED";

interface TimesheetTask {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  description: string | null;
  isLearning: boolean;
  links: { url: string; label: string }[];
  project: { id: string; name: string; isLearning: boolean } | null;
}

interface TimesheetEntry {
  id: string;
  date: string;
  dayType: "WORKING" | "HOLIDAY" | "LEAVE" | "HALF_DAY" | "WEEKEND";
  breakMinutes: number;
  workDone: string | null;
  links: string[];
  tasks: TimesheetTask[];
}

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  avatar: string | null;
  timesheets: {
    id: string;
    status: TimesheetStatus;
    submittedAt: string | null;
    hrSubmittedAt: string | null;
    hrReviewedAt: string | null;
    rejectionNote: string | null;
    entries: TimesheetEntry[];
  }[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus | "NONE", { label: string; color: string; dot: string }> = {
  NONE:         { label: "Not started",   color: "bg-muted text-muted-foreground border-border",                                   dot: "bg-muted-foreground" },
  DRAFT:        { label: "In progress",   color: "bg-muted text-muted-foreground border-border",                                   dot: "bg-muted-foreground" },
  SUBMITTED:    { label: "Pending lead",  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",             dot: "bg-blue-500" },
  APPROVED:     { label: "Lead approved", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",         dot: "bg-green-500" },
  REJECTED:     { label: "Rejected",      color: "bg-destructive/10 text-destructive border-destructive/20",                       dot: "bg-destructive" },
  HR_SUBMITTED: { label: "Pending HR",    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",     dot: "bg-violet-500" },
  HR_APPROVED:  { label: "HR Approved",   color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
};

// ── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  timesheetId: string | null;
  employeeName: string;
  action: "hr_approve" | "hr_reject" | null;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
  loading: boolean;
}

function ReviewDialog({ timesheetId, employeeName, action, onClose, onConfirm, loading }: ReviewDialogProps) {
  const [note, setNote] = React.useState("");
  if (!timesheetId || !action) return null;
  const isApprove = action === "hr_approve";

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn("p-8 text-white relative overflow-hidden", isApprove ? "bg-emerald-600" : "bg-destructive")}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            {isApprove ? <CheckCircle2Icon className="size-24" /> : <XCircleIcon className="size-24" />}
          </div>
          <DialogHeader className="space-y-3 relative">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              {isApprove ? <CheckCircle2Icon className="size-7" /> : <XCircleIcon className="size-7" />}
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
              {isApprove ? "Final HR Approval" : "Reject Timesheet"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              {isApprove
                ? `Approve ${employeeName}'s timesheet for payroll processing. This is the final step.`
                : `Reject ${employeeName}'s timesheet. They will need to revise and resubmit.`}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 bg-card space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
              {isApprove ? "Comment (Optional)" : "Rejection Reason (Required)"}
            </label>
            <textarea
              rows={3}
              placeholder={isApprove ? "Add a note for the employee…" : "Explain what needs to be corrected…"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-4 rounded-2xl bg-muted/40 border-2 border-transparent text-sm font-medium transition-all resize-none focus:outline-none focus:bg-background focus:border-primary/20"
            />
          </div>
          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold h-11 rounded-xl">Cancel</Button>
            <Button
              onClick={() => onConfirm(!isApprove ? note : undefined)}
              disabled={loading || (!isApprove && !note.trim())}
              className={cn(
                "h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg gap-2 transition-all active:scale-95",
                isApprove ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-destructive hover:bg-destructive/90 shadow-destructive/20"
              )}
            >
              {loading ? <Spinner className="size-4" /> : <ArrowRightIcon className="size-4" />}
              {isApprove ? "Final Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </div>
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
  const [holidays, setHolidays] = React.useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Modal state
  const [modalEmployee, setModalEmployee] = React.useState<TimesheetModalEmployee | null>(null);

  // Review dialog state
  const [reviewTarget, setReviewTarget] = React.useState<{
    timesheetId: string;
    employeeName: string;
    action: "hr_approve" | "hr_reject";
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
      if (res.ok) {
        setEmployees(json.employees ?? []);
        setHolidays(json.holidays ?? []);
      }
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
        body: JSON.stringify({ action: reviewTarget.action, rejectionNote: note }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed."); return; }
      toast.success(
        reviewTarget.action === "hr_approve"
          ? `${reviewTarget.employeeName}'s timesheet finally approved.`
          : `${reviewTarget.employeeName}'s timesheet rejected.`
      );
      setReviewTarget(null);
      fetchData();
    } finally {
      setReviewLoading(false);
    }
  }

  function navigateMonth(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  }

  const counts = {
    total:      employees.length,
    submitted:  employees.filter((e) => e.timesheets[0]?.status === "SUBMITTED").length,
    hrPending:  employees.filter((e) => e.timesheets[0]?.status === "HR_SUBMITTED").length,
    hrApproved: employees.filter((e) => e.timesheets[0]?.status === "HR_APPROVED").length,
  };

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timesheets</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, verify, and approve employee timesheets.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/dashboard/timesheets/holidays" />} className="gap-1.5">
            <CalendarIcon className="size-4" />Holidays
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">{MONTH_NAMES[month - 1]} {year}</span>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total employees", value: counts.total,      icon: UsersIcon,       color: "text-primary bg-primary/10" },
          { label: "Pending lead",    value: counts.submitted,  icon: ClockIcon,        color: "text-blue-500 bg-blue-500/10" },
          { label: "Pending HR",      value: counts.hrPending,  icon: Building2Icon,    color: "text-violet-500 bg-violet-500/10" },
          { label: "HR Approved",     value: counts.hrApproved, icon: CheckCircle2Icon, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={cn("rounded-2xl border border-border/60 bg-card p-4 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className={cn("flex size-9 items-center justify-center rounded-lg mb-3", s.color)}>
              <s.icon className="size-4" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main table ── */}
      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div>
            <p className="text-sm font-semibold">Employee Timesheets</p>
            <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year} · Click View to open the full timesheet</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading timesheets…</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <UsersIcon className="size-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold">No employees found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Department", "Days Logged", "Total Hours", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {employees.map((emp, idx) => {
                  const ts = emp.timesheets[0];
                  const status = (ts?.status ?? "NONE") as keyof typeof STATUS_CONFIG;
                  const statusCfg = STATUS_CONFIG[status];

                  const totalMins = ts?.entries.reduce((acc, e) => {
                    const taskMins = e.tasks.reduce((tAcc, t) => tAcc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
                    return acc + Math.max(0, taskMins - (e.breakMinutes || 0));
                  }, 0) ?? 0;
                  const daysLogged = ts?.entries.filter((e) => e.tasks.length > 0).length ?? 0;

                  return (
                    <tr
                      key={emp.id}
                      className={cn(
                        "group hover:bg-muted/30 transition-colors duration-200",
                        "animate-in fade-in slide-in-from-left-2 duration-300"
                      )}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={emp.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>
                          </div>
                        </div>
                      </td>
                      {/* Department */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{emp.department || "—"}</span>
                      </td>
                      {/* Days logged */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold tabular-nums">{daysLogged}</span>
                        <span className="text-xs text-muted-foreground ml-1">days</span>
                      </td>
                      {/* Total hours */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold tabular-nums">{totalMins > 0 ? formatHours(totalMins) : "—"}</span>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", statusCfg.color)}>
                          <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ts && status === "HR_SUBMITTED" && (
                            <Button
                              size="sm"
                              className="gap-1.5 h-8 px-3 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm shadow-emerald-500/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewTarget({ timesheetId: ts.id, employeeName: `${emp.firstName} ${emp.lastName}`, action: "hr_approve" });
                              }}
                            >
                              <CheckCircle2Icon className="size-3" />Approve
                            </Button>
                          )}
                          {ts && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8 px-3 rounded-lg font-bold text-xs hover:border-primary/20 hover:text-primary transition-all"
                              onClick={() => setModalEmployee(emp as TimesheetModalEmployee)}
                            >
                              <EyeIcon className="size-3" />View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Timesheet modal ── */}
      <TimesheetModal
        open={!!modalEmployee}
        onClose={() => setModalEmployee(null)}
        employee={modalEmployee}
        month={month}
        year={year}
        holidays={holidays}
        onApprove={(tsId) => setReviewTarget({ timesheetId: tsId, employeeName: modalEmployee ? `${modalEmployee.firstName} ${modalEmployee.lastName}` : "", action: "hr_approve" })}
        onReject={(tsId) => setReviewTarget({ timesheetId: tsId, employeeName: modalEmployee ? `${modalEmployee.firstName} ${modalEmployee.lastName}` : "", action: "hr_reject" })}
      />

      {/* ── Review dialog ── */}
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
