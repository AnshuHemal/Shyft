"use client";

import * as React from "react";
import { 
  CheckCircle2Icon, 
  UserIcon, 
  ArrowRightIcon, 
  ShieldCheckIcon,
  ChevronRightIcon,
  SearchIcon,
  Loader2Icon,
  UsersIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
}

interface SubmissionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reviewerId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function SubmissionModal({
  isOpen,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: SubmissionModalProps) {
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen]);

  async function fetchManagers() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/management-chain");
      const data = await res.json();
      if (res.ok) {
        setManagers(data.chain || []);
        if (data.chain?.length > 0) {
          setSelectedId(data.chain[0].id); // Default to direct manager
        }
      }
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      toast.error("Failed to load your reporting line.");
    } finally {
      setLoading(false);
    }
  }

  const handleConfirm = async () => {
    if (!selectedId) {
      toast.error("Please select a reviewer");
      return;
    }
    await onConfirm(selectedId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b border-border/50">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
              <ShieldCheckIcon className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Select Reviewer</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose who should review and approve your timesheet.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="relative">
                <Spinner className="size-8" />
                <UsersIcon className="size-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
              </div>
              <p className="text-sm font-medium animate-pulse">Scanning management chain...</p>
            </div>
          ) : managers.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="size-16 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground/50">
                <UsersIcon className="size-8" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No reporting leads found.</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
                Please contact HR to assign a reporting manager to your account.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[350px] px-2 py-2">
              <div className="space-y-2">
                {managers.map((manager, index) => (
                  <button
                    key={manager.id}
                    onClick={() => setSelectedId(manager.id)}
                    className={cn(
                      "w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border text-left overflow-hidden",
                      selectedId === manager.id
                        ? "bg-primary/5 border-primary shadow-sm shadow-primary/10"
                        : "bg-background border-border/50 hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    {/* Selection Indicator Line */}
                    {selectedId === manager.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}

                    <div className="relative">
                      <Avatar className="size-10 border border-border/50 shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <AvatarFallback className={cn(
                          "font-bold text-sm",
                          selectedId === manager.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          {manager.firstName[0]}{manager.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 size-4 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full flex items-center justify-center" title="Direct Manager">
                          <CheckCircle2Icon className="size-2 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "font-semibold text-sm truncate",
                          selectedId === manager.id ? "text-foreground" : "text-foreground/80"
                        )}>
                          {manager.firstName} {manager.lastName}
                        </p>
                        {index === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 uppercase tracking-wider">
                            Direct
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {manager.designation}
                      </p>
                    </div>

                    <div className={cn(
                      "transition-all duration-300",
                      selectedId === manager.id ? "text-primary translate-x-0 opacity-100" : "text-muted-foreground -translate-x-2 opacity-0 group-hover:opacity-50"
                    )}>
                      <ChevronRightIcon className="size-4" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t border-border/50">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-medium"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20"
              onClick={handleConfirm}
              disabled={isSubmitting || !selectedId || loading}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-4" />
                  Confirm Submission
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
