"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_MAP: Record<string, string> = {
  employee: "Overview",
  timesheet: "Timesheet",
  profile: "Profile",
  approvals: "Team Approvals",
  dashboard: "Dashboard",
  employees: "Employees",
  timesheets: "Timesheets",
  settings: "Settings",
  create: "Add New",
  edit: "Edit",
  leave: "Leave",
  "team-leave": "Team Leave",
  "team-skills": "Team Skills",
  skills: "Skills",
};

export function NavBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show on root or if path is too short
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 overflow-hidden">
      <Link
        href={pathname.startsWith("/dashboard") ? "/dashboard" : "/employee"}
        className="hover:text-primary text-foreground transition-all flex items-center justify-center size-6 rounded-md shrink-0"
      >
        <HomeIcon className="size-4" />
      </Link>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join("/")}`;

        // Try to map segment, or capitalize it
        let label = ROUTE_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        // Special case: if segment is a UUID or MongoID (random looking), maybe just show "Details" or similar
        // For now, let's just capitalize.
        if (segment.length > 20) label = "Details";

        // Hide the root segment if there are more (e.g., hide "Employee" in "Employee > Timesheet")
        if ((segment === "employee" || segment === "dashboard") && segments.length > 1 && index === 0) {
          return null;
        }

        return (
          <React.Fragment key={href}>
            <ChevronRightIcon className="size-3.5 shrink-0 text-foreground" />
            {isLast ? (
              <span className="text-foreground font-bold truncate max-w-[150px] animate-in fade-in slide-in-from-left-1 duration-300">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground hover:underline decoration-primary/30 underline-offset-4 transition-colors truncate max-w-[120px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
