"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { 
  BuildingIcon, ChevronRightIcon, ChevronLeftIcon, 
  UploadCloudIcon, CheckCircle2Icon, XCircleIcon,
  UserIcon, BriefcaseIcon, FileTextIcon, CameraIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Personal Details", icon: UserIcon },
  { id: 2, title: "Professional", icon: BriefcaseIcon },
  { id: 3, title: "Identity Docs", icon: FileTextIcon },
  { id: 4, title: "Education & Exp", icon: FileTextIcon },
  { id: 5, title: "Photos & Review", icon: CameraIcon }
];

export function EmployeeOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadingText, setUploadingText] = React.useState("");

  // Pre-filled data from server
  const [employeeData, setEmployeeData] = React.useState<{firstName: string, lastName: string, email: string, designation: string, joiningDate: string} | null>(null);

  // Status Check
  const [status, setStatus] = React.useState<"PENDING_SUBMISSION" | "UNDER_REVIEW" | "APPROVED" | "REJECTED">("PENDING_SUBMISSION");
  const [hrNote, setHrNote] = React.useState<string | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    contactNumber: "",
    emergencyContactNumber: "",
    currentAddress: "",
    permanentAddress: "",
    dateOfBirth: "",
    isExperienced: false,
  });

  const [files, setFiles] = React.useState<Record<string, File | null>>({
    passbook: null,
    panCard: null,
    aadhaarCard: null,
    marksheet10th: null,
    marksheet12th: null,
    marksheetGraduation: null,
    salarySlip: null,
    experienceLetter: null,
    relievingLetter: null,
    passportPhoto: null,
    casualPhoto: null
  });

  React.useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/onboarding");
        const json = await res.json();
        if (json.employee) setEmployeeData(json.employee);
        
        if (json.onboarding) {
          setStatus(json.onboarding.status);
          setHrNote(json.onboarding.hrNote);
          // Pre-fill form if rejected
          if (json.onboarding.status === "REJECTED") {
             setFormData({
               contactNumber: json.onboarding.contactNumber,
               emergencyContactNumber: json.onboarding.emergencyContactNumber,
               currentAddress: json.onboarding.currentAddress,
               permanentAddress: json.onboarding.permanentAddress,
               dateOfBirth: new Date(json.onboarding.dateOfBirth).toISOString().split('T')[0],
               isExperienced: json.onboarding.isExperienced,
             });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  function handleFileChange(key: string, file: File | null) {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max 10MB allowed.");
      return;
    }
    setFiles(prev => ({ ...prev, [key]: file }));
  }

  // --- Step Validations ---
  function validateStep(s: number) {
    if (s === 1) {
      if (!formData.contactNumber || !formData.emergencyContactNumber || !formData.currentAddress || !formData.permanentAddress || !formData.dateOfBirth) return false;
      if (formData.contactNumber === formData.emergencyContactNumber) {
        toast.error("Emergency contact cannot be the same as your personal contact number.");
        return false;
      }
    }
    if (s === 2) return true; // Just a toggle right now, pre-filled data is readonly
    if (s === 3) {
      if (!files.panCard || !files.aadhaarCard || !files.passbook) return false;
    }
    if (s === 4) {
      if (!files.marksheet10th || !files.marksheet12th || !files.marksheetGraduation) return false;
      if (formData.isExperienced && (!files.salarySlip || !files.experienceLetter || !files.relievingLetter)) return false;
    }
    if (s === 5) {
      if (!files.passportPhoto || !files.casualPhoto) return false;
    }
    return true;
  }

  function nextStep() {
    if (validateStep(step)) setStep(prev => prev + 1);
    else toast.error("Please complete all required fields correctly.");
  }

  // --- Submission Logic ---
  async function uploadFile(file: File, sigData: any): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sigData.apiKey);
    fd.append("timestamp", sigData.timestamp.toString());
    fd.append("signature", sigData.signature);
    fd.append("folder", sigData.folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`, {
      method: "POST",
      body: fd,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Failed to upload file");
    return uploadData.secure_url;
  }

  async function handleSubmit() {
    if (!validateStep(5)) { toast.error("Please provide all required photos."); return; }

    setSubmitting(true);
    setUploadingText("Initializing secure upload...");
    try {
      // 1. Get Signature
      const sigRes = await fetch("/api/onboarding/upload-signature", { method: "POST" });
      const sigData = await sigRes.json();
      if (!sigRes.ok) throw new Error("Failed to get upload signature");

      const uploadedUrls: Record<string, string | null> = {};
      const fileKeys = Object.keys(files);

      for (let i = 0; i < fileKeys.length; i++) {
        const key = fileKeys[i];
        const file = files[key];
        if (file) {
          setUploadingText(`Uploading ${key}... (${i+1}/${fileKeys.filter(k => files[k]).length})`);
          uploadedUrls[key] = await uploadFile(file, sigData);
        } else {
          uploadedUrls[key] = null;
        }
      }

      setUploadingText("Saving your details...");

      // 2. Submit Data
      const payload = {
        ...formData,
        passbookUrl: uploadedUrls.passbook,
        panCardUrl: uploadedUrls.panCard,
        aadhaarCardUrl: uploadedUrls.aadhaarCard,
        marksheet10thUrl: uploadedUrls.marksheet10th,
        marksheet12thUrl: uploadedUrls.marksheet12th,
        marksheetGraduationUrl: uploadedUrls.marksheetGraduation,
        salarySlipUrl: uploadedUrls.salarySlip,
        experienceLetterUrl: uploadedUrls.experienceLetter,
        relievingLetterUrl: uploadedUrls.relievingLetter,
        passportPhotoUrl: uploadedUrls.passportPhoto,
        casualPhotoUrl: uploadedUrls.casualPhoto,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save onboarding data.");
      }

      toast.success("Onboarding submitted successfully!");
      setStatus("UNDER_REVIEW");
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setSubmitting(false);
      setUploadingText("");
    }
  }

  if (loading) return <div className="py-24 text-center"><Spinner className="size-8 mx-auto" /></div>;

  if (status === "UNDER_REVIEW") {
    return (
      <div className="bg-card rounded-3xl p-8 border border-border/50 text-center shadow-xl space-y-4 max-w-xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="size-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
          <ClockIcon className="size-10 text-blue-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold">Under Review</h2>
        <p className="text-muted-foreground">Your onboarding documents have been submitted securely and are currently being reviewed by HR. You will be notified once approved.</p>
      </div>
    );
  }

  // Helper component for file uploads
  const FileUpload = ({ label, fileKey, desc, accept = "application/pdf,image/*" }: { label: string, fileKey: string, desc?: string, accept?: string }) => {
    const file = files[fileKey];
    return (
      <div className="space-y-1.5">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label} <span className="text-destructive">*</span>
        </label>
        {desc && <p className="text-[10px] text-muted-foreground/70">{desc}</p>}
        <div className="relative">
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(fileKey, e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={cn(
            "w-full h-12 px-4 rounded-xl border-2 flex items-center justify-between transition-all duration-200",
            file ? "border-emerald-500/30 bg-emerald-500/5" : "border-dashed border-border/60 hover:border-primary/40 bg-muted/20"
          )}>
            <div className="flex items-center gap-2 overflow-hidden">
              {file ? <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" /> : <UploadCloudIcon className="size-4 text-muted-foreground shrink-0" />}
              <span className={cn("text-sm truncate", file ? "text-foreground font-medium" : "text-muted-foreground")}>
                {file ? file.name : "Click to upload file"}
              </span>
            </div>
            {file && <span className="text-[10px] text-muted-foreground shrink-0 pl-2">{(file.size/1024/1024).toFixed(1)} MB</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {status === "REJECTED" && hrNote && (
        <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-5 flex gap-4">
          <XCircleIcon className="size-6 text-destructive shrink-0" />
          <div>
            <h3 className="font-bold text-destructive">Action Required: Form Rejected</h3>
            <p className="text-sm text-destructive/80 mt-1">{hrNote}</p>
            <p className="text-xs text-muted-foreground mt-2">Please fix the issues and re-submit your documents. Note: You must re-upload all files for security reasons.</p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border/50 rounded-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500" 
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isPassed = s.id < step;
          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                isActive ? "bg-primary border-background text-primary-foreground scale-110 shadow-lg shadow-primary/30" : 
                isPassed ? "bg-primary border-background text-primary-foreground" : 
                "bg-muted border-background text-muted-foreground"
              )}>
                {isPassed ? <CheckCircle2Icon className="size-5" /> : <s.icon className="size-4" />}
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-24 text-center", isActive ? "text-primary" : "text-muted-foreground opacity-50 hidden sm:block")}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-3xl p-6 sm:p-10 border border-border/50 shadow-xl mt-12 min-h-[400px] flex flex-col justify-between relative overflow-hidden">
        
        {/* Step Content */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            {STEPS.find(s => s.id === step)?.title}
          </h2>

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Name & Email</label>
                 <div className="h-12 px-4 rounded-xl bg-muted/40 border border-border/50 flex items-center text-sm font-medium text-muted-foreground">
                   {employeeData?.firstName} {employeeData?.lastName} ({employeeData?.email})
                 </div>
                 <p className="text-[10px] text-muted-foreground/50">Auto-filled by HR.</p>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Birthday (Date of Birth) <span className="text-destructive">*</span></label>
                 <input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5 hidden md:block" />
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Contact Number <span className="text-destructive">*</span></label>
                 <input type="tel" required value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full h-12 px-4 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Emergency Contact <span className="text-destructive">*</span></label>
                 <input type="tel" required value={formData.emergencyContactNumber} onChange={e => setFormData({...formData, emergencyContactNumber: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full h-12 px-4 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm focus:outline-none" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Current Address <span className="text-destructive">*</span></label>
                 <textarea rows={2} required value={formData.currentAddress} onChange={e => setFormData({...formData, currentAddress: e.target.value})} className="w-full p-4 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Permanent Address <span className="text-destructive">*</span></label>
                 <textarea rows={2} required value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} className="w-full p-4 rounded-xl bg-muted/20 border-2 border-border/50 focus:border-primary/50 focus:bg-background transition-all text-sm focus:outline-none resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Designation</label>
                 <div className="h-12 px-4 rounded-xl bg-muted/40 border border-border/50 flex items-center text-sm font-medium text-muted-foreground">{employeeData?.designation}</div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[11px] font-black uppercase text-muted-foreground">Date of Joining</label>
                 <div className="h-12 px-4 rounded-xl bg-muted/40 border border-border/50 flex items-center text-sm font-medium text-muted-foreground">{new Date(employeeData?.joiningDate || "").toLocaleDateString()}</div>
              </div>
              
              <div className="md:col-span-2 mt-4 space-y-4">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Work Experience <span className="text-destructive">*</span></label>
                <p className="text-sm text-muted-foreground">Are you joining us as a Fresher or an Experienced Professional?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setFormData({...formData, isExperienced: false})} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2", !formData.isExperienced ? "border-primary bg-primary/10 shadow-sm text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground")}>
                    <UserIcon className="size-6" />
                    <span className="font-bold">Fresher</span>
                  </button>
                  <button onClick={() => setFormData({...formData, isExperienced: true})} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2", formData.isExperienced ? "border-primary bg-primary/10 shadow-sm text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground")}>
                    <BriefcaseIcon className="size-6" />
                    <span className="font-bold">Experienced</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">Upload scanned copies or clear photos. Max 10MB per file.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label="PAN Card (Front & Back)" fileKey="panCard" accept="application/pdf" desc="Must be a single PDF file." />
                <FileUpload label="Aadhaar Card (Front & Back)" fileKey="aadhaarCard" accept="application/pdf" desc="Must be a single PDF file." />
                <FileUpload label="Bank Passbook (1st Page)" fileKey="passbook" desc="Must clearly show Account No. and IFSC." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">Please upload your educational and professional documents.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-sm border-b pb-2">Education (Required)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FileUpload label="10th Marksheet" fileKey="marksheet10th" accept="application/pdf" />
                    <FileUpload label="12th Marksheet" fileKey="marksheet12th" accept="application/pdf" />
                    <FileUpload label="Graduation / Last Sem" fileKey="marksheetGraduation" accept="application/pdf" />
                  </div>
                </div>

                {formData.isExperienced && (
                  <div className="md:col-span-2 space-y-4 mt-4 animate-in fade-in duration-500">
                    <h3 className="font-bold text-sm border-b pb-2 text-amber-500">Experience Documents (Mandatory for Experienced)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FileUpload label="Last 3 Months Salary Slip" fileKey="salarySlip" accept="application/pdf" />
                      <FileUpload label="Experience Letter" fileKey="experienceLetter" accept="application/pdf" />
                      <FileUpload label="Relieving Letter" fileKey="relievingLetter" accept="application/pdf" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <FileUpload label="Passport Size Photo" fileKey="passportPhoto" accept="image/*" desc="For official ID card." />
                 <FileUpload label="A Nice Picture of Yours" fileKey="casualPhoto" accept="image/*" desc="For team introductions!" />
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 text-center">
                <CheckCircle2Icon className="size-12 text-primary mx-auto" />
                <h3 className="text-lg font-bold">Ready to Submit</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">By submitting, you confirm that all information and documents provided are authentic and accurate.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-6 border-t border-border/50 flex justify-between items-center">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={cn("h-11 px-6 rounded-xl font-bold transition-all flex items-center gap-2", step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-muted text-muted-foreground")}
          >
            <ChevronLeftIcon className="size-4" /> Back
          </button>
          
          {step < STEPS.length ? (
            <button
              onClick={nextStep}
              className="h-11 px-8 rounded-xl bg-foreground text-background font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              Continue <ChevronRightIcon className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-11 px-8 rounded-xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 min-w-[180px] justify-center"
            >
              {submitting ? (
                <><Spinner className="size-4" /> {uploadingText || "Submitting..."}</>
              ) : (
                <>Submit Onboarding <CheckCircle2Icon className="size-4" /></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// Dummy clock icon for the under review state
function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}
