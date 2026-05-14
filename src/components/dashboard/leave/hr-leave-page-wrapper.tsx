"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarOffIcon, CalendarCheckIcon } from "lucide-react";
import { HRLeaveManagement } from "./hr-leave-management";
import { HRCompOffManagement } from "./hr-comp-off-management";

type Tab = "leave" | "comp-off";

export function HRLeavePageWrapper() {
  const [activeTab, setActiveTab] = React.useState<Tab>("leave");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Page header + tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave & Comp-Off</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage employee leave and compensation requests.</p>
        </div>

        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/40 w-fit shrink-0">
          {([
            { id: "leave" as Tab,    label: "Leave Requests", icon: CalendarOffIcon },
            { id: "comp-off" as Tab, label: "Comp-Off",       icon: CalendarCheckIcon },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                activeTab === id
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "leave" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Strip its own h1 since we rendered one above */}
          <HRLeaveManagement hideHeader />
        </div>
      )}
      {activeTab === "comp-off" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <HRCompOffManagement />
        </div>
      )}
    </div>
  );
}
