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
  LaptopIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  FilterIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  UsersIcon,
  BoxesIcon,
  PlusIcon,
  LinkIcon,
  UnlinkIcon,
} from "lucide-react";

type AssetStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED";
type AssetAction = "ACQUIRE" | "REPLACE" | "RETURN";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Asset {
  id: string;
  name: string;
  prodId: string;
  type: string | null;
  status: AssetStatus;
  assignedTo: { id: string; firstName: string; lastName: string; avatar: string | null } | null;
  assignedAt: string | null;
}

interface RequestRecord {
  id: string;
  action: AssetAction;
  requestedAsset: string | null;
  asset: Asset | null;
  reason: string;
  duration: string | null;
  status: RequestStatus;
  hrNote: string | null;
  submittedAt: string;
  employee: { id: string; firstName: string; lastName: string; avatar: string | null };
}

const REQ_STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",    dot: "bg-amber-500",  icon: ClockIcon },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20",                   dot: "bg-destructive", icon: XCircleIcon },
};

const ACTION_LABELS: Record<AssetAction, { label: string, color: string }> = {
  ACQUIRE: { label: "Acquire", color: "text-blue-500" },
  REPLACE: { label: "Replace", color: "text-amber-500" },
  RETURN:  { label: "Return",  color: "text-rose-500" },
};

