"use client";

import * as React from "react";
import type { User } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ClockIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  UsersIcon,
  PlayIcon,
  ArrowUpRightIcon,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock data ────────────────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { day: "Mon", hours: 7.5 },
  { day: "Tue", hours: 8.2 },
  { day: "Wed", hours: 6.8 },
  { day: "Thu", hours: 9.1 },
  { day: "Fri", hours: 7.0 },
  { day: "Sat", hours: 2.5 },
  { day: "Sun", hours: 0 },
];

const RECENT_ENTRIES = [
  {
    id: "1",
    project: "SHYFT Web App",
    task: "Dashboard UI implementation",
    duration: "3h 24m",
    time: "2h ago",
    color: "bg-primary",
  },
  {
    id: "2",
    project: "Client Portal",
    task: "API integration review",
    duration: "1h 45m",
    time: "5h ago",
    color: "bg-blue-500",
  },
  {
    id: "3",
    project: "Design System",
    task: "Component documentation",
    duration: "2h 10m",
    time: "Yesterday",
    color: "bg-purple-500",
  },
  {
    id: "4",
    project: "SHYFT Web App",
    task: "Auth flow testing",
    duration: "0h 55m",
    time: "Yesterday",
    color: "bg-primary",
  },
];

const TEAM_MEMBERS = [
  { name: "Alex Johnson", role: "Frontend Dev", hours: "38.5h", status: "active" },
  { name: "Sam Rivera", role: "Designer", hours: "32.0h", status: "active" },
  { name: "Jordan Lee", role: "Backend Dev", hours: "41.2h", status: "idle" },
  { name: "Casey Morgan", role: "PM", hours: "28.5h", status: "offline" },
];

const CHART_CONFIG = {
  hours: {
    label: "Hours",
    color: "var(--color-primary)",
  },
};

const STATS = [
  {
    label: "Hours this week",
    value: "41.1h",
    change: "+12%",
    trend: "up",
    icon: ClockIcon,
    color: "text-primary bg-primary/10",
  },
  {
    label: "Tasks completed",
    value: "24",
    change: "+8%",
    trend: "up",
    icon: CheckCircle2Icon,
    color: "text-green-500 bg-green-500/10",
  },
  {
    label: "Active projects",
    value: "6",
    change: "0%",
    trend: "neutral",
    icon: TrendingUpIcon,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    label: "Team members",
    value: "8",
    change: "+1",
    trend: "up",
    icon: UsersIcon,
    color: "text-purple-500 bg-purple-500/10",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const first = name.split(" ")[0];
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 17) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

interface DashboardOverviewProps {
  user: User;
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  function formatElapsed(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {getGreeting(user.name)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick timer */}
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-xs">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current session</p>
            <p className="font-mono text-lg font-semibold tabular-nums leading-none">
              {formatElapsed(elapsed)}
            </p>
          </div>
          <Button
            size="icon-sm"
            variant={timerRunning ? "destructive" : "default"}
            onClick={() => {
              if (timerRunning) setElapsed(0);
              setTimerRunning((v) => !v);
            }}
            className="size-9 rounded-full"
          >
            {timerRunning ? (
              <span className="size-3 rounded-sm bg-current" />
            ) : (
              <PlayIcon className="size-4 translate-x-px" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    stat.color
                  )}
                >
                  <stat.icon className="size-4" />
                </div>
                <Badge
                  variant={stat.trend === "up" ? "default" : "secondary"}
                  className={cn(
                    "text-sm",
                    stat.trend === "up" && "bg-green-500/10 text-green-600 dark:text-green-400 border-0"
                  )}
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Recent entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly hours chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly hours</CardTitle>
                <CardDescription>Your tracked time this week</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                This week
                <ArrowUpRightIcon className="size-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={CHART_CONFIG} className="h-48 w-full">
              <AreaChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#hoursGradient)"
                  dot={{ fill: "var(--color-primary)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Team activity */}
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle>Team activity</CardTitle>
            <CardDescription>This week's hours</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background",
                      member.status === "active" && "bg-green-500",
                      member.status === "idle" && "bg-yellow-500",
                      member.status === "offline" && "bg-muted-foreground/40"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {member.hours}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent time entries */}
      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent entries</CardTitle>
              <CardDescription>Your latest tracked time</CardDescription>
            </div>
            <Button variant="outline" size="sm" nativeButton={false} render={<a href="/dashboard/tracker" />}>
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 divide-y divide-border/60">
          {RECENT_ENTRIES.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 py-3.5 group"
            >
              <div
                className={cn("size-2 rounded-full shrink-0", entry.color)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.task}</p>
                <p className="text-sm text-muted-foreground">{entry.project}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium tabular-nums">{entry.duration}</p>
                <p className="text-sm text-muted-foreground">{entry.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
