"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  CalendarCheckIcon,
  CalendarXIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";

type CompDuration = "HALF_DAY" | "FULL_DAY" | "OTHER";
type CompOffStatus = "PENDING" | "ACKNOWLEDGED" | "REJECTED";

interface CompOffRecord {
  id: string;
  compensationOn: string;
  compOnDuration: CompDuration;
  compOnOther: string | null;
  compensationFor: string;
  compForDuration: CompDuration;
  compForOther: string | null;
  isSameMonth: boolean;
  awarenessNote: string;
  status: CompOffStatus;
  hrNote: string | null;
  submittedAt: string;
  reportingTo: { firstName: string; lastName: string; designation: string } | null;
}

const STATUS_CONFIG: Record<CompOffStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:      { label: "Pending Review",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  ACKNOWLEDGED: { label: "Acknowledged",    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED:     { label: "Rejected",        color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

function formatDuration(duration: CompDuration, other: string | null): string {
  if (duration === "HALF_DAY") return "Half Day";
  if (duration === "FULL_DAY") return "Full Day";
  return other ?? "Custom";
}

export function CompOffHistory({ compOffs, loading, onRefresh }: {
  compOffs: CompOffRecord[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <Spinner className="size-6" />
        <p className="text-sm font-medium">Loading comp-off history…</p>
      </div>
    );
  }

  if (compOffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
          <CalendarCheckIcon className="size-7 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">No comp-off requests yet</p>
          <p className="text-xs text-muted-foreground mt-1">Submit a comp-off form on any working Saturday.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{compOffs.length} request{compOffs.length !== 1 ? "s" : ""}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCwIcon className="size-3" />Refresh
        </button>
      </div>

      {compOffs.map((co, i) => {
        const cfg = STATUS_CONFIG[co.status];
        const StatusIcon = cfg.icon;
        const onStr = new Date(co.compensationOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
        const forStr = new Date(co.compensationFor).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

        return (
          <div
            key={co.id}
            className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary shrink-0">
                  <CalendarCheckIcon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Worked {formatDuration(co.compOnDuration, co.compOnOther)}</p>
                  <p className="text-xs text-muted-foreground">{onStr}</p>
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

            {/* Leave date row */}
            <div className="pl-[52px] space-y-1.5">
              <div className="flex items-center gap-2">
                <CalendarXIcon className="size-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  For leave on <span className="font-semibold text-foreground">{forStr}</span>
                  {" "}({formatDuration(co.compForDuration, co.compForOther)})
                </p>
              </div>

              {/* Same-month policy badge */}
              {!co.isSameMonth && (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2.5 py-1.5">
                  <AlertTriangleIcon className="size-3 text-amber-500 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Different month — leave not cleared by policy
                  </p>
                </div>
              )}

              {co.reportingTo && (
                <p className="text-[10px] text-muted-foreground/60">
                  Reporting to: {co.reportingTo.firstName} {co.reportingTo.lastName} · {co.reportingTo.designation}
                </p>
              )}
            </div>

            {/* HR note on rejection */}
            {co.hrNote && co.status === "REJECTED" && (
              <div className="pl-[52px]">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <p className="text-[11px] font-bold text-destructive">HR Note:</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{co.hrNote}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main employee-facing comp-off section ─────────────────────────────────────

export function EmployeeCompOff() {
  const [compOffs, setCompOffs] = React.useState<CompOffRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchCompOffs() {
    setLoading(true);
    try {
      const res = await fetch("/api/comp-off");
      const json = await res.json();
      if (res.ok) setCompOffs(json.compOffs ?? []);
    } catch {
      toast.error("Failed to load comp-off history.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchCompOffs(); }, []);

  return { compOffs, loading, refetch: fetchCompOffs };
}
