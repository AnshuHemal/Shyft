"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  SearchIcon,
  MailIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

interface UserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  accountStatus: string;
  reviewNotes: string | null;
  reviewedAt: Date | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING_REVIEW: {
    label: "Pending",
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: ClockIcon,
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2Icon,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircleIcon,
  },
};

// ── Review dialog ─────────────────────────────────────────────────────────────

interface ReviewDialogProps {
  user: UserRow | null;
  action: "APPROVED" | "REJECTED" | null;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  loading: boolean;
}

function ReviewDialog({
  user,
  action,
  onClose,
  onConfirm,
  loading,
}: ReviewDialogProps) {
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (user) setNotes(user.reviewNotes ?? "");
  }, [user]);

  if (!user || !action) return null;

  const isApprove = action === "APPROVED";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve account" : "Reject account"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `Approve ${user.name}'s account? They'll receive an email and gain access to SHYFT.`
              : `Reject ${user.name}'s account? They'll be notified via email.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="review-notes">
              Message to user{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </FieldLabel>
            <textarea
              id="review-notes"
              rows={3}
              placeholder={
                isApprove
                  ? "Welcome to SHYFT! Your account is now active."
                  : "We're unable to approve your account at this time."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring disabled:opacity-50 resize-none"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "default" : "destructive"}
            onClick={() => onConfirm(notes)}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : isApprove ? (
              <UserCheckIcon className="size-4" />
            ) : (
              <UserXIcon className="size-4" />
            )}
            {isApprove ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UserReviewTableProps {
  initialUsers: UserRow[];
}

export function UserReviewTable({ initialUsers }: UserReviewTableProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<string>("PENDING_REVIEW");
  const [mounted, setMounted] = React.useState(false);

  // Review dialog state
  const [reviewUser, setReviewUser] = React.useState<UserRow | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVED" | "REJECTED" | null>(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Filtered users
  const filtered = users.filter((u) => {
    const matchesTab = u.accountStatus === activeTab;
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    PENDING_REVIEW: users.filter((u) => u.accountStatus === "PENDING_REVIEW").length,
    APPROVED: users.filter((u) => u.accountStatus === "APPROVED").length,
    REJECTED: users.filter((u) => u.accountStatus === "REJECTED").length,
  };

  function openReview(user: UserRow, action: "APPROVED" | "REJECTED") {
    setReviewUser(user);
    setReviewAction(action);
  }

  async function handleReviewConfirm(notes: string) {
    if (!reviewUser || !reviewAction) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${reviewUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: reviewAction, reviewNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to update user");

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === reviewUser.id
            ? {
                ...u,
                accountStatus: reviewAction,
                reviewNotes: notes || null,
                reviewedAt: new Date(),
              }
            : u
        )
      );

      toast.success(
        reviewAction === "APPROVED"
          ? `${reviewUser.name} approved — email sent.`
          : `${reviewUser.name} rejected — email sent.`
      );
      setReviewUser(null);
      setReviewAction(null);
    } catch {
      toast.error("Failed to update account status. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "space-y-6 transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">User Reviews</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and manage user account access.
            </p>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {(["PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((status) => {
              const config = STATUS_CONFIG[status];
              return (
                <TabsTrigger key={status} value={status} className="gap-1.5">
                  <config.icon className="size-3.5" />
                  {config.label}
                  {counts[status] > 0 && (
                    <span
                      className={cn(
                        "ml-1 inline-flex size-5 items-center justify-center rounded-full text-xs font-medium",
                        status === "PENDING_REVIEW"
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {counts[status]}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(["PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((status) => (
            <TabsContent key={status} value={status} className="mt-4">
              <Card>
                <CardContent className="pt-0 divide-y divide-border/60">
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        {search ? "No users match your search." : `No ${STATUS_CONFIG[status].label.toLowerCase()} users.`}
                      </p>
                    </div>
                  ) : (
                    filtered.map((user) => {
                      const config = STATUS_CONFIG[user.accountStatus as AccountStatus];
                      const Icon = config.icon;
                      return (
                        <div
                          key={user.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 py-4"
                        >
                          {/* User info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar>
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MailIcon className="size-3 shrink-0" />
                                {user.email}
                              </p>
                              {user.reviewNotes && (
                                <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                  Note: {user.reviewNotes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                              {user.reviewedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Reviewed {new Date(user.reviewedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                config.className
                              )}
                            >
                              <Icon className="size-3" />
                              {config.label}
                            </span>

                            {/* Actions */}
                            {status === "PENDING_REVIEW" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => openReview(user, "APPROVED")}
                                >
                                  <UserCheckIcon className="size-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1.5"
                                  onClick={() => openReview(user, "REJECTED")}
                                >
                                  <UserXIcon className="size-3.5" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {status !== "PENDING_REVIEW" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() =>
                                  openReview(
                                    user,
                                    status === "APPROVED" ? "REJECTED" : "APPROVED"
                                  )
                                }
                              >
                                Change
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Review dialog */}
      <ReviewDialog
        user={reviewUser}
        action={reviewAction}
        onClose={() => {
          setReviewUser(null);
          setReviewAction(null);
        }}
        onConfirm={handleReviewConfirm}
        loading={reviewLoading}
      />
    </>
  );
}
