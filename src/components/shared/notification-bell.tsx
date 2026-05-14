"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  InboxIcon,
} from "lucide-react";

type NotificationType = 
  | "LEAVE_SUBMITTED" | "LEAVE_APPROVED" | "LEAVE_REJECTED"
  | "COMP_OFF_SUBMITTED" | "COMP_OFF_ACKNOWLEDGED" | "COMP_OFF_REJECTED"
  | "REIMBURSEMENT_SUBMITTED" | "REIMBURSEMENT_APPROVED" | "REIMBURSEMENT_REJECTED" | "REIMBURSEMENT_PAID"
  | "ASSET_REQUEST_SUBMITTED" | "ASSET_REQUEST_APPROVED" | "ASSET_REQUEST_REJECTED";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  leaveId: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  LEAVE_SUBMITTED: {
    icon: CalendarDaysIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  LEAVE_APPROVED: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  LEAVE_REJECTED: {
    icon: XCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  COMP_OFF_SUBMITTED: {
    icon: CalendarDaysIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  COMP_OFF_ACKNOWLEDGED: {
    icon: CheckCircle2Icon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  COMP_OFF_REJECTED: {
    icon: XCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  REIMBURSEMENT_SUBMITTED: {
    icon: CalendarDaysIcon, // Using CalendarDays or Banknote, let's use default
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  REIMBURSEMENT_APPROVED: {
    icon: CheckCircle2Icon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  REIMBURSEMENT_REJECTED: {
    icon: XCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  REIMBURSEMENT_PAID: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  ASSET_REQUEST_SUBMITTED: {
    icon: CalendarDaysIcon, // Or a better icon if imported
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  ASSET_REQUEST_APPROVED: {
    icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  ASSET_REQUEST_REJECTED: {
    icon: XCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch {
      // silent fail for background polling
    }
  }

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  // Initial fetch + polling every 60s
  React.useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const todayNotifications = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime();
    return diff < 86_400_000; // 24h
  });
  const earlierNotifications = notifications.filter((n) => {
    const diff = Date.now() - new Date(n.createdAt).getTime();
    return diff >= 86_400_000;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className={cn(
          "relative flex size-8 items-center justify-center rounded-md transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          open && "bg-muted/70 text-foreground"
        )}
        aria-label="Notifications"
      >
        <BellIcon className={cn("size-4 transition-transform duration-300", open && "scale-90")} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground animate-in zoom-in-50 duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[360px] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-primary" />
                <span className="text-sm font-bold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-px rounded-full bg-primary/10 text-primary text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <CheckCheckIcon className="size-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[420px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
                    <InboxIcon className="size-6 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">No notifications yet.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {todayNotifications.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        Today
                      </p>
                      {todayNotifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onRead={markOneRead}
                        />
                      ))}
                    </div>
                  )}
                  {earlierNotifications.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        Earlier
                      </p>
                      {earlierNotifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onRead={markOneRead}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.LEAVE_SUBMITTED;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => !n.isRead && onRead(n.id)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200 group border-b border-border/30 last:border-0",
        n.isRead
          ? "hover:bg-muted/20 opacity-60"
          : "hover:bg-muted/40 bg-primary/[0.02]"
      )}
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl mt-0.5", cfg.bg)}>
        <Icon className={cn("size-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-xs font-bold truncate", n.isRead ? "text-muted-foreground" : "text-foreground")}>
            {n.title}
          </p>
          <span className="text-[10px] text-muted-foreground/60 shrink-0 font-mono">
            {formatRelativeTime(n.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {n.message}
        </p>
      </div>
      {!n.isRead && (
        <span className="size-2 rounded-full bg-primary shrink-0 mt-2 animate-pulse" />
      )}
    </button>
  );
}
