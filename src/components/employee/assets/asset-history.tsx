"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  LaptopIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  RefreshCwIcon,
  Undo2Icon,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type AssetRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type AssetAction = "ACQUIRE" | "REPLACE" | "RETURN";

interface AssetRequestRecord {
  id: string;
  action: AssetAction;
  requestedAsset: string | null;
  asset: { name: string; prodId: string } | null;
  reason: string;
  duration: string | null;
  status: AssetRequestStatus;
  hrNote: string | null;
  submittedAt: string;
}

const STATUS_CONFIG: Record<AssetRequestStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

const ACTION_LABELS: Record<AssetAction, { label: string, color: string }> = {
  ACQUIRE: { label: "Acquire", color: "text-blue-500" },
  REPLACE: { label: "Replace", color: "text-amber-500" },
  RETURN:  { label: "Return",  color: "text-rose-500" },
};

export function AssetHistory({ requests, loading, onRefresh }: {
  requests: AssetRequestRecord[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
        <Spinner className="size-6" />
        <p className="text-sm font-medium">Loading history…</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
          <LaptopIcon className="size-7 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">No requests yet</p>
          <p className="text-xs text-muted-foreground mt-1">Submit your asset requirements using the form.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{requests.length} Request{requests.length !== 1 ? "s" : ""}</p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCwIcon className="size-3" />Refresh
          </button>
        </div>

        {requests.map((record, i) => {
          const cfg = STATUS_CONFIG[record.status];
          const actionCfg = ACTION_LABELS[record.action];
          const assetName = record.action === "ACQUIRE" ? record.requestedAsset : record.asset?.name;
          const submittedStr = new Date(record.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

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
                    <LaptopIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[150px]" title={assetName || ""}>{assetName}</p>
                    <p className={cn("text-[10px] uppercase font-bold", actionCfg.color)}>{actionCfg.label}</p>
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
                <p className="text-xs text-foreground/80 line-clamp-2">{record.reason}</p>
                
                {(record.asset?.prodId || record.duration) && (
                  <div className="flex items-center gap-4 mt-2">
                    {record.asset?.prodId && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">ID:</span>
                        <span className="text-xs font-mono">{record.asset.prodId}</span>
                      </div>
                    )}
                    {record.duration && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Duration:</span>
                        <span className="text-xs font-medium">{record.duration}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                   <ClockIcon className="size-3 text-muted-foreground" />
                   <p className="text-[10px] font-bold text-muted-foreground">{submittedStr}</p>
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
      </div>
    </TooltipProvider>
  );
}
