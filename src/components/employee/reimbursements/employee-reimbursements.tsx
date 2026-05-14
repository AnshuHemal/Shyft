"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BanknoteIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { ReimbursementForm } from "./reimbursement-form";
import { ReimbursementHistory } from "./reimbursement-history";

export function EmployeeReimbursements() {
  const [reimbursements, setReimbursements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(() => {
    fetchReimbursements();
  }, []);

  const pendingCount = reimbursements.filter(r => r.status === "PENDING").length;
  const approvedPaidCount = reimbursements.filter(r => r.status === "APPROVED" || r.status === "PAID").length;

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BanknoteIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reimbursements</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Submit and track your company expenses.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: reimbursements.length, color: "text-primary bg-primary/10" },
          { label: "Pending Review",     value: pendingCount,   color: "text-amber-500 bg-amber-500/10" },
          { label: "Approved / Paid",    value: approvedPaidCount,  color: "text-emerald-500 bg-emerald-500/10" },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3"
          >
            <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>
              <BanknoteIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold">New Reimbursement Claim</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the details and upload proof of payment.</p>
          </div>
          <ReimbursementForm onSuccess={() => { fetchReimbursements(); }} />
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-5 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          <div>
            <h2 className="text-base font-bold">My Claims History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track the status of your submitted expenses.</p>
          </div>
          <ReimbursementHistory reimbursements={reimbursements} loading={loading} onRefresh={fetchReimbursements} />
        </div>
      </div>
    </div>
  );
}
