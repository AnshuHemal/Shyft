import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayIcon, PauseIcon, ClockIcon } from "lucide-react";

export const metadata: Metadata = { title: "Time Tracker" };

export default function TrackerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracker"
        description="Log and manage your time entries."
      />

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Active timer</CardTitle>
          <CardDescription>Start tracking your current task</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="What are you working on?"
                className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                00:00:00
              </div>
              <Button size="icon" className="size-10 rounded-full">
                <PlayIcon className="size-4 translate-x-px" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Today's entries</CardTitle>
          <CardDescription>
            <Badge variant="secondary" className="gap-1">
              <ClockIcon className="size-3" />
              Total: 5h 24m
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 divide-y divide-border/60">
          {[
            { task: "Dashboard UI implementation", project: "SHYFT Web App", duration: "3h 24m", start: "09:00", end: "12:24" },
            { task: "API integration review", project: "Client Portal", duration: "1h 45m", start: "13:00", end: "14:45" },
            { task: "Team standup", project: "Internal", duration: "0h 15m", start: "08:45", end: "09:00" },
          ].map((entry, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.task}</p>
                <p className="text-sm text-muted-foreground">{entry.project}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium tabular-nums">{entry.duration}</p>
                <p className="text-sm text-muted-foreground">{entry.start} – {entry.end}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
