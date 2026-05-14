"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  FilterIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  UsersIcon,
  CalendarDaysIcon,
} from "lucide-react";

type CompDuration = "HALF_DAY" | "FULL_DAY" | "OTHER";
type CompOffStatus = "PENDING" | "ACKNOWLEDGED" | "REJECTED";

interface EmployeeInfo {
  id: string; firstName: string; lastName: string;
  designation: string; department: string | null;
  avatar?: string | null; employeeId?: string | null;
}

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
  employee: EmployeeInfo;
  reportingTo: { firstName: string; lastName: string; designation: string } | null;
}

const STATUS_CONFIG: Record<CompOffStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:      { label: "Pending",      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  ACKNOWLEDGED: { label: "Acknowledged", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED:     { label: "Rejected",     color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

function formatDuration(duration: CompDuration, other: string | null) {
  if (duration === "HALF_DAY") return "Half Day";
  if (duration === "FULL_DAY") return "Full Day";
  return other ?? "Custom";
}

// ── Review Dialog ─────────────────────────────────────────────────────────────
function ReviewDialog({
  open, record, action, loading, onClose, onConfirm,
}: {
  open: boolean;
  record: CompOffRecord | null;
  action: "acknowledge" | "reject";
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");
  if (!record) return null;
  const empName = `${record.employee.firstName} ${record.employee.lastName}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn("p-8 text-white relative overflow-hidden", action === "acknowledge" ? "bg-emerald-600" : "bg-rose-600")}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            {action === "acknowledge" ? <CheckCircle2Icon className="size-24" /> : <XCircleIcon className="size-24" />}
          </div>
          <DialogHeader className="space-y-3 relative">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              {action === "acknowledge" ? <CheckCircle2Icon className="size-7" /> : <XCircleIcon className="size-7" />}
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {action === "acknowledge" ? "Acknowledge Comp-Off" : "Reject Comp-Off"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              {action === "acknowledge"
                ? `Acknowledge ${empName}'s comp-off request? The leave will be marked as cleared.`
                : `Provide a reason for rejecting ${empName}'s comp-off request.`}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 bg-card space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MessageSquareIcon className="size-3" />
              {action === "acknowledge" ? "HR Comment (Optional)" : "Rejection Reason (Required)"}
            </label>
            <textarea
              rows={4}
              placeholder={action === "acknowledge" ? "Add an optional note…" : "Explain why this comp-off is being rejected…"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={cn(
                "w-full p-4 rounded-2xl bg-muted/40 border-2 border-transparent text-sm font-medium transition-all resize-none focus:outline-none focus:bg-background",
                action === "acknowledge" ? "focus:border-emerald-500/30" : "focus:border-rose-500/30"
              )}
            />
          </div>
          <DialogFooter className="flex gap-3 sm:justify-between">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(note)}
              disabled={loading || (action === "reject" && !note.trim())}
              className={cn(
                "h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 gap-2",
                action === "acknowledge" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
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

// ── Main HR Comp-Off Management ───────────────────────────────────────────────
export function HRCompOffManagement() {
  const [compOffs, setCompOffs] = React.useState<CompOffRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | CompOffStatus>("ALL");
  const [reviewTarget, setReviewTarget] = React.useState<{ record: CompOffRecord; action: "acknowledge" | "reject" } | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchCompOffs() {
    setLoading(true);
    try {
      const res = await fetch("/api/comp-off");
      const json = await res.json();
      if (res.ok) setCompOffs(json.compOffs ?? []);
    } catch {
      toast.error("Failed to load comp-off requests.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchCompOffs(); }, []);

  async function handleReview(note: string) {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/comp-off/${reviewTarget.record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewTarget.action, hrNote: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Action failed."); return; }
      const empName = `${reviewTarget.record.employee.firstName} ${reviewTarget.record.employee.lastName}`;
      toast.success(
        reviewTarget.action === "acknowledge"
          ? `${empName}'s comp-off acknowledged. Leave cleared.`
          : `${empName}'s comp-off rejected.`
      );
      setReviewTarget(null);
      fetchCompOffs();
    } catch {
      toast.error("An error occurred.");
    } finally {
      setReviewLoading(false);
    }
  }

  const filtered = filter === "ALL" ? compOffs : compOffs.filter(c => c.status === filter);
  const counts = {
    total:        compOffs.length,
    pending:      compOffs.filter(c => c.status === "PENDING").length,
    acknowledged: compOffs.filter(c => c.status === "ACKNOWLEDGED").length,
    rejected:     compOffs.filter(c => c.status === "REJECTED").length,
  };

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",         value: counts.total,        icon: UsersIcon,         color: "text-primary bg-primary/10" },
          { label: "Pending",       value: counts.pending,      icon: ClockIcon,         color: "text-amber-500 bg-amber-500/10" },
          { label: "Acknowledged",  value: counts.acknowledged, icon: CheckCircle2Icon,  color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Rejected",      value: counts.rejected,     icon: XCircleIcon,       color: "text-destructive bg-destructive/10" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={cn("size-9 rounded-xl flex items-center justify-center", s.color)}>
              <s.icon className="size-4" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit">
        {(["ALL", "PENDING", "ACKNOWLEDGED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              filter === f ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "ALL" ? "All" : STATUS_CONFIG[f].label}
            <span className="ml-1.5 text-[10px] opacity-60">
              {f === "ALL" ? counts.total : counts[f.toLowerCase() as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div>
            <p className="text-sm font-semibold">Comp-Off Requests</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} {filter !== "ALL" ? `· ${STATUS_CONFIG[filter].label}` : ""}
            </p>
          </div>
          <FilterIcon className="size-4 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading comp-off requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarCheckIcon className="size-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No comp-off requests</p>
              <p className="text-xs text-muted-foreground mt-1">No requests match the selected filter.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Worked On", "Leave Taken", "Policy", "Reporting To", "Note", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((co, idx) => {
                  const cfg = STATUS_CONFIG[co.status];
                  const onStr  = new Date(co.compensationOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
                  const forStr = new Date(co.compensationFor).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

                  return (
                    <tr
                      key={co.id}
                      className="group hover:bg-muted/20 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={co.employee.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {co.employee.firstName[0]}{co.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{co.employee.firstName} {co.employee.lastName}</p>
                            <p className="text-xs text-muted-foreground">{co.employee.designation}</p>
                          </div>
                        </div>
                      </td>
                      {/* Worked On */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarCheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{onStr}</p>
                            <p className="text-[11px] text-muted-foreground">{formatDuration(co.compOnDuration, co.compOnOther)}</p>
                          </div>
                        </div>
                      </td>
                      {/* Leave Taken */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarDaysIcon className="size-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{forStr}</p>
                            <p className="text-[11px] text-muted-foreground">{formatDuration(co.compForDuration, co.compForOther)}</p>
                          </div>
                        </div>
                      </td>
                      {/* Policy flag */}
                      <td className="px-6 py-4">
                        {co.isSameMonth ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2Icon className="size-2.5" /> Same month
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <AlertTriangleIcon className="size-2.5" /> Diff. month
                          </span>
                        )}
                      </td>
                      {/* Reporting to */}
                      <td className="px-6 py-4">
                        {co.reportingTo ? (
                          <p className="text-sm text-muted-foreground">{co.reportingTo.firstName} {co.reportingTo.lastName}</p>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </td>
                      {/* Awareness note */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]" title={co.awarenessNote}>
                          {co.awarenessNote}
                        </p>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.color)}>
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {co.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                              onClick={() => setReviewTarget({ record: co, action: "acknowledge" })}
                            >
                              <CheckCircle2Icon className="size-3" />
                              Acknowledge
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => setReviewTarget({ record: co, action: "reject" })}
                            >
                              <XCircleIcon className="size-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReviewDialog
        open={!!reviewTarget}
        record={reviewTarget?.record ?? null}
        action={reviewTarget?.action ?? "acknowledge"}
        loading={reviewLoading}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReview}
      />
    </div>
  );
}