export function HRAssetsManagement() {
  const [activeTab, setActiveTab] = React.useState<"REQUESTS" | "INVENTORY">("REQUESTS");
  const [requests, setRequests] = React.useState<RequestRecord[]>([]);
  const [inventory, setInventory] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Modals
  const [reviewTarget, setReviewTarget] = React.useState<{ record: RequestRecord; action: "approve" | "reject" | "view" } | null>(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  // Mounted
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [reqRes, invRes] = await Promise.all([
        fetch("/api/assets/requests"),
        fetch("/api/assets/inventory")
      ]);
      const [reqJson, invJson] = await Promise.all([reqRes.json(), invRes.json()]);
      
      if (reqRes.ok) setRequests(reqJson.requests ?? []);
      if (invRes.ok) setInventory(invJson.assets ?? []);
    } catch {
      toast.error("Failed to load asset data.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchData(); }, []);

  // -- Add Asset Modal State
  const [newAsset, setNewAsset] = React.useState({ name: "", prodId: "", type: "Laptop" });
  const [addLoading, setAddLoading] = React.useState(false);

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/assets/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to add asset"); return; }
      toast.success("Asset added to inventory");
      setAddModalOpen(false);
      setNewAsset({ name: "", prodId: "", type: "Laptop" });
      fetchData();
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets & Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage company equipment and employee requests.</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border/40">
          <button
            onClick={() => setActiveTab("REQUESTS")}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === "REQUESTS" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab("INVENTORY")}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", activeTab === "INVENTORY" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Inventory
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "REQUESTS" ? (
        <RequestsView requests={requests} inventory={inventory} loading={loading} onRefresh={fetchData} reviewTarget={reviewTarget} setReviewTarget={setReviewTarget} />
      ) : (
        <InventoryView inventory={inventory} loading={loading} onRefresh={fetchData} onAdd={() => setAddModalOpen(true)} />
      )}

      {/* Add Asset Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Add New Asset</DialogTitle>
            <DialogDescription>Register a new product in the company inventory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4">
             <div>
               <label className="text-[10px] font-black uppercase text-muted-foreground">Asset Name</label>
               <input required value={newAsset.name} onChange={(e) => setNewAsset({...newAsset, name: e.target.value})} className="w-full h-11 px-3 mt-1 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm focus:outline-none" placeholder="e.g., MacBook Pro M2" />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase text-muted-foreground">Prod ID</label>
               <input required value={newAsset.prodId} onChange={(e) => setNewAsset({...newAsset, prodId: e.target.value})} className="w-full h-11 px-3 mt-1 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm focus:outline-none" placeholder="e.g., LT-2024-001" />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase text-muted-foreground">Type</label>
               <select required value={newAsset.type} onChange={(e) => setNewAsset({...newAsset, type: e.target.value})} className="w-full h-11 px-3 mt-1 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm focus:outline-none">
                 <option value="Laptop">Laptop</option>
                 <option value="Monitor">Monitor</option>
                 <option value="Phone">Phone</option>
                 <option value="Accessory">Accessory</option>
                 <option value="Other">Other</option>
               </select>
             </div>
             <Button type="submit" disabled={addLoading} className="w-full h-11 rounded-xl font-bold uppercase tracking-widest mt-4">
               {addLoading ? <Spinner className="size-4" /> : "Add Asset"}
             </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Requests View ─────────────────────────────────────────────────────────────
function RequestsView({ requests, inventory, loading, onRefresh, reviewTarget, setReviewTarget }: any) {
  const [filter, setFilter] = React.useState<"ALL" | RequestStatus>("ALL");
  const filtered = filter === "ALL" ? requests : requests.filter((r: any) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              filter === f ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "ALL" ? "All" : REQ_STATUS_CONFIG[f as RequestStatus].label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading requests…</p>
          </div>
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
             <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
               <LaptopIcon className="size-8 text-muted-foreground/40" />
             </div>
             <p className="text-sm font-semibold">No requests found</p>
           </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Action", "Asset Details", "Date", "Status"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.1em] whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((r: any) => {
                  const cfg = REQ_STATUS_CONFIG[r.status as RequestStatus];
                  const actCfg = ACTION_LABELS[r.action as AssetAction];
                  return (
                    <tr key={r.id} className="group hover:bg-muted/20 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={r.employee.avatar || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {r.employee.firstName[0]}{r.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{r.employee.firstName} {r.employee.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] uppercase font-black px-2 py-1 rounded-lg bg-muted", actCfg.color)}>{actCfg.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        {r.action === "ACQUIRE" ? (
                          <p className="text-xs font-bold truncate max-w-[200px]" title={r.requestedAsset}>{r.requestedAsset}</p>
                        ) : (
                          <div>
                            <p className="text-xs font-bold truncate max-w-[200px]">{r.asset?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">ID: {r.asset?.prodId}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium">{new Date(r.submittedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.color)}>
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                         {r.status === "PENDING" ? (
                           <>
                             <Button size="xs" onClick={() => setReviewTarget({ record: r, action: "approve" })} className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                               Review
                             </Button>
                           </>
                         ) : (
                           <Button size="xs" variant="outline" onClick={() => setReviewTarget({ record: r, action: "view" })} className="h-8 px-3 rounded-lg text-xs font-bold">
                             Details
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
        record={reviewTarget?.record} 
        action={reviewTarget?.action} 
        inventory={inventory}
        onClose={() => setReviewTarget(null)} 
        onRefresh={onRefresh} 
      />
    </div>
  );
}

// ── Inventory View ────────────────────────────────────────────────────────────
function InventoryView({ inventory, loading, onAdd }: any) {
  if (loading) return <div className="py-24 text-center"><Spinner className="size-6 mx-auto text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="h-10 rounded-xl gap-2 font-bold bg-primary shadow-lg shadow-primary/20">
          <PlusIcon className="size-4" /> Add Asset
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {inventory.map((asset: any) => (
          <div key={asset.id} className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col justify-between">
             <div>
               <div className="flex items-start justify-between mb-2">
                 <div className="p-2 rounded-lg bg-primary/10 text-primary">
                   <LaptopIcon className="size-4" />
                 </div>
                 <span className={cn(
                   "text-[10px] font-black uppercase px-2 py-1 rounded-lg border",
                   asset.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                   asset.status === "ASSIGNED" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                   "bg-muted text-muted-foreground"
                 )}>
                   {asset.status}
                 </span>
               </div>
               <p className="font-bold text-sm truncate">{asset.name}</p>
               <p className="text-xs text-muted-foreground font-mono mt-1">Prod ID: {asset.prodId}</p>
               <p className="text-[10px] text-muted-foreground mt-0.5">{asset.type}</p>
             </div>
             
             <div className="mt-4 pt-4 border-t border-border/50">
               {asset.assignedTo ? (
                 <div className="flex items-center gap-2">
                   <Avatar className="size-6 rounded-md">
                     <AvatarImage src={asset.assignedTo.avatar || ""} />
                     <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{asset.assignedTo.firstName[0]}{asset.assignedTo.lastName[0]}</AvatarFallback>
                   </Avatar>
                   <p className="text-xs font-semibold truncate">{asset.assignedTo.firstName} {asset.assignedTo.lastName}</p>
                 </div>
               ) : (
                 <p className="text-xs text-muted-foreground/60 italic font-medium">Unassigned</p>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Review Dialog ────────────────────────────────────────────────────────────
function ReviewDialog({ open, record, action, inventory, onClose, onRefresh }: any) {
  const [note, setNote] = React.useState("");
  const [assignAssetId, setAssignAssetId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) { setNote(""); setAssignAssetId(""); }
  }, [open]);

  if (!record) return null;

  const needsAssignment = (action === "approve" && (record.action === "ACQUIRE" || record.action === "REPLACE"));
  const availableAssets = inventory.filter((a: any) => a.status === "AVAILABLE");

  async function handleConfirm(confirmAction: "approve" | "reject") {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/requests/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction, hrNote: note, assignAssetId }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to process request"); return; }
      
      toast.success(`Request ${confirmAction}d successfully.`);
      onClose();
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
        <div className={cn("p-6 text-white shrink-0", action === "view" ? "bg-muted-foreground" : "bg-blue-600")}>
          <DialogTitle className="text-xl font-bold">
            {action === "view" ? "Request Details" : `Review ${record.action} Request`}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            {record.employee.firstName} {record.employee.lastName}
          </DialogDescription>
        </div>

        <div className="p-6 bg-card space-y-5 overflow-y-auto max-h-[60vh]">
           <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
             <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Reason</p>
             <p className="text-sm">{record.reason}</p>
             {record.duration && <p className="text-xs text-muted-foreground mt-2 font-medium">Duration: {record.duration}</p>}
           </div>

           {record.action === "RETURN" || record.action === "REPLACE" ? (
             <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
               <p className="text-[10px] uppercase font-bold text-amber-600 mb-1">Returning Asset</p>
               <p className="text-sm font-bold">{record.asset?.name}</p>
               <p className="text-xs font-mono text-muted-foreground">ID: {record.asset?.prodId}</p>
             </div>
           ) : null}

           {record.action === "ACQUIRE" ? (
             <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
               <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Requested Asset</p>
               <p className="text-sm font-bold">{record.requestedAsset}</p>
             </div>
           ) : null}

           {needsAssignment && (
             <div className="space-y-1.5 pt-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <LinkIcon className="size-3" /> Assign from Inventory <span className="text-destructive">*</span>
               </label>
               {availableAssets.length === 0 ? (
                 <div className="p-3 text-sm rounded-xl border border-destructive/30 bg-destructive/10 text-destructive font-medium">
                   No available assets in inventory. Please add one first.
                 </div>
               ) : (
                 <select
                   value={assignAssetId}
                   onChange={(e) => setAssignAssetId(e.target.value)}
                   className="w-full h-11 px-3 rounded-xl bg-muted/40 border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all text-sm font-medium focus:outline-none appearance-none"
                 >
                   <option value="" disabled>Select available asset...</option>
                   {availableAssets.map((a: any) => (
                     <option key={a.id} value={a.id}>{a.name} ({a.prodId})</option>
                   ))}
                 </select>
               )}
             </div>
           )}

           {action === "approve" && (
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-muted-foreground">HR Note (Optional for Approval, Required for Rejection)</label>
               <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background text-sm resize-none focus:outline-none transition-all" placeholder="Enter notes here..." />
             </div>
           )}
        </div>

        <DialogFooter className="p-6 bg-card shrink-0 flex gap-3 sm:justify-between border-t border-border/50">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold h-11 rounded-xl">
            {action === "view" ? "Close" : "Cancel"}
          </Button>
          
          {action !== "view" && (
            <div className="flex gap-2">
               <Button onClick={() => handleConfirm("reject")} disabled={loading || !note.trim()} variant="outline" className="h-11 px-6 rounded-xl font-bold text-destructive hover:bg-destructive hover:text-white transition-all">
                 Reject
               </Button>
               <Button onClick={() => handleConfirm("approve")} disabled={loading || (needsAssignment && !assignAssetId)} className="h-11 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all">
                 {loading ? <Spinner className="size-4" /> : "Approve & Assign"}
               </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
