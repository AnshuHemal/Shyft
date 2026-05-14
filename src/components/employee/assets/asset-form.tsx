"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { LaptopIcon, RefreshCwIcon, Undo2Icon } from "lucide-react";

type ActionType = "ACQUIRE" | "REPLACE" | "RETURN";

interface Asset {
  id: string;
  name: string;
  prodId: string;
  type: string | null;
}

const ACTION_CARDS: { id: ActionType; label: string; desc: string; icon: React.ElementType; color: string; border: string }[] = [
  { id: "ACQUIRE", label: "Acquire", desc: "Request new equipment", icon: LaptopIcon, color: "text-blue-500 bg-blue-500/10", border: "border-blue-500" },
  { id: "REPLACE", label: "Replace", desc: "Swap a faulty item", icon: RefreshCwIcon, color: "text-amber-500 bg-amber-500/10", border: "border-amber-500" },
  { id: "RETURN",  label: "Return",  desc: "Hand back an asset", icon: Undo2Icon, color: "text-rose-500 bg-rose-500/10", border: "border-rose-500" },
];

export function AssetForm({ assignedAssets, onSubmitted }: { assignedAssets: Asset[], onSubmitted: () => void }) {
  const [action, setAction] = React.useState<ActionType>("ACQUIRE");
  const [requestedAsset, setRequestedAsset] = React.useState("");
  const [assetId, setAssetId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [duration, setDuration] = React.useState("Permanent");
  const [loading, setLoading] = React.useState(false);

  // Reset fields on action change
  React.useEffect(() => {
    setRequestedAsset("");
    setAssetId("");
    if (action === "RETURN") setDuration("");
  }, [action]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/assets/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestedAsset, assetId, reason, duration }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        toast.error(json.error ?? "Submission failed");
        return;
      }
      
      toast.success("Asset request submitted!");
      setRequestedAsset("");
      setAssetId("");
      setReason("");
      onSubmitted();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xs">
      <div className="px-6 py-5 border-b border-border/60 bg-muted/20">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">New Request</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Action Toggle */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Asset is being:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTION_CARDS.map((ac) => {
              const selected = action === ac.id;
              return (
                <button
                  key={ac.id}
                  type="button"
                  onClick={() => setAction(ac.id)}
                  className={cn(
                    "relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left overflow-hidden",
                    selected ? cn("bg-background shadow-md", ac.border) : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border/80"
                  )}
                >
                  {selected && (
                    <div className={cn("absolute inset-0 opacity-5", ac.color.split(' ')[1])} />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors", selected ? ac.color : "bg-primary/5 text-primary")}>
                      <ac.icon className="size-4" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", selected ? "text-foreground" : "text-foreground/70")}>
                        {ac.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ac.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {action === "ACQUIRE" ? (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Name of the Asset <span className="text-destructive">*</span>
              </label>
              <input
                required
                placeholder="e.g., MacBook Pro, External Monitor"
                value={requestedAsset}
                onChange={(e) => setRequestedAsset(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm font-medium focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Assigned Asset <span className="text-destructive">*</span>
              </label>
              {assignedAssets.length === 0 ? (
                <div className="h-12 px-4 rounded-xl bg-muted/40 border border-border/50 flex items-center text-sm text-muted-foreground">
                  No assets currently assigned to you.
                </div>
              ) : (
                <select
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm font-medium focus:outline-none appearance-none"
                >
                  <option value="" disabled>Select an asset...</option>
                  {assignedAssets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Prod ID: {a.prodId})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {action !== "RETURN" && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Duration of requirement <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm font-medium focus:outline-none appearance-none"
              >
                <option value="Permanent">Permanent</option>
                <option value="Temporary (1 Month)">Temporary (1 Month)</option>
                <option value="Temporary (3 Months)">Temporary (3 Months)</option>
                <option value="Until Project Completion">Until Project Completion</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Reason for {action.toLowerCase()}ing <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please provide details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm font-medium focus:outline-none resize-none"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={loading || (action !== "ACQUIRE" && !assetId)}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Spinner className="size-5" /> : `Submit Request`}
        </button>
      </form>
    </div>
  );
}
