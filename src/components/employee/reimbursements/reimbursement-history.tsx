"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  RefreshCwIcon,
  CalendarDaysIcon,
  FileIcon,
  ExternalLinkIcon,
  ImageIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type ReimbursementStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";
type ReimbursementCategory = "TRAVEL" | "FOOD" | "CLIENT_MEETING" | "EQUIPMENT" | "OTHER";

interface Proof {
  id: string;
  storageUrl: string;
  fileName: string;
  fileType: string;
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
  proofs: Proof[];
}

const STATUS_CONFIG: Record<ReimbursementStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved",       color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",       dot: "bg-blue-500",   icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected",       color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
  PAID:     { label: "Paid",           color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
};

const CATEGORY_LABELS: Record<ReimbursementCategory, string> = {
  TRAVEL: "Travel",
  FOOD: "Food",
  CLIENT_MEETING: "Client Meeting",
  EQUIPMENT: "Equipment",
  OTHER: "Other"
};

export function ReimbursementHistory({ reimbursements, loading, onRefresh }: {
  reimbursements: ReimbursementRecord[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [selectedProofs, setSelectedProofs] = React.useState<Proof[]>([]);
  const [proofsModalOpen, setProofsModalOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <Spinner className="size-6" />
        <p className="text-sm font-medium">Loading history…</p>
      </div>
    );
  }

  if (reimbursements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
          <BanknoteIcon className="size-7 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">No applications yet</p>
          <p className="text-xs text-muted-foreground mt-1">Submit your expenses using the form.</p>
        </div>
      </div>
    );
  }

  function viewProofs(proofs: Proof[]) {
    setSelectedProofs(proofs);
    setProofsModalOpen(true);
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{reimbursements.length} application{reimbursements.length !== 1 ? "s" : ""}</p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCwIcon className="size-3" />Refresh
          </button>
        </div>

        {reimbursements.map((record, i) => {
          const cfg = STATUS_CONFIG[record.status];
          const expStr = new Date(record.expenseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
          const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.amount);

          return (
            <div
              key={record.id}
              className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary shrink-0">
                    <BanknoteIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{formattedAmount}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">{CATEGORY_LABELS[record.category]}</p>
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

              {/* Details row */}
              <div className="pl-[52px] space-y-2">
                <p className="text-xs text-foreground/80 line-clamp-2">{record.purpose}</p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">{expStr}</p>
                  </div>
                  
                  <button 
                    onClick={() => viewProofs(record.proofs)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <FileIcon className="size-3.5" />
                    {record.proofs.length} Proof{record.proofs.length !== 1 ? "s" : ""}
                  </button>
                </div>

                {/* HR note on rejection */}
                {record.hrNote && record.status === "REJECTED" && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 mt-2">
                    <p className="text-[11px] font-bold text-destructive">HR Note:</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{record.hrNote}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Proofs Modal */}
        <Dialog open={proofsModalOpen} onOpenChange={setProofsModalOpen}>
          <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold">Proof of Payment</DialogTitle>
              <DialogDescription>Uploaded documents and receipts</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              {selectedProofs.map((proof, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
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
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}
