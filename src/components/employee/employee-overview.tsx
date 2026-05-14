"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectList } from "@/components/employee/project-list";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  AlertCircleIcon,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcNetMinutes(start: string, end: string, breakMins: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm) - breakMins;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-muted text-muted-foreground border-border" },
  SUBMITTED: { label: "Submitted", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  APPROVED: { label: "Lead Approved", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  REJECTED: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20" },
  HR_SUBMITTED: { label: "Pending HR", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  HR_APPROVED: { label: "HR Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

const DEFAULT_STATUS = { label: "Unknown", color: "bg-muted text-muted-foreground border-border" };

// ── Component ─────────────────────────────────────────────────────────────────

interface EmployeeOverviewProps {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    department: string | null;
    employeeId: string | null;
    joiningDate: Date | null;
    employmentType: string;
    status: string;
    position: string | null;
    organization: { name: string };
  };
  timesheet: {
    id: string;
    status: string;
    _count: { entries: number };
    entries: { startTime: string | null; endTime: string | null; breakMinutes: number | null }[];
  } | null;
  currentMonth: number;
  currentYear: number;
  onboardingCompleted?: boolean;
}

export function EmployeeOverview({
  employee,
  timesheet,
  currentMonth,
  currentYear,
  onboardingCompleted = true,
}: EmployeeOverviewProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const totalMinutes = timesheet?.entries.reduce((acc, e) => {
    if (e.startTime && e.endTime) {
      return acc + calcNetMinutes(e.startTime, e.endTime, e.breakMinutes ?? 0);
    }
    return acc;
  }, 0) ?? 0;

  const daysLogged = timesheet?.entries.filter((e) => e.startTime && e.endTime).length ?? 0;
  const timesheetStatus = (timesheet?.status ?? "DRAFT") as keyof typeof STATUS_CONFIG;
  const statusCfg = STATUS_CONFIG[timesheetStatus] || DEFAULT_STATUS;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const isSenior = React.useMemo(() => {
    const p = employee.position?.toLowerCase() || "";
    return (
      p.includes("senior") ||
      p.includes("lead") ||
      p.includes("manager") ||
      p.includes("head") ||
      p.includes("architect") ||
      p.includes("vp") ||
      p.includes("director")
    );
  }, [employee.position]);

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Header */}
      <div>
        <p className="text-sm text-primary font-medium mb-0.5">
          {greeting()}, {employee.firstName} 👋
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">My Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Onboarding Reminder */}
      {!onboardingCompleted && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircleIcon className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Action Required: Complete Onboarding</p>
              <p className="text-xs text-amber-800/70 dark:text-amber-400/70 mt-0.5">Please submit your KYC documents within 5 days of joining to unlock all features.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 gap-1.5 shrink-0"
            nativeButton={false}
            render={<Link href="/employee/onboarding" />}
          >
            Start Now <ArrowRightIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Days logged",
            value: String(daysLogged),
            icon: CalendarDaysIcon,
            color: "text-primary bg-primary/10",
          },
          {
            label: "Hours this month",
            value: totalMinutes > 0 ? formatHours(totalMinutes) : "—",
            icon: ClockIcon,
            color: "text-blue-500 bg-blue-500/10",
          },
          {
            label: "Timesheet status",
            value: statusCfg.label,
            icon: CheckCircle2Icon,
            color: "text-green-500 bg-green-500/10",
          },
          {
            label: "Department",
            value: employee.department ?? "—",
            icon: BuildingIcon,
            color: "text-purple-500 bg-purple-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={stat.label}
            size="sm"
            className={cn(
              "transition-all duration-500",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <CardContent className="pt-4">
              <div className={cn("flex size-9 items-center justify-center rounded-lg mb-3", stat.color)}>
                <stat.icon className="size-4" />
              </div>
              <p className="text-xl font-semibold tabular-nums truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current month timesheet card */}
      <Card
        className={cn(
          "transition-all duration-500 delay-300",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {MONTH_NAMES[currentMonth - 1]} {currentYear} Timesheet
              </CardTitle>
              <CardDescription>
                {timesheet
                  ? `${daysLogged} days logged · ${formatHours(totalMinutes)} total`
                  : "No entries yet for this month"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusCfg.color
                )}
              >
                {statusCfg.label}
              </span>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/employee/timesheet" />}
                className="gap-1.5"
              >
                {timesheet ? "View timesheet" : "Start filling"}
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Profile summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Employee ID", value: employee.employeeId ?? "—" },
              { label: "Designation", value: employee.designation },
              { label: "Employment", value: employee.employmentType.replace("_", " ") },
              {
                label: "Joined",
                value: employee.joiningDate
                  ? new Date(employee.joiningDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium mt-0.5 capitalize">{item.value.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <div className={cn(
        "transition-all duration-500 delay-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <ProjectList isSenior={isSenior} />
      </div>
    </div>
  );
}
