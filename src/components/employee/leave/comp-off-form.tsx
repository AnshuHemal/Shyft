"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarCheckIcon,
  CalendarXIcon,
  SunIcon,
  ClockIcon,
  AlignLeftIcon,
  UserIcon,
  CheckCircle2Icon,
  InfoIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from "lucide-react";

type CompDuration = "HALF_DAY" | "FULL_DAY" | "OTHER";

interface ReportingPerson {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  avatar?: string | null;
}

interface CompOffFormProps {
  reportingPersons: ReportingPerson[];
  defaultReportingId: string | null;
  onSuccess: () => void;
}

/** Returns today's date string YYYY-MM-DD in IST */
function getTodayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Returns weekday 0=Sun…6=Sat in IST for a YYYY-MM-DD string */
function getWeekdayIST(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00+05:30`).getDay();
}

const DURATION_OPTIONS: { value: CompDuration; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "HALF_DAY", label: "Half Day", desc: "Morning or afternoon", icon: SunIcon },
  { value: "FULL_DAY", label: "Full Day", desc: "Entire working day", icon: CalendarCheckIcon },
  { value: "OTHER",    label: "Other",    desc: "Specify custom duration", icon: ClockIcon },
];

function DurationSelector({
  label,
  value,
  onChange,
  otherValue,
  onOtherChange,
}: {
  label: string;
  value: CompDuration;
  onChange: (v: CompDuration) => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {DURATION_OPTIONS.map(({ value: v, label: l, desc, icon: Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 group",
                active
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-colors",
                active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="size-3.5" />
              </div>
              <div>
                <p className={cn("text-xs font-bold", active ? "text-primary" : "")}>{l}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      {value === "OTHER" && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder='e.g. "3 hours", "10am – 2pm"'
            className="w-full h-10 rounded-xl border border-border/60 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      )}
    </div>
  );
}

export function CompOffForm({ reportingPersons, defaultReportingId, onSuccess }: CompOffFormProps) {
  const todayIST = getTodayIST();
  const isSaturdayToday = getWeekdayIST(todayIST) === 6;

  const [compOnDuration, setCompOnDuration] = React.useState<CompDuration>("FULL_DAY");
  const [compOnOther, setCompOnOther] = React.useState("");
  const [compensationFor, setCompensationFor] = React.useState("");
  const [compForDuration, setCompForDuration] = React.useState<CompDuration>("FULL_DAY");
  const [compForOther, setCompForOther] = React.useState("");
  const [awarenessNote, setAwarenessNote] = React.useState("");
  const [reportingToId, setReportingToId] = React.useState(defaultReportingId ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Same-month check for UX preview
  const isSameMonth = React.useMemo(() => {
    if (!compensationFor) return null;
    const forDate = new Date(`${compensationFor}T00:00:00+05:30`);
    const onDate  = new Date(`${todayIST}T00:00:00+05:30`);
    return onDate.getFullYear() === forDate.getFullYear() && onDate.getMonth() === forDate.getMonth();
  }, [compensationFor, todayIST]);

  const canSubmit =
    isSaturdayToday &&
    !!compensationFor &&
    !!awarenessNote.trim() &&
    (compOnDuration !== "OTHER" || !!compOnOther.trim()) &&
    (compForDuration !== "OTHER" || !!compForOther.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comp-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compensationOn: todayIST,
          compOnDuration,
          compOnOther: compOnOther || undefined,
          compensationFor,
          compForDuration,
          compForOther: compForOther || undefined,
          awarenessNote: awarenessNote.trim(),
          reportingToId: reportingToId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to submit comp-off request."); return; }
      toast.success("Comp-off request submitted successfully!");
      setCompensationFor(""); setAwarenessNote("");
      setCompOnDuration("FULL_DAY"); setCompForDuration("FULL_DAY");
      setCompOnOther(""); setCompForOther("");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Not a Saturday — show locked state
  if (!isSaturdayToday) {
    return (
      <div className={cn(
        "transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <CalendarXIcon className="size-7 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Available on Saturdays Only</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Comp-off forms can only be submitted on the day you come to office (Saturday). Come back on your next work-Saturday.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-2">
            <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
              Today: {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Today's date badge */}
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
        <div className="size-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <CalendarCheckIcon className="size-3.5 text-emerald-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Compensation On (Today — Saturday)
          </p>
          <p className="text-[11px] font-mono text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      </div>

      {/* Duration of Work */}
      <DurationSelector
        label="Duration of Work"
        value={compOnDuration}
        onChange={setCompOnDuration}
        otherValue={compOnOther}
        onOtherChange={setCompOnOther}
      />

      {/* Compensation For date */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <CalendarXIcon className="size-3" />
          Compensation For (Leave Date)
        </label>
        <input
          type="date"
          value={compensationFor}
          max={todayIST}
          onChange={(e) => setCompensationFor(e.target.value)}
          required
          className="w-full h-11 rounded-xl border border-border/60 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <p className="text-[10px] text-muted-foreground">The date you had taken a leave and want to compensate for.</p>
      </div>

      {/* Same-month policy warning */}
      {compensationFor && isSameMonth === false && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex gap-3">
          <AlertTriangleIcon className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Policy Notice — Leave Not Cleared</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Your comp-off day and leave day are in <strong>different months</strong>. Per company policy, this leave will NOT be cleared and will count against your leave balance.
            </p>
          </div>
        </div>
      )}

      {compensationFor && isSameMonth === true && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex gap-3">
          <CheckCircle2Icon className="size-4 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Same Month — Leave Eligible for Clearance</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Your comp-off and leave fall in the same month. HR will acknowledge and the leave will be cleared.
            </p>
          </div>
        </div>
      )}

      {/* Duration of Leave */}
      <DurationSelector
        label="Duration of Leave"
        value={compForDuration}
        onChange={setCompForDuration}
        otherValue={compForOther}
        onOtherChange={setCompForOther}
      />

      {/* Reporting person */}
      {reportingPersons.length > 0 && (
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <UserIcon className="size-3" />
            Reporting Manager
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
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200",
                    selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                      : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
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

      {/* Awareness note */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <AlignLeftIcon className="size-3" />
          Anything management should be aware of?
        </label>
        <textarea
          rows={3}
          value={awarenessNote}
          onChange={(e) => setAwarenessNote(e.target.value)}
          placeholder="Write 'No' if there is nothing to inform…"
          required
          className="w-full rounded-2xl border border-border/60 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <InfoIcon className="size-2.5" /> Write <strong>'No'</strong> if there is nothing specific to report.
        </p>
      </div>

      {/* Preview */}
      {canSubmit && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Application Summary</p>
          <p className="text-sm font-semibold text-foreground">
            Worked {compOnDuration === "OTHER" ? compOnOther : compOnDuration.replace("_", " ").toLowerCase()} on{" "}
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
          </p>
          <p className="text-xs text-muted-foreground">
            To compensate for {compForDuration === "OTHER" ? compForOther : compForDuration.replace("_", " ").toLowerCase()} leave on{" "}
            {new Date(`${compensationFor}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          {isSameMonth !== null && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              isSameMonth ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
            )}>
              {isSameMonth ? "✓ Same month — leave will be cleared" : "⚠ Different month — leave will NOT be cleared"}
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !canSubmit}
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
          <><ArrowRightIcon className="size-4" />Submit Comp-Off Request</>
        )}
      </button>
    </form>
  );
}
