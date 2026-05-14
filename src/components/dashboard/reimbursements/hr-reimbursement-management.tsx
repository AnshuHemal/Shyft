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
  BanknoteIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  FilterIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  FileIcon,
  ImageIcon,
  UsersIcon,
  ExternalLinkIcon,
  LandmarkIcon,
} from "lucide-react";

type ReimbursementCategory = "TRAVEL" | "FOOD" | "CLIENT_MEETING" | "EQUIPMENT" | "OTHER";
type ReimbursementStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

interface Proof {
  id: string;
  storageUrl: string;
  fileName: string;
  fileType: string;
}

interface EmployeeInfo {
  id: string; firstName: string; lastName: string;
  designation: string; department: string | null;
  avatar?: string | null; employeeId?: string | null;
}

interface ReimbursementRecord {
  id: string;
  amount: number;
  category: ReimbursementCategory;
  purpose: string;
  expenseDate: string;
  status: ReimbursementStatus;
  hrNote: string | null;
  submittedAt: string;
  employee: EmployeeInfo;
  proofs: Proof[];
}

const STATUS_CONFIG: Record<ReimbursementStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",       dot: "bg-blue-500",   icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
  PAID:     { label: "Paid",     color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
};

const CATEGORY_LABELS: Record<ReimbursementCategory, string> = {
  TRAVEL: "Travel",
  FOOD: "Food",
  CLIENT_MEETING: "Client Meeting",
  EQUIPMENT: "Equipment",
  OTHER: "Other"
};

