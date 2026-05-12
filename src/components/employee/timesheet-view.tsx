"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  MONTH_NAMES,
  DAY_NAMES,
  calcNetMinutes,
  formatHours,
  isWithinEditWindow,
  isFutureDate,
  isMonthComplete,
  daysRemainingInMonth,
} from "@/lib/timesheet-utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SendIcon,
  CheckCircle2Icon,
  ClockIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  CoffeeIcon,
  LockIcon,
  CalendarClockIcon,
  Building2Icon,
  PartyPopperIcon,
} from "lucide-react";
import { TaskLogModal } from "./task-log-modal";
import { SubmissionModal } from "./submission-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type DayType = "WORKING" | "HOLIDAY" | "LEAVE" | "HALF_DAY" | "WEEKEND";
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
  dayType: DayType;
  breakMinutes: number;
  tasks: TimesheetTask[];
}

interface Timesheet {
  id: string;
  month: number;
  year: number;
  status: TimesheetStatus;
  submittedAt: string | null;
  rejectionNote: string | null;
  reportingLeadId: string | null;
  reportingLead?: { firstName: string; lastName: string } | null;
  entries: TimesheetEntry[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string }> = {
  DRAFT:        { label: "Draft",                    color: "bg-muted text-muted-foreground border-border" },
  SUBMITTED:    { label: "Submitted for review",     color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  APPROVED:     { label: "Approved by lead",         color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  REJECTED:     { label: "Rejected — please revise", color: "bg-destructive/10 text-destructive border-destructive/20" },
  HR_SUBMITTED: { label: "Submitted to HR",          color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  HR_APPROVED:  { label: "HR Approved",              color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

const DAY_TYPE_CONFIG: Record<DayType, { label: string; rowClass: string; badgeClass: string }> = {
  WORKING: { label: "Working", rowClass: "", badgeClass: "bg-transparent text-muted-foreground border-transparent" },
  HOLIDAY: { label: "Holiday", rowClass: "bg-blue-500/5", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  WEEKEND: { label: "Weekend", rowClass: "bg-emerald-500/5", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  LEAVE: { label: "Leave", rowClass: "bg-yellow-500/5", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  HALF_DAY: { label: "Half day", rowClass: "bg-purple-500/5", badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

// ── Row display component ──────────────────────────────────────────────────────

interface RowDisplayProps {
  entry: TimesheetEntry;
  onEdit: (entry: TimesheetEntry) => void;
  readOnly: boolean;
  holidayName?: string;
}

function RowDisplay({ entry, onEdit, readOnly, holidayName }: RowDisplayProps) {
  const date = new Date(entry.date);
  const dayName = DAY_NAMES[date.getUTCDay()];
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  const canEdit =
    !readOnly &&
    !isFutureDate(date) &&
    isWithinEditWindow(date);

  const cfg = DAY_TYPE_CONFIG[entry.dayType];

  // Calculate total minutes from tasks minus breaks
  const totalTaskMinutes = entry.tasks.reduce((acc, t) => acc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
  const netMinutes = Math.max(0, totalTaskMinutes - (entry.breakMinutes || 0));

  return (
    <tr className={cn("border-b border-border/60 transition-colors group/row", cfg.rowClass)}>
      {/* Date */}
      <td className="px-4 py-4 text-[14px] font-mono font-medium text-muted-foreground whitespace-nowrap w-28">
        {dateStr}
      </td>
      {/* Day */}
      <td className="px-4 py-4 text-sm text-muted-foreground w-16">{dayName}</td>
      {/* Day type */}
      <td className="px-4 py-4 w-32">
        <div className="space-y-0.5">
          {entry.dayType === "HOLIDAY" && holidayName ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-bold cursor-help", cfg.badgeClass)}>
                    {cfg.label}
                  </div>
                }
              />
              <TooltipContent side="top">
                <p className="text-sm font-medium">{holidayName}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-bold", cfg.badgeClass)}>
              {cfg.label}
            </span>
          )}
        </div>
      </td>
      {/* Time duration summary */}
      <td className="px-4 py-4 w-72">
        {entry.tasks.length > 0 ? (
          <div className="space-y-1.5">
            {entry.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]">
                <span className="font-bold tabular-nums text-muted-foreground/80">{task.startTime}-{task.endTime}</span>
                {(task.project || task.isLearning) && (
                  <div className="flex items-center gap-1">
                    {task.project && (
                      <span className="text-primary font-bold px-1.5 rounded bg-primary/5 border border-primary/10">
                        {task.project.name}
                      </span>
                    )}
                    {(task.project?.isLearning || task.isLearning) && (
                      <span className="text-[12px] font-bold text-amber-600 bg-amber-500/10 px-1.5 rounded border border-amber-500/20 uppercase tracking-tighter">
                        Lrn
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </td>
      {/* Net hours */}
      <td className="px-4 py-4 w-32">
        {netMinutes > 0 ? (
          <div className="space-y-1">
            <span className="text-base font-black text-foreground tabular-nums">{formatHours(netMinutes)}</span>
            {entry.breakMinutes > 0 && (
              <p className="text-[12px] text-amber-600 font-bold flex items-center gap-1">
                <CoffeeIcon className="size-3" />
                {entry.breakMinutes}m break
              </p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </td>
      {/* Work done / Tasks */}
      <td className="px-4 py-4 min-w-[300px]">
        {entry.tasks.length > 0 ? (
          <div className="space-y-3">
            {entry.tasks.map((task, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{task.subject}</p>
                {task.description && (
                  <p className="text-[13px] text-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground/30 text-xs">—</span>
        )}
      </td>
      {/* Links (Masked) */}
      <td className="px-4 py-4 w-52">
        <div className="flex flex-wrap gap-1.5">
          {entry.tasks.flatMap(t => t.links || []).length > 0 ? (
            entry.tasks.flatMap(t => t.links || []).map((link: any, i) => (
              <Tooltip key={i}>
                <TooltipTrigger
                  render={
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border/50 text-[12px] font-medium text-primary hover:bg-primary/5 transition-colors max-w-[120px]"
                    >
                      <ExternalLinkIcon className="size-3 shrink-0" />
                      <span className="truncate">{link.label || "Link"}</span>
                    </a>
                  }
                />
                <TooltipContent side="top">
                  <p className="text-[11px] font-mono">{link.url}</p>
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </div>
      </td>
      {/* Actions */}
      <td className="px-4 py-4 w-28 text-right">
        {canEdit && (entry.dayType === "WORKING" || entry.dayType === "HALF_DAY" || entry.dayType === "LEAVE") && (
          <Button
            size="xs"
            variant="outline"
            className="h-8 px-4 text-xs font-bold bg-background group-hover/row:border-primary group-hover/row:text-primary transition-all shadow-sm rounded-lg"
            onClick={() => onEdit(entry)}
          >
            Log Tasks
          </Button>
        )}
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TimesheetView() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [timesheet, setTimesheet] = React.useState<Timesheet | null>(null);
  const [holidays, setHolidays] = React.useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [hrSubmitting, setHrSubmitting] = React.useState(false);
  const [showHrSubmitDialog, setShowHrSubmitDialog] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // Close picker on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  // Modal state
  const [editingEntry, setEditingEntry] = React.useState<TimesheetEntry | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchTimesheet() {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets?month=${month}&year=${year}`);
      const json = await res.json();
      if (res.ok) {
        setTimesheet(json.timesheet);
        setHolidays(json.holidays ?? []);
      }
    } catch {
      toast.error("Failed to load timesheet.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTimesheet();
  }, [month, year]);

  async function handleSaveEntry(id: string, data: any) {
    const res = await fetch(`/api/timesheets/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save entry.");
      throw new Error(json.error);
    }
    // Update local state
    setTimesheet((ts) =>
      ts
        ? {
          ...ts,
          entries: ts.entries.map((e) =>
            e.id === id ? { ...e, ...json.entry } : e
          ),
        }
        : ts
    );
    toast.success("Log saved successfully.");
  }

  function handleSubmit() {
    setIsSubmissionModalOpen(true);
  }

  async function handleConfirmSubmission(reviewerId: string) {
    if (!timesheet) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", reportingLeadId: reviewerId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to submit timesheet.");
        return;
      }
      setTimesheet((ts) => ts ? { ...ts, status: "SUBMITTED" } : ts);
      toast.success("Timesheet submitted for review.");
      setIsSubmissionModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHrSubmit() {
    if (!timesheet) return;
    setHrSubmitting(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hr_submit" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to submit to HR.");
        return;
      }
      setTimesheet((ts) => ts ? { ...ts, status: "HR_SUBMITTED" } : ts);
      setShowHrSubmitDialog(false);
      toast.success("Timesheet forwarded to HR for final approval.");
    } finally {
      setHrSubmitting(false);
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

  // Summary stats
  const totalMins = timesheet?.entries.reduce(
    (acc, e) => acc + Math.max(0, e.tasks.reduce((tAcc, t) => tAcc + calcNetMinutes(t.startTime, t.endTime, 0), 0) - (e.breakMinutes || 0)),
    0
  ) ?? 0;

  const daysWithTasks = timesheet?.entries.filter(e => e.tasks.length > 0).length ?? 0;
  const status = (timesheet?.status ?? "DRAFT") as TimesheetStatus;
  const statusCfg = STATUS_CONFIG[status];
  const canEdit = status === "DRAFT" || status === "REJECTED";
  const monthComplete = isMonthComplete(month, year);
  const daysLeft = daysRemainingInMonth(month, year);
  const canSubmit = canEdit && daysWithTasks > 0 && monthComplete;
  const canSubmitToHR = status === "APPROVED";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "space-y-6 transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Timesheet</h1>
          <p className="text-md text-muted-foreground mt-1">
            Log your daily project tasks and activities.
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
              <span className="text-sm font-black tracking-tight min-w-[100px]">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <ChevronDownIcon className={cn("size-3.5 text-muted-foreground transition-transform duration-300", isPickerOpen && "rotate-180")} />
            </button>

            {/* Month Picker Popover */}
            {isPickerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-4 bg-card border border-border shadow-2xl rounded-2xl w-[280px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                  <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                    <ChevronLeftIcon className="size-4" />
                  </button>
                  <span className="text-sm font-bold tracking-widest uppercase">{year}</span>
                  <button 
                    onClick={() => setYear(y => y + 1)} 
                    disabled={year >= now.getFullYear()}
                    className="p-1 hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ChevronRightIcon className="size-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_NAMES.map((name, i) => {
                    const mNum = i + 1;
                    const isSelected = month === mNum;
                    const isFuture = year === now.getFullYear() && mNum > now.getMonth() + 1;
                    
                    return (
                      <button
                        key={name}
                        disabled={isFuture}
                        onClick={() => {
                          setMonth(mNum);
                          setIsPickerOpen(false);
                        }}
                        className={cn(
                          "py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                          isSelected 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : isFuture 
                              ? "opacity-20 cursor-not-allowed" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {name.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateMonth(1)}
            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
            className="rounded-xl"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Status + summary bar */}
      {timesheet && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm px-5 py-4">
          <span className={cn("inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-tight", statusCfg.color)}>
            {statusCfg.label}
          </span>
          {status === "SUBMITTED" && timesheet.reportingLead && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-primary/5 border border-primary/10 text-[11px]">
              <span className="text-muted-foreground font-medium italic">Pending review by:</span>
              <span className="text-primary font-bold">{timesheet.reportingLead.firstName} {timesheet.reportingLead.lastName}</span>
            </div>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground ml-2">
            <span className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4 text-primary/60" />
              <span className="font-medium text-foreground">{daysWithTasks}</span> days logged
            </span>
            <span className="flex items-center gap-2">
              <ClockIcon className="size-4 text-primary/60" />
              <span className="font-medium text-foreground">{formatHours(totalMins)}</span> total duration
            </span>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            {/* Month not complete yet — show locked state with days remaining */}
            {canEdit && daysWithTasks > 0 && !monthComplete && (
              <Tooltip>
                <TooltipTrigger render={
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-600 dark:text-amber-400 cursor-not-allowed select-none">
                    <LockIcon className="size-3.5 shrink-0" />
                    <span className="text-xs font-bold">Submit for review</span>
                  </div>
                } />
                <TooltipContent side="top" className="max-w-xs">
                  <div className="flex items-start gap-2 py-0.5">
                    <CalendarClockIcon className="size-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-bold text-sm">Month not complete</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {daysLeft === 1
                          ? "1 day remaining in this month."
                          : `${daysLeft} days remaining in this month.`}
                        {" "}Submission unlocks on the 1st of next month.
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Month complete — show active submit button */}
            {canSubmit && (
              <Button size="sm" className="gap-2 px-4 shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95 duration-300" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner className="size-4" /> : <SendIcon className="size-4" />}
                {submitting ? "Submitting…" : "Submit for review"}
              </Button>
            )}
            {/* Lead approved — show Submit to HR button */}
            {canSubmitToHR && (
              <Button
                size="sm"
                className="gap-2 px-4 shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700 text-white animate-in fade-in zoom-in-95 duration-300"
                onClick={() => setShowHrSubmitDialog(true)}
              >
                <Building2Icon className="size-4" />
                Submit to HR
              </Button>
            )}
            {/* HR submitted — waiting */}
            {status === "HR_SUBMITTED" && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-bold border border-violet-500/20 animate-in fade-in duration-300">
                <Building2Icon className="size-4" />
                Awaiting HR review
              </div>
            )}
            {/* HR final approval */}
            {status === "HR_APPROVED" && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20 animate-in fade-in duration-300">
                <PartyPopperIcon className="size-4" />
                HR Approved
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month-in-progress notice — shown when viewing current month in DRAFT */}
      {timesheet && canEdit && !monthComplete && (
        <div className={cn(
          "flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 mt-0.5">
            <CalendarClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              Month in progress — {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5 leading-relaxed">
              Keep logging your daily tasks. The <span className="font-bold">Submit for review</span> button will unlock automatically once {MONTH_NAMES[month - 1]} is complete.
            </p>
          </div>
          {/* Progress bar */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-500/70">
              Month progress
            </span>
            <div className="w-32 h-1.5 rounded-full bg-amber-500/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{
                  width: `${Math.round(
                    ((new Date(Date.UTC(year, month, 0)).getDate() - daysLeft) /
                      new Date(Date.UTC(year, month, 0)).getDate()) *
                      100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 tabular-nums">
              {new Date(Date.UTC(year, month, 0)).getDate() - daysLeft} / {new Date(Date.UTC(year, month, 0)).getDate()} days
            </span>
          </div>
        </div>
      )}

      {/* Rejection note */}
      {timesheet?.rejectionNote && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
          <p className="text-sm font-bold text-destructive mb-1 uppercase tracking-tight">Review Feedback</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{timesheet.rejectionNote}</p>
        </div>
      )}

      {/* HR Approved — final celebration banner */}
      {status === "HR_APPROVED" && (
        <div className={cn(
          "flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 mt-0.5">
            <PartyPopperIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Timesheet fully approved by HR
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5 leading-relaxed">
              Your {MONTH_NAMES[month - 1]} {year} timesheet has been reviewed and approved by HR. It is now ready for payroll processing.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground bg-muted/5 rounded-3xl border border-dashed">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Preparing your work logs...</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-md">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Date", "Day", "Status", "Timeline", "Productivity", "Activity & Projects", "Documentation", ""].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-[12px] font-black text-muted-foreground/80 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timesheet?.entries.map((entry) => (
                  <RowDisplay
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditingEntry}
                    readOnly={!canEdit}
                    holidayName={
                      entry.dayType === "HOLIDAY"
                        ? holidays.find((h) => {
                            const hDate = new Date(h.date).toISOString().split("T")[0];
                            const eDate = new Date(entry.date).toISOString().split("T")[0];
                            return hDate === eDate;
                          })?.name
                        : undefined
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      <TaskLogModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        entry={editingEntry}
        onSave={handleSaveEntry}
      />

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onOpenChange={setIsSubmissionModalOpen}
        onConfirm={handleConfirmSubmission}
        isSubmitting={submitting}
      />

      {/* HR Submit Confirmation Dialog */}
      <Dialog open={showHrSubmitDialog} onOpenChange={(o) => !o && setShowHrSubmitDialog(false)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {/* Colored header */}
          <div className="relative p-8 bg-violet-600 text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
              <Building2Icon className="size-24" />
            </div>
            <DialogHeader className="space-y-3 relative">
              <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
                <Building2Icon className="size-7" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
                Submit to HR
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium leading-relaxed">
                Your timesheet has been approved by your reporting lead. Forwarding it to HR marks it ready for payroll processing.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="p-8 bg-card space-y-5">
            {/* Summary */}
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Timesheet summary</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span className="font-bold">{MONTH_NAMES[month - 1]} {year}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days logged</span>
                <span className="font-bold">{daysWithTasks} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total hours</span>
                <span className="font-bold">{formatHours(totalMins)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lead status</span>
                <span className="inline-flex items-center gap-1.5 text-green-600 font-bold">
                  <CheckCircle2Icon className="size-3.5" />
                  Approved
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Once submitted to HR, you will not be able to make further changes. HR will do a final review before payroll.
            </p>

            <DialogFooter className="flex gap-3 sm:justify-between pt-1">
              <Button
                variant="ghost"
                onClick={() => setShowHrSubmitDialog(false)}
                disabled={hrSubmitting}
                className="font-bold h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleHrSubmit}
                disabled={hrSubmitting}
                className="h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20 gap-2 transition-all active:scale-95"
              >
                {hrSubmitting ? <Spinner className="size-4" /> : <Building2Icon className="size-4" />}
                {hrSubmitting ? "Submitting…" : "Confirm & Submit"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
