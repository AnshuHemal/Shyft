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
  UsersIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, 
  FileTextIcon, ExternalLinkIcon, MapPinIcon, BriefcaseIcon, PhoneIcon,
  UserIcon
} from "lucide-react";

type OnboardingStatus = "PENDING_SUBMISSION" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

interface OnboardingRecord {
  id: string;
  status: OnboardingStatus;
  contactNumber: string;
  emergencyContactNumber: string;
  currentAddress: string;
  permanentAddress: string;
  dateOfBirth: string;
  isExperienced: boolean;
  passbookUrl: string;
  panCardUrl: string;
  aadhaarCardUrl: string;
  marksheet10thUrl: string;
  marksheet12thUrl: string;
  marksheetGraduationUrl: string;
  salarySlipUrl: string | null;
  experienceLetterUrl: string | null;
  relievingLetterUrl: string | null;
  passportPhotoUrl: string;
  casualPhotoUrl: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
    avatar: string | null;
  };
}

const STATUS_CONFIG: Record<OnboardingStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  PENDING_SUBMISSION: { label: "Not Submitted", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground", icon: ClockIcon },
  UNDER_REVIEW:       { label: "Review Required", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", icon: ClockIcon },
  APPROVED:           { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2Icon },
  REJECTED:           { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive", icon: XCircleIcon },
};

export function HROnboardingManagement() {
  const [records, setRecords] = React.useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | OnboardingStatus>("ALL");
  const [reviewTarget, setReviewTarget] = React.useState<{ record: OnboardingRecord; action: "review" | "view" } | null>(null);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding");
      const json = await res.json();
      if (res.ok) setRecords(json.onboardings ?? []);
    } catch {
      toast.error("Failed to load onboarding data.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchData(); }, []);

  const filtered = filter === "ALL" ? records : records.filter(r => r.status === filter);

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve new employee KYC and documents.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit">
        {(["ALL", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              filter === f ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "ALL" ? "All" : STATUS_CONFIG[f as OnboardingStatus].label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Spinner className="size-6" />
            <p className="text-sm font-medium">Loading onboardings…</p>
          </div>
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
             <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
               <UsersIcon className="size-8 text-muted-foreground/40" />
             </div>
             <p className="text-sm font-semibold">No records found</p>
           </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  {["Employee", "Designation", "Experience", "Submitted On", "Status"].map((h) => (
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
                {filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="group hover:bg-muted/20 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-xl border border-border/50 shrink-0">
                            <AvatarImage src={r.employee.avatar || r.passportPhotoUrl || ""} />
                            <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                              {r.employee.firstName[0]}{r.employee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{r.employee.firstName} {r.employee.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{r.employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium">{r.employee.designation}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-black px-2 py-1 rounded-lg bg-muted text-muted-foreground border">
                           {r.isExperienced ? "Experienced" : "Fresher"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold", cfg.color)}>
                          <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                         {r.status === "UNDER_REVIEW" ? (
                           <Button size="xs" onClick={() => setReviewTarget({ record: r, action: "review" })} className="h-8 px-3 rounded-lg gap-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                             Review Files
                           </Button>
                         ) : (
                           <Button size="xs" variant="outline" onClick={() => setReviewTarget({ record: r, action: "view" })} className="h-8 px-3 rounded-lg text-xs font-bold">
                             View Docs
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

      {reviewTarget && (
        <ReviewDialog 
          open={!!reviewTarget} 
          record={reviewTarget.record} 
          action={reviewTarget.action} 
          onClose={() => setReviewTarget(null)} 
          onRefresh={fetchData} 
        />
      )}
    </div>
  );
}

// ── Review Dialog ────────────────────────────────────────────────────────────
function ReviewDialog({ open, record, action, onClose, onRefresh }: any) {
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeDoc, setActiveDoc] = React.useState<{name: string, url: string} | null>(null);

  React.useEffect(() => {
    if (open && record) { 
      setNote(""); 
      setActiveDoc({ name: "PAN Card", url: record.panCardUrl });
    }
  }, [open, record]);

  if (!record) return null;

  const docs = [
    { name: "PAN Card", url: record.panCardUrl },
    { name: "Aadhaar Card", url: record.aadhaarCardUrl },
    { name: "Bank Passbook", url: record.passbookUrl },
    { name: "10th Marksheet", url: record.marksheet10thUrl },
    { name: "12th Marksheet", url: record.marksheet12thUrl },
    { name: "Graduation", url: record.marksheetGraduationUrl },
    { name: "Passport Photo", url: record.passportPhotoUrl },
    { name: "Casual Photo", url: record.casualPhotoUrl },
  ];

  if (record.isExperienced) {
    if (record.salarySlipUrl) docs.push({ name: "Salary Slip", url: record.salarySlipUrl });
    if (record.experienceLetterUrl) docs.push({ name: "Exp. Letter", url: record.experienceLetterUrl });
    if (record.relievingLetterUrl) docs.push({ name: "Relieving Letter", url: record.relievingLetterUrl });
  }

  async function handleConfirm(confirmAction: "approve" | "reject") {
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction, hrNote: note }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to process request"); return; }
      
      toast.success(`Onboarding ${confirmAction}d successfully.`);
      onClose();
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-7xl w-full h-[90vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
        {/* Header */}
        <div className={cn("px-6 py-4 text-white shrink-0 flex items-center justify-between", action === "view" ? "bg-muted-foreground" : "bg-blue-600")}>
          <div>
            <DialogTitle className="text-xl font-bold">
              {action === "view" ? "View Documents" : "Review Onboarding"}
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {record.employee.firstName} {record.employee.lastName} — {record.employee.designation}
            </DialogDescription>
          </div>
          {action === "review" && (
            <div className="flex gap-2">
               <Button onClick={() => handleConfirm("reject")} disabled={loading || !note.trim()} variant="outline" className="h-10 px-6 rounded-xl font-bold text-destructive hover:bg-destructive hover:text-white transition-all bg-white border-none shadow-md">
                 Reject
               </Button>
               <Button onClick={() => handleConfirm("approve")} disabled={loading} className="h-10 px-6 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all">
                 {loading ? <Spinner className="size-4" /> : "Approve & Unlock Account"}
               </Button>
            </div>
          )}
        </div>

        {/* Content: Left Side Document Viewer, Right Side List & Data */}
        <div className="flex-1 flex overflow-hidden bg-background">
          
          {/* Left: Document Viewer */}
          <div className="w-2/3 h-full border-r border-border/50 bg-muted/10 p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{activeDoc?.name}</h3>
              {activeDoc?.url && (
                <a href={activeDoc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Open Original <ExternalLinkIcon className="size-3" />
                </a>
              )}
            </div>
            <div className="flex-1 rounded-2xl border border-border/60 bg-card overflow-hidden relative shadow-sm">
               {activeDoc?.url ? (
                 activeDoc.url.toLowerCase().includes(".pdf") ? (
                   <iframe src={activeDoc.url} className="w-full h-full" />
                 ) : (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={activeDoc.url} alt={activeDoc.name} className="w-full h-full object-contain" />
                 )
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                   No document available
                 </div>
               )}
            </div>
          </div>

          {/* Right: Data & Documents List */}
          <div className="w-1/3 h-full overflow-y-auto p-6 space-y-6">
            
            {action === "review" && (
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-muted-foreground">HR Note (Required if Rejecting)</label>
                 <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-destructive/50 focus:bg-background text-sm resize-none focus:outline-none transition-all" placeholder="Enter reason for rejection..." />
              </div>
            )}

            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><UserIcon className="size-3" /> Personal Info</h4>
               <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                 <div><p className="text-[10px] text-muted-foreground font-bold">Contact Number</p><p className="text-sm font-medium">{record.contactNumber}</p></div>
                 <div><p className="text-[10px] text-muted-foreground font-bold">Emergency Contact</p><p className="text-sm font-medium">{record.emergencyContactNumber}</p></div>
                 <div><p className="text-[10px] text-muted-foreground font-bold">Current Address</p><p className="text-xs">{record.currentAddress}</p></div>
                 <div><p className="text-[10px] text-muted-foreground font-bold">Permanent Address</p><p className="text-xs">{record.permanentAddress}</p></div>
                 <div><p className="text-[10px] text-muted-foreground font-bold">Birthday (Date of Birth)</p><p className="text-sm font-medium">{new Date(record.dateOfBirth).toLocaleDateString()}</p></div>
               </div>
            </div>

            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><FileTextIcon className="size-3" /> Documents</h4>
               <div className="space-y-2">
                 {docs.map((doc) => (
                   <button
                     key={doc.name}
                     onClick={() => setActiveDoc(doc)}
                     className={cn(
                       "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left",
                       activeDoc?.name === doc.name 
                         ? "border-primary bg-primary/5 text-primary shadow-sm" 
                         : "border-border/60 bg-card hover:border-primary/30 text-foreground"
                     )}
                   >
                     <span className="text-xs font-bold">{doc.name}</span>
                     {doc.url ? <CheckCircle2Icon className="size-3.5 text-emerald-500" /> : <XCircleIcon className="size-3.5 text-destructive" />}
                   </button>
                 ))}
               </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
