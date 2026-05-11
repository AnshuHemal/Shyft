"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UsersIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

interface AdminOverviewProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    createdAt: Date;
  }[];
}

const STATUS_CONFIG = {
  PENDING_REVIEW: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: ClockIcon,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2Icon,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircleIcon,
  },
};

export function AdminOverview({ stats, recentUsers }: AdminOverviewProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const STAT_CARDS = [
    {
      label: "Total users",
      value: stats.total,
      icon: UsersIcon,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Pending review",
      value: stats.pending,
      icon: ClockIcon,
      color: "text-yellow-500 bg-yellow-500/10",
      urgent: stats.pending > 0,
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2Icon,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircleIcon,
      color: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back. Here's what's happening with your users.
        </p>
      </div>

      {/* Stats */}
      <div
        className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 delay-100",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {STAT_CARDS.map((stat) => (
          <Card
            key={stat.label}
            size="sm"
            className={cn(stat.urgent && "ring-2 ring-yellow-500/30")}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className={cn("flex size-9 items-center justify-center rounded-lg", stat.color)}>
                  <stat.icon className="size-4" />
                </div>
                {stat.urgent && (
                  <span className="flex size-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card
        className={cn(
          "transition-all duration-500 delay-200",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent registrations</CardTitle>
              <CardDescription>Latest users who signed up</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/users" />}
              className="gap-1.5"
            >
              View all
              <ArrowRightIcon className="size-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 divide-y divide-border/60">
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users yet.
            </p>
          ) : (
            recentUsers.map((user) => {
              const config =
                STATUS_CONFIG[user.accountStatus as keyof typeof STATUS_CONFIG] ??
                STATUS_CONFIG.PENDING_REVIEW;
              const Icon = config.icon;
              return (
                <div key={user.id} className="flex items-center gap-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        config.className
                      )}
                    >
                      <Icon className="size-3" />
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
