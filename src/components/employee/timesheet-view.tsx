"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  MONTH_NAMES,
  DAY_NAMES,
  calcNetMinutes,
  formatHours,
  isWithinEditWindow,
  isFutureDate,
  TIME_OPTIONS,
  BREAK_OPTIONS,
} from "@/lib/timesheet-utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SendIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlusIcon,
  XIcon,
  LinkIcon,
  SaveIcon,
  CalendarDaysIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DayType = "WORKING" | "HOLIDAY" | "LEAVE" | "HALF_DAY" | "WEEKEND";
type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

interface TimesheetEntry {
  id: string;
  date: string;
  dayType: DayType;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number | null;
  workDone: string | null;
  links: string[];
}

interface Timesheet {
  id: string;
  month: number;
  year: number;
  status: TimesheetStatus;
  submittedAt: string | null;
  rejectionNote: string | null;
  entries: TimesheetEntry[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimesheetStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-muted text-muted-foreground border-border" },
  SUBMITTED: { label: "Submitted for review", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  APPROVED: { label: "Approved", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  REJECTED: { label: "Rejected — please revise", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const DAY_TYPE_CONFIG: Record<DayType, { label: string; rowClass: string; badgeClass: string }> = {
  WORKING: { label: "Working", rowClass: "", badgeClass: "bg-transparent text-muted-foreground border-transparent" },
  HOLIDAY: { label: "Holiday", rowClass: "bg-blue-500/5", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  WEEKEND: { label: "Weekend", rowClass: "bg-muted/30", badgeClass: "bg-muted text-muted-foreground border-border" },
  LEAVE: { label: "Leave", rowClass: "bg-yellow-500/5", badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  HALF_DAY: { label: "Half day", rowClass: "bg-purple-500/5", badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
};

// ── Row editor component ──────────────────────────────────────────────────────

interface RowEditorProps {
  entry: TimesheetEntry;
  onSave: (id: string, data: Partial<TimesheetEntry>) => Promise<void>;
  readOnly: boolean;
  holidayName?: string;
}

function RowEditor({ entry, onSave, readOnly, holidayName }: RowEditorProps) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [local, setLocal] = React.useState({
    dayType: entry.dayType,
    startTime: entry.startTime ?? "",
    endTime: entry.endTime ?? "",
    breakMinutes: String(entry.breakMinutes ?? 0),
    workDone: entry.workDone ?? "",
    links: entry.links ?? [],
  });
  const [newLink, setNewLink] = React.useState("");

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
    isWithinEditWindow(date) &&
    (entry.dayType === "WORKING" || entry.dayType === "HALF_DAY" || entry.dayType === "LEAVE");

  const netMins =
    local.startTime && local.endTime
      ? calcNetMinutes(local.startTime, local.endTime, Number(local.breakMinutes))
      : null;

  const cfg = DAY_TYPE_CONFIG[entry.dayType];

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entry.id, {
        dayType: local.dayType,
        startTime: local.startTime || null,
        endTime: local.endTime || null,
        breakMinutes: Number(local.breakMinutes),
        workDone: local.workDone || null,
        links: local.links,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function addLink() {
    const url = newLink.trim();
    if (!url) return;
    setLocal((l) => ({ ...l, links: [...l.links, url] }));
    setNewLink("");
  }

  function removeLink(i: number) {
    setLocal((l) => ({ ...l, links: l.links.filter((_, idx) => idx !== i) }));
  }

  return (
    <tr className={cn("border-b border-border/60 transition-colors", cfg.rowClass, editing && "ring-2 ring-inset ring-primary/20")}>
      {/* Date */}
      <td className="px-3 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap w-28">
        {dateStr}
      </td>
      {/* Day */}
      <td className="px-3 py-3 text-sm text-muted-foreground w-16">{dayName}</td>
      {/* Day type */}
      <td className="px-3 py-3 w-28">
        {editing && (local.dayType === "WORKING" || local.dayType === "LEAVE" || local.dayType === "HALF_DAY") ? (
          <select
            value={local.dayType}
            onChange={(e) => setLocal((l) => ({ ...l, dayType: e.target.value as DayType }))}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="WORKING">Working</option>
            <option value="HALF_DAY">Half day</option>
            <option value="LEAVE">Leave</option>
          </select>
        ) : (
          <div className="space-y-0.5">
            {entry.dayType === "HOLIDAY" && holidayName ? (
              <Tooltip>
                <TooltipTrigger className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium cursor-help", cfg.badgeClass)}>
                  {cfg.label}
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm font-medium">{holidayName}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", cfg.badgeClass)}>
                {cfg.label}
              </span>
            )}
          </div>
        )}
      </td>
      {/* Time duration */}
      <td className="px-3 py-3 w-64">
        {editing && (local.dayType === "WORKING" || local.dayType === "HALF_DAY") ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={local.startTime}
              onChange={(e) => setLocal((l) => ({ ...l, startTime: e.target.value }))}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Start</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">to</span>
            <select
              value={local.endTime}
              onChange={(e) => setLocal((l) => ({ ...l, endTime: e.target.value }))}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">End</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={local.breakMinutes}
              onChange={(e) => setLocal((l) => ({ ...l, breakMinutes: e.target.value }))}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              {BREAK_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {entry.startTime && entry.endTime ? (
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">
                  {entry.startTime} – {entry.endTime}
                </p>
                <p>Break: {entry.breakMinutes ?? 0} min · Net: {formatHours(calcNetMinutes(entry.startTime, entry.endTime, entry.breakMinutes ?? 0))}</p>
              </div>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </div>
        )}
      </td>
      {/* Net hours */}
      <td className="px-3 py-3 text-sm tabular-nums w-20">
        {netMins !== null && netMins > 0 ? (
          <span className="font-medium text-foreground">{formatHours(netMins)}</span>
        ) : entry.startTime && entry.endTime ? (
          <span className="font-medium text-foreground">
            {formatHours(calcNetMinutes(entry.startTime, entry.endTime, entry.breakMinutes ?? 0))}
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      {/* Work done */}
      <td className="px-3 py-3 min-w-[200px]">
        {editing ? (
          <textarea
            rows={3}
            placeholder="Describe what you worked on…"
            value={local.workDone}
            onChange={(e) => setLocal((l) => ({ ...l, workDone: e.target.value }))}
            className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
        ) : (
          <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-3">
            {entry.workDone || <span className="text-muted-foreground/50">—</span>}
          </p>
        )}
      </td>
      {/* Links */}
      <td className="px-3 py-3 w-40">
        {editing ? (
          <div className="space-y-1.5">
            {local.links.map((link, i) => (
              <div key={i} className="flex items-center gap-1">
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary truncate max-w-[100px] hover:underline">
                  {link.replace(/^https?:\/\//, "").slice(0, 20)}…
                </a>
                <button type="button" onClick={() => removeLink(i)} className="text-muted-foreground hover:text-destructive">
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-1">
              <input
                type="url"
                placeholder="https://…"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                className="flex-1 h-6 rounded border border-input bg-transparent px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/50 min-w-0"
              />
              <button type="button" onClick={addLink} className="text-primary hover:text-primary/80">
                <PlusIcon className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {entry.links.length > 0 ? (
              entry.links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                  <LinkIcon className="size-3 shrink-0" />
                  <span className="truncate">{link.replace(/^https?:\/\//, "").slice(0, 25)}</span>
                </a>
              ))
            ) : (
              <span className="text-muted-foreground/50 text-xs">—</span>
            )}
          </div>
        )}
      </td>
      {/* Actions */}
      <td className="px-3 py-3 w-24">
        {canEdit ? (
          editing ? (
            <div className="flex gap-1.5">
              <Button size="xs" className="gap-1 h-7 px-2" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner className="size-3" /> : <SaveIcon className="size-3" />}
                Save
              </Button>
              <Button size="xs" variant="ghost" className="h-7 px-2" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="xs" variant="outline" className="h-7 px-2" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )
        ) : null}
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
  const [mounted, setMounted] = React.useState(false);

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

  async function handleSaveEntry(id: string, data: Partial<TimesheetEntry>) {
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
    toast.success("Entry saved.");
  }

  async function handleSubmit() {
    if (!timesheet) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to submit timesheet.");
        return;
      }
      setTimesheet((ts) => ts ? { ...ts, status: "SUBMITTED" } : ts);
      toast.success("Timesheet submitted for review.");
    } finally {
      setSubmitting(false);
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
  const workingEntries = timesheet?.entries.filter(
    (e) => e.dayType === "WORKING" && e.startTime && e.endTime
  ) ?? [];
  const totalMins = workingEntries.reduce(
    (acc, e) => acc + calcNetMinutes(e.startTime!, e.endTime!, e.breakMinutes ?? 0),
    0
  );
  const daysLogged = workingEntries.length;
  const status = (timesheet?.status ?? "DRAFT") as TimesheetStatus;
  const statusCfg = STATUS_CONFIG[status];
  const canEdit = status === "DRAFT" || status === "REJECTED";
  const canSubmit = canEdit && daysLogged > 0;

  return (
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
          <p className="text-sm text-muted-foreground mt-1">
            Fill in your daily work log. You can edit entries within 48 hours.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigateMonth(1)}
            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Status + summary bar */}
      {timesheet && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", statusCfg.color)}>
            {statusCfg.label}
          </span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon className="size-3.5" />
              {daysLogged} days logged
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              {formatHours(totalMins)} total
            </span>
          </div>
          <div className="sm:ml-auto flex gap-2">
            {canSubmit && (
              <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner className="size-4" /> : <SendIcon className="size-4" />}
                {submitting ? "Submitting…" : "Submit for review"}
              </Button>
            )}
            {status === "APPROVED" && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2Icon className="size-4" />
                Approved
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rejection note */}
      {timesheet?.rejectionNote && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-destructive mb-1">Rejection note from HR</p>
          <p className="text-sm text-muted-foreground">{timesheet.rejectionNote}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          Loading timesheet…
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  {["Date", "Day", "Type", "Time Duration", "Net Hours", "Work Done", "Links", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timesheet?.entries.map((entry) => (
                  <RowEditor
                    key={entry.id}
                    entry={entry}
                    onSave={handleSaveEntry}
                    readOnly={!canEdit}
                    holidayName={
                      entry.dayType === "HOLIDAY"
                        ? holidays.find(
                            (h) =>
                              h.date.split("T")[0] ===
                              entry.date.split("T")[0]
                          )?.name
                        : undefined
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
