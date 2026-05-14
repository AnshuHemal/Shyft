"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarOffIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  PlusCircleIcon,
  SunIcon,
  SunsetIcon,
  LayersIcon,
  FileTextIcon,
  UserIcon,
  RefreshCwIcon,
  CalendarCheckIcon,
} from "lucide-react";
import { CompOffForm } from "./comp-off-form";
import { CompOffHistory } from "./comp-off-history";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveType = "FULL_DAY" | "HALF_DAY" | "MULTI_DAY";
type HalfDaySession = "MORNING" | "AFTERNOON";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ReportingPerson {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  avatar?: string | null;
}

interface LeaveApplication {
  id: string;
  leaveType: LeaveType;
  halfDaySession: HalfDaySession | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  hrNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reportingTo: { firstName: string; lastName: string; designation: string } | null;
}

// ── Status + Type configs ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending Review",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved",        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected",        color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; icon: React.ElementType; desc: string }> = {
  FULL_DAY: { label: "Full Day",      icon: CalendarDaysIcon, desc: "Entire working day" },
  HALF_DAY: { label: "Half Day",      icon: SunIcon,          desc: "Morning or afternoon" },
  MULTI_DAY: { label: "Multiple Days", icon: LayersIcon,       desc: "2 or more consecutive days" },
};

// ── Leave form ─────────────────────────────────────────────────────────────────

