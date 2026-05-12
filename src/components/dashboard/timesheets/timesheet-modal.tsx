"use client";

/**
 * TimesheetModal
 * Full-screen modal showing an employee's complete monthly timesheet
 * with a Download PDF button. Used by the HR dashboard.
 */

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
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MONTH_NAMES,
  DAY_NAMES,
  calcNetMinutes,
  formatHours,
} from "@/lib/timesheet-utils";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  CoffeeIcon,
  DownloadIcon,
  Building2Icon,
  FileTextIcon,
} from "lucide-react";

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
  workDone: string | null;
  links: string[];
  tasks: TimesheetTask[];
}

interface EmployeeTimesheet {
  id: string;
  status: TimesheetStatus;
  submittedAt: string | null;
  hrSubmittedAt: string | null;
  hrReviewedAt: string | null;
  rejectionNote: string | null;
  entries: TimesheetEntry[];
}

export interface TimesheetModalEmployee {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  avatar: string | null;
  timesheets: EmployeeTimesheet[];
}

interface TimesheetModalProps {
  open: boolean;
  onClose: () => void;
  employee: TimesheetModalEmployee | null;
  month: number;
  year: number;
  holidays: { date: string; name: string }[];
  orgName?: string;
  /** Called when HR clicks Approve inside the modal */
  onApprove?: (timesheetId: string) => void;
  /** Called when HR clicks Reject inside the modal */
  onReject?: (timesheetId: string) => void;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  SUBMITTED: { label: "Pending lead", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500" },
  APPROVED: { label: "Lead approved", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", dot: "bg-green-500" },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
  HR_SUBMITTED: { label: "Pending HR", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20", dot: "bg-violet-500" },
  HR_APPROVED: { label: "HR Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
};

const DAY_TYPE_CONFIG: Record<DayType, { label: string; rowClass: string; badgeClass: string }> = {
  WORKING: { label: "Working", rowClass: "", badgeClass: "bg-transparent text-muted-foreground border-transparent" },
  HOLIDAY: { label: "Holiday", rowClass: "bg-blue-500/5", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  WEEKEND: { label: "Weekend", rowClass: "bg-emerald-500/5", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  LEAVE: { label: "Leave", rowClass: "bg-yellow-500/5", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  HALF_DAY: { label: "Half day", rowClass: "bg-purple-500/5", badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

// ── Read-only row ─────────────────────────────────────────────────────────────

function ReadOnlyRow({ entry, holidayName }: { entry: TimesheetEntry; holidayName?: string }) {
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
        ) : <span className="text-muted-foreground/30 text-xs">—</span>}
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
        ) : <span className="text-muted-foreground/30">—</span>}
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
        ) : <span className="text-muted-foreground/30 text-xs">—</span>}
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
          )) : <span className="text-muted-foreground/30 text-xs">—</span>}
        </div>
      </td>
    </tr>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function TimesheetModal({
  open, onClose, employee, month, year, holidays, orgName, onApprove, onReject,
}: TimesheetModalProps) {
  const [downloading, setDownloading] = React.useState(false);

  if (!employee) return null;

  const ts = employee.timesheets[0];
  if (!ts) return null;

  const status = ts.status;
  const statusCfg = STATUS_CONFIG[status];
  const fullName = `${employee.firstName} ${employee.lastName}`;
  const monthName = MONTH_NAMES[month - 1];
  const shortYear = String(year).slice(2);

  const totalMins = ts.entries.reduce((acc, e) => {
    const taskMins = e.tasks.reduce((tAcc, t) => tAcc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
    return acc + Math.max(0, taskMins - (e.breakMinutes || 0));
  }, 0);
  const daysLogged = ts.entries.filter((e) => e.tasks.length > 0).length;

  async function handleDownload() {
    setDownloading(true);
    try {
      // Dynamic import so jsPDF is not bundled in the initial JS
      const { generateTimesheetPDF } = await import("@/lib/timesheet-pdf");
      generateTimesheetPDF({
        firstName: employee!.firstName,
        lastName: employee!.lastName,
        designation: employee!.designation,
        department: employee!.department,
        employeeId: employee!.employeeId,
        month,
        year,
        entries: ts.entries,
        holidays,
        status,
        orgName,
      });
      toast.success(`PDF downloaded — ${fullName} Timesheet Format '${shortYear} - ${monthName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[100vw] sm:max-w-[100vw] w-full h-[100vh] sm:h-[100vh] flex flex-col p-0 overflow-hidden border border-border/60 shadow-2xl gap-0">

        {/* ── Modal header ── */}
        <div className="relative shrink-0 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/90 to-primary pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

          <div className="relative px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Left: employee info */}
            <div className="flex items-center gap-5">
              <Avatar className="size-14 rounded-2xl border-2 border-white/20 shadow-xl shrink-0">
                <AvatarImage src={employee.avatar || ""} />
                <AvatarFallback className="text-lg font-black bg-white/10 text-white">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <DialogTitle className="text-xl font-black tracking-tight text-white">
                    {fullName}
                  </DialogTitle>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                    "bg-white/15 text-white border-white/20"
                  )}>
                    <span className="size-1.5 rounded-full bg-white/80" />
                    {statusCfg.label}
                  </span>
                </div>
                <DialogDescription className="text-white/70 text-sm mt-1 flex items-center gap-3 flex-wrap">
                  <span>{employee.designation}</span>
                  {employee.department && <><span className="opacity-40">·</span><span>{employee.department}</span></>}
                  {employee.employeeId && <><span className="opacity-40">·</span><span className="font-mono">{employee.employeeId}</span></>}
                </DialogDescription>
                {/* Stats row */}
                <div className="flex items-center gap-5 mt-2.5">
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <CalendarDaysIcon className="size-3.5" />
                    <span className="font-bold text-white">{daysLogged}</span> days logged
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <ClockIcon className="size-3.5" />
                    <span className="font-bold text-white">{formatHours(totalMins)}</span> total
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs">
                    <FileTextIcon className="size-3.5" />
                    <span className="font-bold text-white">{monthName} {year}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Reviewer actions (Lead or HR) */}
              {(status === "HR_SUBMITTED" || status === "SUBMITTED") && onApprove && onReject && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 h-9 px-4 rounded-xl font-bold text-white hover:bg-white/10 border border-white/20"
                    onClick={() => { onReject(ts.id); }}
                  >
                    <XCircleIcon className="size-3.5" />Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 h-9 px-5 rounded-xl font-bold bg-white text-primary hover:bg-white/95 shadow-lg"
                    onClick={() => { onApprove(ts.id); }}
                  >
                    <CheckCircle2Icon className="size-3.5" />
                    {status === "HR_SUBMITTED" ? "Final Approve" : "Approve"}
                  </Button>
                  <div className="w-px h-6 bg-white/20" />
                </>
              )}

              {/* HR Approved badge */}
              {status === "HR_APPROVED" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20">
                  <Building2Icon className="size-3.5 text-white" />
                  <span className="text-xs font-bold text-white">HR Approved</span>
                </div>
              )}

              {/* Download PDF */}
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2 h-9 px-5 rounded-xl font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all"
              >
                {downloading ? <Spinner className="size-3.5" /> : <DownloadIcon className="size-3.5" />}
                {downloading ? "Generating…" : "Download PDF"}
              </Button>

              {/* Close */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-9 px-4 rounded-xl font-bold text-white/70 hover:text-white hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>

          {/* Rejection note banner */}
          {status === "REJECTED" && ts.rejectionNote && (
            <div className="relative mx-8 mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20">
              <XCircleIcon className="size-4 text-white/80 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide mb-0.5">Rejection Feedback</p>
                <p className="text-xs text-white/80 leading-relaxed">{ts.rejectionNote}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Timesheet table ── */}
        <div className="flex-1 overflow-auto no-scrollbar bg-background">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/50 bg-muted/60 backdrop-blur-sm">
                {["Date", "Day", "Status", "Timeline", "Productivity", "Activity & Projects", "Documentation"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ts.entries.map((entry) => (
                <ReadOnlyRow
                  key={entry.id}
                  entry={entry}
                  holidayName={
                    entry.dayType === "HOLIDAY"
                      ? holidays.find((h) => h.date.split("T")[0] === entry.date.split("T")[0])?.name
                      : undefined
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-border/60 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {fullName} · {monthName} {year} · {daysLogged} days · {formatHours(totalMins)}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {fullName} Timesheet Format &apos;{shortYear} - {monthName}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
