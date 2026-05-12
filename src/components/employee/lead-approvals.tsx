"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  DAY_NAMES,
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
  ExternalLinkIcon,
  ChevronDownIcon,
  CoffeeIcon,
  UsersIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  EyeIcon,
  ChevronUpIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DayType = "WORKING" | "HOLIDAY" | "LEAVE" | "HALF_DAY" | "WEEKEND";
type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

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
  dayType: DayType;
  breakMinutes: number;
  workDone: string | null;
  links: string[];
  tasks: TimesheetTask[];
}

interface TeamTimesheet {
  id: string;
  status: TimesheetStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionNote: string | null;
  entries: TimesheetEntry[];
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  avatar?: string | null;
  timesheets: TeamTimesheet[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus | "NONE", { label: string; color: string; dot: string }> = {
  NONE:      { label: "Not submitted",    color: "bg-muted text-muted-foreground border-border",                              dot: "bg-muted-foreground" },
  DRAFT:     { label: "In progress",      color: "bg-muted text-muted-foreground border-border",                              dot: "bg-muted-foreground" },
  SUBMITTED: { label: "Pending review",   color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",        dot: "bg-blue-500" },
  APPROVED:  { label: "Approved",         color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",    dot: "bg-green-500" },
  REJECTED:  { label: "Rejected",         color: "bg-destructive/10 text-destructive border-destructive/20",                  dot: "bg-destructive" },
};

const DAY_TYPE_CONFIG: Record<DayType, { label: string; rowClass: string; badgeClass: string }> = {
  WORKING:  { label: "Working",  rowClass: "",                    badgeClass: "bg-transparent text-muted-foreground border-transparent" },
  HOLIDAY:  { label: "Holiday",  rowClass: "bg-blue-500/5",       badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  WEEKEND:  { label: "Weekend",  rowClass: "bg-emerald-500/5",    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  LEAVE:    { label: "Leave",    rowClass: "bg-yellow-500/5",     badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  HALF_DAY: { label: "Half day", rowClass: "bg-purple-500/5",     badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

// ── Read-only timesheet row (mirrors RowDisplay in timesheet-view.tsx) ────────

interface ReadOnlyRowProps {
  entry: TimesheetEntry;
  holidayName?: string;
}

function ReadOnlyRow({ entry, holidayName }: ReadOnlyRowProps) {
  const date = new Date(entry.date);
  const dayName = DAY_NAMES[date.getUTCDay()];
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
  const cfg = DAY_TYPE_CONFIG[entry.dayType];
  const totalTaskMins = entry.tasks.reduce((acc, t) => acc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
  const netMinutes = Math.max(0, totalTaskMins - (entry.breakMinutes || 0));
  const allLinks = entry.tasks.flatMap((t) => t.links ?? []);

  return (
    <tr className={cn("border-b border-border/60 transition-colors group/row", cfg.rowClass)}>
      {/* Date */}
      <td className="px-4 py-4 text-[13px] font-mono font-medium text-muted-foreground whitespace-nowrap w-28">
        {dateStr}
      </td>
      {/* Day */}
      <td className="px-4 py-4 text-sm text-muted-foreground w-14">{dayName}</td>
      {/* Day type */}
      <td className="px-4 py-4 w-28">
        {entry.dayType === "HOLIDAY" && holidayName ? (
          <Tooltip>
            <TooltipTrigger render={
              <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold cursor-help", cfg.badgeClass)}>
                {cfg.label}
              </div>
            } />
            <TooltipContent side="top"><p className="text-sm font-medium">{holidayName}</p></TooltipContent>
          </Tooltip>
        ) : (
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.badgeClass)}>
            {cfg.label}
          </span>
        )}
      </td>
      {/* Timeline */}
      <td className="px-4 py-4 w-64">
        {entry.tasks.length > 0 ? (
          <div className="space-y-1.5">
            {entry.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]">
                <span className="font-bold tabular-nums text-muted-foreground/80">{task.startTime}–{task.endTime}</span>
                {(task.project || task.isLearning) && (
                  <div className="flex items-center gap-1">
                    {task.project && (
                      <span className="text-primary font-bold px-1.5 rounded bg-primary/5 border border-primary/10 text-[11px]">
                        {task.project.name}
                      </span>
                    )}
                    {(task.project?.isLearning || task.isLearning) && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 rounded border border-amber-500/20 uppercase tracking-tighter">
                        Lrn
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/30 text-xs">—</span>
        )}
      </td>
      {/* Net hours */}
      <td className="px-4 py-4 w-28">
        {netMinutes > 0 ? (
          <div className="space-y-1">
            <span className="text-sm font-black text-foreground tabular-nums">{formatHours(netMinutes)}</span>
            {entry.breakMinutes > 0 && (
              <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <CoffeeIcon className="size-3" />{entry.breakMinutes}m
              </p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </td>
      {/* Activity */}
      <td className="px-4 py-4 min-w-[260px]">
        {entry.tasks.length > 0 ? (
          <div className="space-y-2.5">
            {entry.tasks.map((task, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{task.subject}</p>
                {task.description && (
                  <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/30 text-xs">—</span>
        )}
      </td>
      {/* Links */}
      <td className="px-4 py-4 w-44">
        <div className="flex flex-wrap gap-1.5">
          {allLinks.length > 0 ? allLinks.map((link, i) => (
            <Tooltip key={i}>
              <TooltipTrigger render={
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border/50 text-[11px] font-medium text-primary hover:bg-primary/5 transition-colors max-w-[110px]">
                  <ExternalLinkIcon className="size-3 shrink-0" />
                  <span className="truncate">{link.label || "Link"}</span>
                </a>
              } />
              <TooltipContent side="top"><p className="text-[11px] font-mono">{link.url}</p></TooltipContent>
            </Tooltip>
          )) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  open: boolean;
  employeeName: string;
  action: "approve" | "reject";
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

function ReviewDialog({ open, employeeName, action, loading, onClose, onConfirm }: ReviewDialogProps) {
  const [note, setNote] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn("p-8 text-white relative overflow-hidden", action === "approve" ? "bg-green-600" : "bg-rose-600")}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            {action === "approve" ? <CheckCircle2Icon className="size-24" /> : <XCircleIcon className="size-24" />}
          </div>
          <DialogHeader className="space-y-3 relative">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              {action === "approve" ? <CheckCircle2Icon className="size-7" /> : <XCircleIcon className="size-7" />}
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              {action === "approve"
                ? `Approve ${employeeName}'s timesheet? They will be notified.`
                : `Provide a reason for rejecting ${employeeName}'s timesheet.`}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 bg-card space-y-5">
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
              <MessageSquareIcon className="size-3.5" />
              {action === "approve" ? "Comment (Optional)" : "Rejection Reason (Required)"}
            </FieldLabel>
            <textarea
              rows={4}
              placeholder={action === "approve" ? "Add a note of encouragement…" : "Explain what needs to be corrected…"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={cn(
                "w-full p-4 rounded-2xl bg-muted/40 border-2 border-transparent text-sm font-medium transition-all resize-none focus:outline-none focus:bg-background",
                action === "approve" ? "focus:border-green-500/30" : "focus:border-rose-500/30"
              )}
            />
          </Field>
          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(note)}
              disabled={loading || (action === "reject" && !note.trim())}
              className={cn(
                "h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 gap-2",
                action === "approve" ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
              )}
            >
              {loading ? <Spinner className="size-4" /> : <ArrowRightIcon className="size-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

import { TimesheetModal } from "@/components/dashboard/timesheets/timesheet-modal";

export function LeadApprovals() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [approvals, setApprovals] = React.useState<TeamMember[]>([]);
  const [holidays, setHolidays] = React.useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setIsPickerOpen(false);
    }
    if (isPickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets/lead?month=${month}&year=${year}`);
      const json = await res.json();
      if (res.ok) {
        setApprovals(json.approvals ?? []);
        setHolidays(json.holidays ?? []);
        // Refresh selected member if open
        if (selectedMember) {
          const updated = (json.approvals as TeamMember[]).find(a => a.id === selectedMember.id);
          if (updated) setSelectedMember(updated);
        }
      }
    } catch {
      toast.error("Failed to load team approvals.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { fetchData(); }, [month, year]);

  async function handleReview(note: string) {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/timesheets/${reviewTarget.timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewTarget.action, rejectionNote: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Action failed."); return; }
      toast.success(
        reviewTarget.action === "approve"
          ? `${reviewTarget.employeeName}'s timesheet approved.`
          : `${reviewTarget.employeeName}'s timesheet rejected.`
      );
      setReviewTarget(null);
      fetchData();
    } catch {
      toast.error("An error occurred.");
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

  // Summary counts
  const counts = {
    total: approvals.length,
    pending: approvals.filter((a) => a.timesheets[0]?.status === "SUBMITTED").length,
    approved: approvals.filter((a) => a.timesheets[0]?.status === "APPROVED").length,
    rejected: approvals.filter((a) => a.timesheets[0]?.status === "REJECTED").length,
  };

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve monthly timesheets submitted by your team.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 relative">
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)} className="rounded-xl">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 shadow-sm"
            >
              <CalendarDaysIcon className="size-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black tracking-tight min-w-[100px]">{MONTH_NAMES[month - 1]} {year}</span>
              <ChevronDownIcon className={cn("size-3.5 text-muted-foreground transition-transform duration-300", isPickerOpen && "rotate-180")} />
            </button>
            {isPickerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-4 bg-card border border-border shadow-2xl rounded-2xl w-[280px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                  <button onClick={() => setYear((y) => y - 1)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <span className="text-sm font-bold tracking-widest uppercase">{year}</span>
                  <button onClick={() => setYear((y) => y + 1)} disabled={year >= now.getFullYear()} className="p-1 hover:bg-muted rounded-lg transition-colors disabled:opacity-30">
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_NAMES.map((name, i) => {
                    const mNum = i + 1;
                    const isSelected = month === mNum;
                    const isFuture = year === now.getFullYear() && mNum > now.getMonth() + 1;
                    return (
                      <button key={name} disabled={isFuture} onClick={() => { setMonth(mNum); setIsPickerOpen(false); }}
                        className={cn("py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                          isSelected ? "bg-primary text-primary-foreground shadow-md" : isFuture ? "opacity-20 cursor-not-allowed" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                        {name.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(1)} disabled={month === now.getMonth() + 1 && year === now.getFullYear()} className="rounded-xl">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        {[
          { label: "Team members",  value: counts.total,    icon: UsersIcon,         color: "text-primary bg-primary/10" },
          { label: "Pending review", value: counts.pending,  icon: ClockIcon,         color: "text-blue-500 bg-blue-500/10" },
          { label: "Approved",       value: counts.approved, icon: CheckCircle2Icon,  color: "text-green-500 bg-green-500/10" },
          { label: "Rejected",       value: counts.rejected, icon: XCircleIcon,       color: "text-destructive bg-destructive/10" },
        ].map((s, i) => (
          <div key={s.label} className={cn("rounded-2xl border border-border/60 bg-card p-4 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{ transitionDelay: `${i * 60}ms` }}>
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
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div>
            <p className="text-sm font-semibold">Team Timesheets</p>
            <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year} · Review and approve submissions</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading team timesheets…</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <CheckCircle2Icon className="size-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No submissions yet</p>
              <p className="text-xs text-muted-foreground mt-1">No timesheets have been submitted for {MONTH_NAMES[month - 1]} {year}.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Department", "Days Logged", "Total Hours", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {approvals.map((member, idx) => {
                  const ts = member.timesheets[0];
                  if (!ts) return null;
                  const status = ts.status;
                  const statusCfg = STATUS_CONFIG[status];

                  const totalMins = ts.entries.reduce((acc, e) => {
                    const taskMins = e.tasks.reduce((tAcc, t) => tAcc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
                    return acc + Math.max(0, taskMins - (e.breakMinutes || 0));
                  }, 0);
                  const daysLogged = ts.entries.filter((e) => e.tasks.length > 0).length;

                  return (
                    <tr
                      key={member.id}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${idx * 40}ms` }}
                      onClick={() => setSelectedMember(member)}
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={member.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.designation}</p>
                          </div>
                        </div>
                      </td>
                      {/* Department */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{member.department || "—"}</span>
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
                          {status === "SUBMITTED" && (
                            <Button
                              size="sm"
                              className="gap-1.5 h-8 px-3 rounded-lg font-bold bg-green-600 hover:bg-green-700 text-white text-xs shadow-sm shadow-green-500/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewTarget({ timesheetId: ts.id, employeeName: `${member.firstName} ${member.lastName}`, action: "approve" });
                              }}
                            >
                              <CheckCircle2Icon className="size-3" />
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-8 px-3 rounded-lg font-bold text-xs hover:border-primary/20 hover:text-primary"
                          >
                            <EyeIcon className="size-3" />
                            Review
                          </Button>
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
      {selectedMember && (
        <TimesheetModal
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          employee={selectedMember as any}
          month={month}
          year={year}
          holidays={holidays}
          onApprove={(id) => setReviewTarget({ timesheetId: id, employeeName: `${selectedMember.firstName} ${selectedMember.lastName}`, action: "approve" })}
          onReject={(id) => setReviewTarget({ timesheetId: id, employeeName: `${selectedMember.firstName} ${selectedMember.lastName}`, action: "reject" })}
        />
      )}

      {/* ── Review dialog ── */}
      <ReviewDialog
        open={!!reviewTarget}
        employeeName={reviewTarget?.employeeName ?? ""}
        action={reviewTarget?.action ?? "approve"}
        loading={reviewLoading}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReview}
      />
    </div>
  );
}