function LeaveForm({
  reportingPersons,
  defaultReportingId,
  onSuccess,
}: {
  reportingPersons: ReportingPerson[];
  defaultReportingId: string | null;
  onSuccess: () => void;
}) {
  const [leaveType, setLeaveType] = React.useState<LeaveType>("FULL_DAY");
  const [halfDaySession, setHalfDaySession] = React.useState<HalfDaySession>("MORNING");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [reportingToId, setReportingToId] = React.useState(defaultReportingId ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) { toast.error("Please select a start date."); return; }
    if (leaveType === "MULTI_DAY" && !endDate) { toast.error("Please select an end date."); return; }
    if (leaveType === "MULTI_DAY" && endDate < startDate) { toast.error("End date must be after start date."); return; }
    if (reason.trim().length < 10) { toast.error("Please provide a reason of at least 10 characters."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          halfDaySession: leaveType === "HALF_DAY" ? halfDaySession : undefined,
          startDate,
          endDate: leaveType === "MULTI_DAY" ? endDate : startDate,
          reason: reason.trim(),
          reportingToId: reportingToId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to submit leave."); return; }
      toast.success("Leave application submitted successfully!");
      setStartDate(""); setEndDate(""); setReason("");
      setLeaveType("FULL_DAY"); setHalfDaySession("MORNING");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Leave type selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Leave Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["FULL_DAY", "HALF_DAY", "MULTI_DAY"] as LeaveType[]).map((type) => {
            const cfg = LEAVE_TYPE_CONFIG[type];
            const Icon = cfg.icon;
            const active = leaveType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setLeaveType(type)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 group",
                  active
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", active ? "text-primary" : "text-foreground")}>{cfg.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cfg.desc}</p>
                </div>
                {active && (
                  <div className="ml-auto">
                    <CheckCircle2Icon className="size-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Half day session selector */}
      {leaveType === "HALF_DAY" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Session
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "MORNING" as HalfDaySession, label: "Morning", icon: SunIcon, time: "9:00 AM – 1:00 PM" },
              { value: "AFTERNOON" as HalfDaySession, label: "Afternoon", icon: SunsetIcon, time: "1:00 PM – 6:00 PM" },
            ]).map(({ value, label, icon: Icon, time }) => (
              <button
                key={value}
                type="button"
                onClick={() => setHalfDaySession(value)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                  halfDaySession === value
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/30"
                )}
              >
                <Icon className={cn("size-5", halfDaySession === value ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className={cn("text-sm font-bold", halfDaySession === value ? "text-primary" : "")}>{label}</p>
                  <p className="text-[10px] text-muted-foreground">{time}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date(s) */}
      <div className={cn("grid gap-4", leaveType === "MULTI_DAY" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {leaveType === "MULTI_DAY" ? "Start Date" : "Date"}
          </label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full h-11 rounded-xl border border-border/60 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        {leaveType === "MULTI_DAY" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full h-11 rounded-xl border border-border/60 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        )}
      </div>

      {/* Reporting person */}
      {reportingPersons.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <UserIcon className="size-3" />
            Reporting Person
          </label>
          <div className="flex flex-wrap gap-2">
            {reportingPersons.map((p) => {
              const selected = reportingToId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReportingToId(p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                      : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={p.avatar || ""} />
                    <AvatarFallback className="text-[9px] font-black">{p.firstName[0]}{p.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <span>{p.firstName} {p.lastName}</span>
                  {selected && <CheckCircle2Icon className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5"><FileTextIcon className="size-3" />Reason</span>
          <span className={cn("font-mono text-[10px]", reason.length < 10 ? "text-destructive" : "text-emerald-500")}>
            {reason.length}/10 min
          </span>
        </label>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for your leave…"
          required
          className="w-full rounded-2xl border border-border/60 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Preview summary */}
      {startDate && reason.trim().length >= 10 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Application Summary</p>
          <p className="text-sm font-semibold text-foreground">
            {LEAVE_TYPE_CONFIG[leaveType].label} leave
            {leaveType === "HALF_DAY" && ` (${halfDaySession.toLowerCase()})`}
            {" — "}
            {new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            {leaveType === "MULTI_DAY" && endDate && ` to ${new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
          </p>
          {reportingToId && reportingPersons.find(p => p.id === reportingToId) && (
            <p className="text-xs text-muted-foreground">
              Reporting to {reportingPersons.find(p => p.id === reportingToId)!.firstName} {reportingPersons.find(p => p.id === reportingToId)!.lastName}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || reason.trim().length < 10 || !startDate}
        className={cn(
          "w-full flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm transition-all duration-300",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        )}
      >
        {submitting ? (
          <><Spinner className="size-4" />Submitting…</>
        ) : (
          <><PlusCircleIcon className="size-4" />Submit Leave Application</>
        )}
      </button>
    </form>
  );
}

// ── Leave history ─────────────────────────────────────────────────────────────

function LeaveHistory({ leaves, loading, onRefresh }: {
  leaves: LeaveApplication[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <Spinner className="size-6" />
        <p className="text-sm font-medium">Loading your leave history…</p>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
          <CalendarOffIcon className="size-7 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">No leave applications yet</p>
          <p className="text-xs text-muted-foreground mt-1">Apply for leave using the form above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{leaves.length} application{leaves.length !== 1 ? "s" : ""}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCwIcon className="size-3" />Refresh
        </button>
      </div>
      {leaves.map((leave, i) => {
        const cfg = STATUS_CONFIG[leave.status];
        const StatusIcon = cfg.icon;
        const TypeCfg = LEAVE_TYPE_CONFIG[leave.leaveType];
        const TypeIcon = TypeCfg.icon;

        const startStr = new Date(leave.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
        const endStr = new Date(leave.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
        const dateStr = leave.leaveType === "MULTI_DAY" ? `${startStr} – ${endStr}` : startStr;

        return (
          <div
            key={leave.id}
            className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                  <TypeIcon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {TypeCfg.label}
                    {leave.halfDaySession && ` (${leave.halfDaySession.toLowerCase()})`}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateStr}</p>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shrink-0",
                cfg.color
              )}>
                <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-[52px]">
              {leave.reason}
            </p>

            {leave.reportingTo && (
              <div className="pl-[52px]">
                <p className="text-[10px] text-muted-foreground/60">
                  Reporting to: {leave.reportingTo.firstName} {leave.reportingTo.lastName} · {leave.reportingTo.designation}
                </p>
              </div>
            )}

            {leave.hrNote && leave.status === "REJECTED" && (
              <div className="pl-[52px] mt-1">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <p className="text-[11px] font-bold text-destructive">HR Note:</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{leave.hrNote}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type ActiveTab = "leave" | "comp-off";

export function EmployeeLeave() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("leave");
  const [leaves, setLeaves] = React.useState<LeaveApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [compOffs, setCompOffs] = React.useState<any[]>([]);
  const [compOffLoading, setCompOffLoading] = React.useState(true);
  const [reportingPersons, setReportingPersons] = React.useState<ReportingPerson[]>([]);
  const [defaultReportingId, setDefaultReportingId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchLeaves() {
    setLoading(true);
    try {
      const res = await fetch("/api/leave");
      const json = await res.json();
      if (res.ok) setLeaves(json.leaves ?? []);
    } catch {
      toast.error("Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompOffs() {
    setCompOffLoading(true);
    try {
      const res = await fetch("/api/comp-off");
      const json = await res.json();
      if (res.ok) setCompOffs(json.compOffs ?? []);
    } catch {
      toast.error("Failed to load comp-off history.");
    } finally {
      setCompOffLoading(false);
    }
  }

  async function fetchReportingPersons() {
    try {
      const res = await fetch("/api/employees/reporting-persons");
      const json = await res.json();
      if (res.ok) {
        setReportingPersons(json.persons ?? []);
        if (json.defaultId) setDefaultReportingId(json.defaultId);
      }
    } catch { /* silent */ }
  }

  React.useEffect(() => {
    fetchLeaves();
    fetchCompOffs();
    fetchReportingPersons();
  }, []);

  const pendingCount  = leaves.filter(l => l.status === "PENDING").length;
  const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
  const compOffPendingCount = compOffs.filter((c: any) => c.status === "PENDING").length;

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarOffIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Apply for leave or submit a comp-off request.</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit shrink-0">
          {([
            { id: "leave" as ActiveTab,    label: "My Leaves",  icon: CalendarOffIcon,  count: pendingCount },
            { id: "comp-off" as ActiveTab, label: "Comp-Off",   icon: CalendarCheckIcon, count: compOffPendingCount },
          ]).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                activeTab === id
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
              {count > 0 && (
                <span className="ml-0.5 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats — leave tab */}
      {activeTab === "leave" && (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {[
            { label: "Total Applications", value: leaves.length, color: "text-primary bg-primary/10" },
            { label: "Pending Review",     value: pendingCount,   color: "text-amber-500 bg-amber-500/10" },
            { label: "Approved",           value: approvedCount,  color: "text-emerald-500 bg-emerald-500/10" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                <CalendarDaysIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats — comp-off tab */}
      {activeTab === "comp-off" && (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {[
            { label: "Total Requests",  value: compOffs.length, color: "text-primary bg-primary/10" },
            { label: "Pending",         value: compOffPendingCount, color: "text-amber-500 bg-amber-500/10" },
            { label: "Acknowledged",    value: compOffs.filter((c: any) => c.status === "ACKNOWLEDGED").length, color: "text-emerald-500 bg-emerald-500/10" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                <CalendarCheckIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Leave Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "leave" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold">New Leave Application</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below and submit for HR review.</p>
            </div>
            <LeaveForm
              reportingPersons={reportingPersons}
              defaultReportingId={defaultReportingId}
              onSuccess={() => { fetchLeaves(); }}
            />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
            <div>
              <h2 className="text-base font-bold">My Leave History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track the status of all your submitted applications.</p>
            </div>
            <LeaveHistory leaves={leaves} loading={loading} onRefresh={fetchLeaves} />
          </div>
        </div>
      )}

      {/* ── Comp-Off Tab ──────────────────────────────────────────────────── */}
      {activeTab === "comp-off" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold">Leave Compensation Request</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fill this form on a Saturday when you come to office to compensate for a previous leave.
              </p>
            </div>
            <CompOffForm
              reportingPersons={reportingPersons}
              defaultReportingId={defaultReportingId}
              onSuccess={() => { fetchCompOffs(); }}
            />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
            <div>
              <h2 className="text-base font-bold">My Comp-Off History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track all your submitted comp-off requests.</p>
            </div>
            <CompOffHistory compOffs={compOffs} loading={compOffLoading} onRefresh={fetchCompOffs} />
          </div>
        </div>
      )}
    </div>
  );
}
