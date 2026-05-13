"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarOffIcon,
  CheckCircle2Icon,
  CalendarDaysIcon,
  SunIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";

type LeaveType = "FULL_DAY" | "HALF_DAY" | "MULTI_DAY";
type HalfDaySession = "MORNING" | "AFTERNOON";

interface LeaveRecord {
  id: string;
  leaveType: LeaveType;
  halfDaySession: HalfDaySession | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: "APPROVED";
  hrNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  employee: {
    id: string; firstName: string; lastName: string;
    designation: string; department: string | null; avatar?: string | null;
  };
  reportingTo: { firstName: string; lastName: string; designation: string } | null;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, { label: string; icon: React.ElementType }> = {
  FULL_DAY:  { label: "Full Day",       icon: CalendarDaysIcon },
  HALF_DAY:  { label: "Half Day",       icon: SunIcon },
  MULTI_DAY: { label: "Multiple Days",  icon: LayersIcon },
};

export function TeamLeave() {
  const [leaves, setLeaves] = React.useState<LeaveRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchLeaves() {
    setLoading(true);
    try {
      const res = await fetch("/api/leave/team");
      const json = await res.json();
      if (res.ok) setLeaves(json.leaves ?? []);
    } catch {
      toast.error("Failed to load team leaves.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchLeaves(); }, []);

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarOffIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Leave</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approved leaves for your team members — for awareness and planning.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
          <CheckCircle2Icon className="size-4 text-blue-500" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Only <span className="font-bold text-foreground">HR-approved</span> leaves are shown here. This view is read-only for planning purposes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center bg-primary/10">
            <UsersIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{leaves.length}</p>
            <p className="text-xs text-muted-foreground">Approved Leaves</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">
              {new Set(leaves.map(l => l.employee.id)).size}
            </p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
        </div>
      </div>

      {/* Leave cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Loading team leaves…</p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
            <CalendarOffIcon className="size-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No approved leaves</p>
            <p className="text-xs text-muted-foreground mt-1">Your team has no confirmed leave applications.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave, i) => {
            const typeCfg = LEAVE_TYPE_LABELS[leave.leaveType];
            const TypeIcon = typeCfg.icon;
            const startStr = new Date(leave.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
            const endStr = new Date(leave.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
            const dateStr = leave.leaveType === "MULTI_DAY" ? `${startStr} – ${endStr}` : startStr;

            return (
              <div
                key={leave.id}
                className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Avatar className="size-11 rounded-xl border border-border/50 shrink-0">
                  <AvatarImage src={leave.employee.avatar || ""} />
                  <AvatarFallback className="text-sm font-black bg-primary/5 text-primary">
                    {leave.employee.firstName[0]}{leave.employee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{leave.employee.firstName} {leave.employee.lastName}</p>
                  <p className="text-xs text-muted-foreground">{leave.employee.designation}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TypeIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {typeCfg.label}
                      {leave.halfDaySession && ` (${leave.halfDaySession.toLowerCase()})`}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs text-muted-foreground">{dateStr}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 border-l-[3px] border-border/60 pl-3">
                    {leave.reason}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Approved
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