// ── Review Dialog ─────────────────────────────────────────────────────────────
function ReviewDialog({
  open, record, action, loading, onClose, onConfirm,
}: {
  open: boolean;
  record: ReimbursementRecord | null;
  action: "approve" | "reject" | "mark_paid" | "view";
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");
  if (!record) return null;
  const empName = `${record.employee.firstName} ${record.employee.lastName}`;
  const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.amount);

  let headerColor = "bg-primary";
  let HeaderIcon = BanknoteIcon;
  let title = "View Application";
  let description = `Review ${empName}'s reimbursement for ${formattedAmount}.`;

  if (action === "approve") {
    headerColor = "bg-blue-600";
    HeaderIcon = CheckCircle2Icon;
    title = "Approve Reimbursement";
    description = `Approve ${empName}'s claim for ${formattedAmount}? It will move to Pending Payout.`;
  } else if (action === "reject") {
    headerColor = "bg-rose-600";
    HeaderIcon = XCircleIcon;
    title = "Reject Reimbursement";
    description = `Provide a reason for rejecting this claim.`;
  } else if (action === "mark_paid") {
    headerColor = "bg-emerald-600";
    HeaderIcon = LandmarkIcon;
    title = "Mark as Paid";
    description = `Confirm that ${formattedAmount} has been paid to ${empName}?`;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
        <div className={cn("p-8 text-white relative overflow-hidden shrink-0", headerColor)}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            <HeaderIcon className="size-24" />
          </div>
          <DialogHeader className="space-y-3 relative">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl">
              <HeaderIcon className="size-7" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 bg-card space-y-6 overflow-y-auto min-h-0">
           {/* Summary Cards */}
           <div className="grid grid-cols-2 gap-3">
             <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Category</p>
               <p className="text-sm font-semibold">{CATEGORY_LABELS[record.category]}</p>
             </div>
             <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Expense Date</p>
               <p className="text-sm font-semibold">{new Date(record.expenseDate).toLocaleDateString()}</p>
             </div>
           </div>

           <div>
             <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Purpose</p>
             <p className="text-sm">{record.purpose}</p>
           </div>

           {/* Proofs */}
           <div>
             <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Proof of Payment ({record.proofs.length})</p>
             <div className="space-y-2">
               {record.proofs.map((proof, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                   <div className="flex items-center gap-3 overflow-hidden">
                     <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                       {proof.fileType?.startsWith("image/") ? (
                          <ImageIcon className="size-4 text-primary" />
                       ) : (
                          <FileIcon className="size-4 text-primary" />
                       )}
                     </div>
                     <p className="text-sm font-semibold truncate">{proof.fileName}</p>
                   </div>
                   <a 
                     href={proof.storageUrl} 
                     target="_blank" 
                     rel="noreferrer"
                     className="p-2 rounded-lg bg-background border border-border/60 text-primary hover:bg-primary/5 transition-colors"
                   >
                     <ExternalLinkIcon className="size-4" />
                   </a>
                 </div>
               ))}
             </div>
           </div>

          {(action === "approve" || action === "reject") && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageSquareIcon className="size-3" />
                {action === "approve" ? "HR Comment (Optional)" : "Rejection Reason (Required)"}
              </label>
              <textarea
                rows={3}
                placeholder={action === "approve" ? "Add an optional note…" : "Explain why this is being rejected…"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={cn(
                  "w-full p-4 rounded-2xl bg-muted/40 border-2 border-transparent text-sm font-medium transition-all resize-none focus:outline-none focus:bg-background",
                  action === "approve" ? "focus:border-blue-500/30" : "focus:border-rose-500/30"
                )}
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 bg-card shrink-0 flex gap-3 sm:justify-between">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold h-11 rounded-xl">
            {action === "view" ? "Close" : "Cancel"}
          </Button>
          
          {action !== "view" && (
            <Button
              onClick={() => onConfirm(note)}
              disabled={loading || (action === "reject" && !note.trim())}
              className={cn(
                "h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 gap-2",
                action === "approve" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 text-white" : "",
                action === "reject" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 text-white" : "",
                action === "mark_paid" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white" : ""
              )}
            >
              {loading ? <Spinner className="size-4" /> : <ArrowRightIcon className="size-4" />}
              Confirm {action === "mark_paid" ? "Paid" : action}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main HR Reimbursement Management ──────────────────────────────────────────
export function HRReimbursementManagement() {
  const [reimbursements, setReimbursements] = React.useState<ReimbursementRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | ReimbursementStatus>("ALL");
  const [reviewTarget, setReviewTarget] = React.useState<{ record: ReimbursementRecord; action: "approve" | "reject" | "mark_paid" | "view" } | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchReimbursements() {
    setLoading(true);
    try {
      const res = await fetch("/api/reimbursements");
      const json = await res.json();
      if (res.ok) setReimbursements(json.reimbursements ?? []);
    } catch {
      toast.error("Failed to load reimbursements.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchReimbursements(); }, []);

  async function handleReview(note: string) {
    if (!reviewTarget || reviewTarget.action === "view") return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/reimbursements/${reviewTarget.record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewTarget.action, hrNote: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Action failed."); return; }
      
      const empName = `${reviewTarget.record.employee.firstName} ${reviewTarget.record.employee.lastName}`;
      toast.success(`${empName}'s reimbursement updated successfully.`);
      
      setReviewTarget(null);
      fetchReimbursements();
    } catch {
      toast.error("An error occurred.");
    } finally {
      setReviewLoading(false);
    }
  }

  const filtered = filter === "ALL" ? reimbursements : reimbursements.filter(r => r.status === filter);
  const counts = {
    total:    reimbursements.length,
    pending:  reimbursements.filter(r => r.status === "PENDING").length,
    approved: reimbursements.filter(r => r.status === "APPROVED").length,
    rejected: reimbursements.filter(r => r.status === "REJECTED").length,
    paid:     reimbursements.filter(r => r.status === "PAID").length,
  };

  const totalAmountPending = reimbursements.filter(r => r.status === "PENDING").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reimbursement Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and manage employee expense claims.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Claims",  value: counts.total,    icon: UsersIcon,        color: "text-primary bg-primary/10" },
          { label: "Pending",       value: counts.pending,  icon: ClockIcon,        color: "text-amber-500 bg-amber-500/10" },
          { label: "Approved",      value: counts.approved, icon: CheckCircle2Icon, color: "text-blue-500 bg-blue-500/10" },
          { label: "Paid",          value: counts.paid,     icon: LandmarkIcon,     color: "text-emerald-500 bg-emerald-500/10" },
          { 
            label: "Pending Payout Amount", 
            value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalAmountPending), 
            icon: BanknoteIcon,     
            color: "text-amber-500 bg-amber-500/10" 
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className={cn("rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500", i === 4 ? "col-span-2 lg:col-span-1" : "")}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", s.color)}>
              <s.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit">
        {(["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"] as const).map((f) => (
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
            <p className="text-sm font-semibold">Expense Claims</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} claim{filtered.length !== 1 ? "s" : ""} {filter !== "ALL" ? `· ${STATUS_CONFIG[filter].label}` : ""}
            </p>
          </div>
          <FilterIcon className="size-4 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading claims…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <BanknoteIcon className="size-8 text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">No claims found</p>
              <p className="text-xs text-muted-foreground mt-1">No reimbursements match the selected filter.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Amount", "Category", "Purpose", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((record, idx) => {
                  const cfg = STATUS_CONFIG[record.status];
                  const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.amount);

                  return (
                    <tr
                      key={record.id}
                      className="group hover:bg-muted/20 transition-colors duration-200 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={record.employee.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {record.employee.firstName[0]}{record.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{record.employee.firstName} {record.employee.lastName}</p>
                            <p className="text-xs text-muted-foreground">{record.employee.designation}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Amount */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold tabular-nums text-foreground">{formattedAmount}</p>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{CATEGORY_LABELS[record.category]}</p>
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4">
                         <p className="text-xs text-muted-foreground line-clamp-2 max-w-[150px]" title={record.purpose}>{record.purpose}</p>
                      </td>

                      {/* Expense Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium">{new Date(record.expenseDate).toLocaleDateString()}</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.color)}>
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                         <Button
                           size="xs"
                           variant="outline"
                           className="h-8 px-3 rounded-lg text-xs font-bold transition-colors"
                           onClick={() => setReviewTarget({ record, action: "view" })}
                         >
                           View Details
                         </Button>

                        {record.status === "PENDING" && (
                          <>
                            <Button
                              size="xs"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
                              onClick={() => setReviewTarget({ record, action: "approve" })}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => setReviewTarget({ record, action: "reject" })}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {record.status === "APPROVED" && (
                           <Button
                             size="xs"
                             className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                             onClick={() => setReviewTarget({ record, action: "mark_paid" })}
                           >
                             <LandmarkIcon className="size-3" />
                             Mark Paid
                           </Button>
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
        action={reviewTarget?.action ?? "view"}
        loading={reviewLoading}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReview}
      />
    </div>
  );
}
