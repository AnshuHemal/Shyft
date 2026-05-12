"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ArrowRightIcon,
  MessageSquareIcon,
} from "lucide-react";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  timesheets: {
    id: string;
    status: string;
    submittedAt: string;
    entries: {
      startTime: string | null;
      endTime: string | null;
      breakMinutes: number | null;
      tasks: { subject: string }[];
    }[];
  }[];
}

export function LeadApprovals() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [approvals, setApprovals] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  const [reviewTarget, setReviewTarget] = React.useState<{
    timesheetId: string;
    employeeName: string;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectionNote, setRejectionNote] = React.useState("");
  const [reviewLoading, setReviewLoading] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    fetchData();
  }, [month, year]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets/lead?month=${month}&year=${year}`);
      const json = await res.json();
      if (res.ok) setApprovals(json.approvals);
    } catch {
      toast.error("Failed to load team approvals.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/timesheets/${reviewTarget.timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewTarget.action,
          rejectionNote: reviewTarget.action === "reject" ? rejectionNote : undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Timesheet ${reviewTarget.action}ed successfully.`);
        setReviewTarget(null);
        setRejectionNote("");
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error || "Action failed.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setReviewLoading(false);
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

  return (
    <div className={cn("space-y-8 transition-all duration-700", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card/30 p-6 rounded-3xl border border-border/40 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Team Approvals</h1>
          <p className="text-muted-foreground mt-1.5 font-medium">Review and approve your team's monthly timesheets.</p>
        </div>
        <div className="flex items-center gap-3 bg-background/50 p-2 rounded-2xl border border-border/60">
          <Button variant="ghost" size="icon-sm" onClick={() => navigateMonth(-1)} className="rounded-xl">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-black min-w-32 text-center tracking-widest uppercase">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => navigateMonth(1)} className="rounded-xl">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 bg-muted/5 rounded-[3rem] border border-dashed border-border/60">
          <div className="relative size-16">
            <Spinner className="size-16 absolute inset-0 text-primary/20" />
            <ClockIcon className="size-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-bold tracking-tight text-muted-foreground italic">Fetching pending submissions...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/30 rounded-[3rem] border border-border/40">
          <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <CheckCircle2Icon className="size-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold">All caught up!</h3>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-medium">There are no timesheets waiting for your review in this period.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {approvals.map((emp, idx) => {
            const ts = emp.timesheets[0];
            const totalMins = ts.entries.reduce((acc, e) => {
              if (e.startTime && e.endTime) return acc + calcNetMinutes(e.startTime, e.endTime, e.breakMinutes ?? 0);
              return acc;
            }, 0);
            const daysLogged = ts.entries.filter(e => e.startTime && e.endTime).length;
            const uniqueTasks = Array.from(new Set(ts.entries.flatMap(e => e.tasks.map(t => t.subject)))).slice(0, 3);

            return (
              <Card key={emp.id} className="overflow-hidden border-border/40 shadow-xl shadow-primary/[0.02] hover:shadow-primary/[0.04] transition-all duration-500 rounded-[2.5rem] group">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left side: Profile */}
                    <div className="p-8 lg:w-80 bg-muted/10 border-r border-border/40 flex flex-col items-center text-center justify-center space-y-4">
                      <Avatar className="size-20 border-4 border-background shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <AvatarFallback className="text-xl font-black bg-primary/5 text-primary">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-black text-lg">{emp.firstName} {emp.lastName}</h3>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{emp.designation}</p>
                        {emp.department && <p className="text-[10px] text-muted-foreground font-black uppercase mt-1">{emp.department}</p>}
                      </div>
                    </div>

                    {/* Middle: Stats & Tasks */}
                    <div className="flex-1 p-8 space-y-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Time</p>
                          <p className="text-2xl font-black text-foreground tabular-nums">{formatHours(totalMins)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Days Logged</p>
                          <p className="text-2xl font-black text-foreground tabular-nums">{daysLogged}</p>
                        </div>
                        <div className="hidden sm:block space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Submitted</p>
                          <p className="text-sm font-bold text-foreground mt-2 italic">
                            {new Date(ts.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <CalendarDaysIcon className="size-3" />
                          Key Activities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {uniqueTasks.map((task, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 text-[11px] font-bold text-primary/80 border border-primary/10 truncate max-w-[200px]">
                              {task}
                            </span>
                          ))}
                          {uniqueTasks.length === 0 && <span className="text-xs text-muted-foreground italic">No tasks logged</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="p-8 lg:w-72 flex flex-col justify-center gap-3 bg-primary/[0.01] border-l border-border/40">
                      <Button 
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                        onClick={() => setReviewTarget({ timesheetId: ts.id, employeeName: `${emp.firstName} ${emp.lastName}`, action: "approve" })}
                      >
                        <CheckCircle2Icon className="size-4" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full h-12 rounded-2xl font-black uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                        onClick={() => setReviewTarget({ timesheetId: ts.id, employeeName: `${emp.firstName} ${emp.lastName}`, action: "reject" })}
                      >
                        <XCircleIcon className="size-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className={cn(
            "p-8 text-white",
            reviewTarget?.action === "approve" ? "bg-green-600" : "bg-rose-600"
          )}>
            <DialogHeader className="space-y-4">
              <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                {reviewTarget?.action === "approve" ? <CheckCircle2Icon className="size-8" /> : <XCircleIcon className="size-8" />}
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {reviewTarget?.action === "approve" ? "Approve Timesheet" : "Reject Timesheet"}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium text-base">
                {reviewTarget?.action === "approve" 
                  ? `Are you sure you want to approve ${reviewTarget?.employeeName}'s timesheet for ${MONTH_NAMES[month-1]}?`
                  : `Please provide a reason for rejecting ${reviewTarget?.employeeName}'s timesheet.`
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 bg-card space-y-6">
            {reviewTarget?.action === "reject" && (
              <Field>
                <FieldLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <MessageSquareIcon className="size-3" />
                  Rejection Reason
                </FieldLabel>
                <textarea
                  placeholder="Describe what needs to be fixed..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="w-full min-h-[120px] p-4 rounded-2xl bg-muted/30 border-none text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                />
              </Field>
            )}

            <DialogFooter className="flex gap-3 sm:justify-between pt-2">
              <Button variant="ghost" onClick={() => setReviewTarget(null)} disabled={reviewLoading} className="font-bold h-12 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={reviewLoading || (reviewTarget?.action === "reject" && !rejectionNote.trim())}
                className={cn(
                  "h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all",
                  reviewTarget?.action === "approve" 
                    ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" 
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                )}
              >
                {reviewLoading ? <Spinner className="size-4 mr-2" /> : <ArrowRightIcon className="size-4 mr-2" />}
                Confirm {reviewTarget?.action}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
