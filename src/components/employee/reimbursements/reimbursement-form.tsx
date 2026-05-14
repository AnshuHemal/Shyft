"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  BanknoteIcon,
  CalendarDaysIcon,
  FileTextIcon,
  UploadCloudIcon,
  XIcon,
  CheckCircle2Icon,
  FileIcon,
  ImageIcon,
  ArrowRightIcon,
} from "lucide-react";

type ReimbursementCategory = "TRAVEL" | "FOOD" | "CLIENT_MEETING" | "EQUIPMENT" | "OTHER";

const CATEGORIES: { value: ReimbursementCategory; label: string; desc: string }[] = [
  { value: "TRAVEL", label: "Travel", desc: "Flights, cabs, transit" },
  { value: "FOOD", label: "Meals & Food", desc: "Meals during work/travel" },
  { value: "CLIENT_MEETING", label: "Client Meetings", desc: "Expenses with clients" },
  { value: "EQUIPMENT", label: "Equipment", desc: "Hardware, software, tools" },
  { value: "OTHER", label: "Other", desc: "Any other expense" },
];

interface UploadedFile {
  storageUrl: string;
  storagePublicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export function ReimbursementForm({ onSuccess }: { onSuccess: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<ReimbursementCategory>("OTHER");
  const [purpose, setPurpose] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canSubmit =
    Number(amount) > 0 &&
    purpose.trim().length >= 5 &&
    expenseDate &&
    files.length > 0 &&
    files.length <= 5;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    
    // Validations
    const validFiles = selected.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File ${f.name} is too large. Max 10MB.`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > 5) {
      toast.error("You can only upload up to 5 files.");
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadToCloudinary(): Promise<UploadedFile[]> {
    setUploading(true);
    try {
      // 1. Get Signature
      const sigRes = await fetch("/api/reimbursements/upload-signature", { method: "POST" });
      const sigData = await sigRes.json();
      if (!sigRes.ok) throw new Error(sigData.error || "Failed to get upload signature");

      const uploadedFiles: UploadedFile[] = [];

      // 2. Upload each file directly to Cloudinary
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Failed to upload file");

        uploadedFiles.push({
          storageUrl: uploadData.secure_url,
          storagePublicId: uploadData.public_id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      return uploadedFiles;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const uploadedProofs = await uploadToCloudinary();

      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          purpose: purpose.trim(),
          expenseDate,
          proofs: uploadedProofs,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to submit application."); return; }
      
      toast.success("Reimbursement application submitted!");
      setAmount(""); setPurpose(""); setExpenseDate(""); setFiles([]); setCategory("OTHER");
      onSuccess();
    } catch {
      // Error handled in uploadToCloudinary or fetch
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <BanknoteIcon className="size-3" />
            Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="any"
              required
              className="w-full h-12 rounded-xl border border-border/60 bg-transparent pl-8 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Expense Date */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <CalendarDaysIcon className="size-3" />
            Expense Date
          </label>
          <input
            type="date"
            value={expenseDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
            className="w-full h-12 rounded-xl border border-border/60 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map(({ value, label, desc }) => {
            const active = category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200",
                  active
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <p className={cn("text-xs font-bold", active ? "text-primary" : "")}>{label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Purpose */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <FileTextIcon className="size-3" />
          Purpose of Expense
        </label>
        <textarea
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Please describe what this expense was for..."
          required
          minLength={5}
          className="w-full rounded-2xl border border-border/60 bg-transparent px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Proof of Payment Upload */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <UploadCloudIcon className="size-3" />
            Proof of Payment (Up to 5 files, 10MB max each)
          </span>
          <span className="text-primary font-bold">{files.length} / 5</span>
        </label>
        
        <div 
          onClick={() => files.length < 5 && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2",
            files.length >= 5 
              ? "border-border/40 bg-muted/20 opacity-50 cursor-not-allowed" 
              : "border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-primary/40 cursor-pointer"
          )}
        >
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UploadCloudIcon className="size-5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Click to upload files</p>
          <p className="text-xs text-muted-foreground">Images or PDFs accepted</p>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={files.length >= 5}
          />
        </div>

        {/* File Preview List */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {file.type.startsWith("image/") ? (
                       <ImageIcon className="size-4 text-primary" />
                    ) : (
                       <FileIcon className="size-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || uploading || !canSubmit}
        className={cn(
          "w-full flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm transition-all duration-300",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        )}
      >
        {(submitting || uploading) ? (
          <><Spinner className="size-4" />{uploading ? "Uploading Proofs..." : "Submitting…"}</>
        ) : (
          <><ArrowRightIcon className="size-4" />Submit Application</>
        )}
      </button>
    </form>
  );
}
