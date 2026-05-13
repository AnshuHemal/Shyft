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
  CalendarOffIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  SunIcon,
  LayersIcon,
  FilterIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  UsersIcon,
} from "lucide-react";

type LeaveType = "FULL_DAY" | "HALF_DAY" | "MULTI_DAY";
type HalfDaySession = "MORNING" | "AFTERNOON";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface EmployeeInfo {
  id: string; firstName: string; lastName: string;
  designation: string; department: string | null;
  avatar?: string | null; employeeId?: string | null;
}

interface LeaveRecord {
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
  employee: EmployeeInfo;
  reportingTo: { firstName: string; lastName: string; designation: string } | null;
}

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

const LEAVE_TYPE_LABELS: Record<LeaveType, { label: string; icon: React.ElementType }> = {
  FULL_DAY:  { label: "Full Day",        icon: CalendarDaysIcon },
  HALF_DAY:  { label: "Half Day",        icon: SunIcon },
  MULTI_DAY: { label: "Multiple Days",   icon: LayersIcon },
};

function ReviewDialog({
  open,
  leave,
  action,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  leave: LeaveRecord | null;
  action: "approve" | "reject";
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");
  if (!leave) return null;
  const empName = `${leave.employee.firstName} ${leave.employee.lastName}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn("p-8 text-white relative overflow-hidden", action === "approve" ? "bg-emerald-600" : "bg-rose-600")}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            {action === "approve" ? <CheckCircle2Icon className="size-24" /> : <XCircleIcon className="size-24" />}
          </div>
          <DialogHeader className="space-y-3 relative">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              {action === "approve" ? <CheckCircle2Icon className="size-7" /> : <XCircleIcon className="size-7" />}
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {action === "approve" ? "Approve Leave" : "Reject Leave"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              {action === "approve"
                ? `Approve ${empName}'s leave request? They will be notified immediately.`
                : `Provide a reason for rejecting ${empName}'s leave request.`}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 bg-card space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MessageSquareIcon className="size-3" />
              {action === "approve" ? "HR Comment (Optional)" : "Rejection Reason (Required)"}
            </label>
            <textarea
              rows={4}
              placeholder={action === "approve" ? "Add an optional note…" : "Explain why this leave is being rejected…"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={cn(
                "w-full p-4 rounded-2xl bg-muted/40 border-2 border-transparent text-sm font-medium transition-all resize-none focus:outline-none focus:bg-background",
                action === "approve" ? "focus:border-emerald-500/30" : "focus:border-rose-500/30"
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
                action === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
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

export function HRLeaveManagement() {
  const [leaves, setLeaves] = React.useState<LeaveRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | LeaveStatus>("ALL");
  const [reviewTarget, setReviewTarget] = React.useState<{ leave: LeaveRecord; action: "approve" | "reject" } | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);
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
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchLeaves(); }, []);

  async function handleReview(note: string) {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/leave/${reviewTarget.leave.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewTarget.action, hrNote: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Action failed."); return; }
      const empName = `${reviewTarget.leave.employee.firstName} ${reviewTarget.leave.employee.lastName}`;
      toast.success(
        reviewTarget.action === "approve"
          ? `${empName}'s leave approved.`
          : `${empName}'s leave rejected.`
      );
      setReviewTarget(null);
      fetchLeaves();
    } catch {
      toast.error("An error occurred.");
    } finally {
      setReviewLoading(false);
    }
  }

  const filtered = filter === "ALL" ? leaves : leaves.filter(l => l.status === filter);

  const counts = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === "PENDING").length,
    approved: leaves.filter(l => l.status === "APPROVED").length,
    rejected: leaves.filter(l => l.status === "REJECTED").length,
  };

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage employee leave applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: counts.total,    icon: UsersIcon,         color: "text-primary bg-primary/10" },
          { label: "Pending",  value: counts.pending,  icon: ClockIcon,         color: "text-amber-500 bg-amber-500/10" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2Icon,  color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Rejected", value: counts.rejected, icon: XCircleIcon,       color: "text-destructive bg-destructive/10" },
        ].map((s, i) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 60}ms` }}>
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
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
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

      {/* Leave table */}
      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div>
            <p className="text-sm font-semibold">Leave Applications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} application{filtered.length !== 1 ? "s" : ""} {filter !== "ALL" ? `· ${STATUS_CONFIG[filter].label}` : ""}
            </p>
          </div>
          <FilterIcon className="size-4 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading leave requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarOffIcon className="size-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No leave requests</p>
              <p className="text-xs text-muted-foreground mt-1">No applications match the selected filter.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Leave Type", "Duration", "Reporting To", "Reason", "Submitted", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((leave, idx) => {
                  const cfg = STATUS_CONFIG[leave.status];
                  const typeCfg = LEAVE_TYPE_LABELS[leave.leaveType];
                  const TypeIcon = typeCfg.icon;
                  const startStr = new Date(leave.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" });
                  const endStr = new Date(leave.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
                  const dateStr = leave.leaveType === "MULTI_DAY" ? `${startStr} – ${endStr}` : endStr;

                  return (
                    <tr key={leave.id} className="group hover:bg-muted/20 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 40}ms` }}>
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={leave.employee.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {leave.employee.firstName[0]}{leave.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{leave.employee.firstName} {leave.employee.lastName}</p>
                            <p className="text-xs text-muted-foreground">{leave.employee.designation}</p>
                          </div>
                        </div>
                      </td>
                      {/* Leave type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="size-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{typeCfg.label}</p>
                            {leave.halfDaySession && (
                              <p className="text-[11px] text-muted-foreground capitalize">{leave.halfDaySession.toLowerCase()}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Duration */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{dateStr}</p>
                      </td>
                      {/* Reporting to */}
                      <td className="px-6 py-4">
                        {leave.reportingTo ? (
                          <p className="text-sm text-muted-foreground">{leave.reportingTo.firstName} {leave.reportingTo.lastName}</p>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </td>
                      {/* Reason */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]" title={leave.reason}>
                          {leave.reason}
                        </p>
                      </td>
                      {/* Submitted */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(leave.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
                        {leave.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                              onClick={() => setReviewTarget({ leave, action: "approve" })}
                            >
                              <CheckCircle2Icon className="size-3" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => setReviewTarget({ leave, action: "reject" })}
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
        leave={reviewTarget?.leave ?? null}
        action={reviewTarget?.action ?? "approve"}
        loading={reviewLoading}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReview}
      />
    </div>
  );
}
