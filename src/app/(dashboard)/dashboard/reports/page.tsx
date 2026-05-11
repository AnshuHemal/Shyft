import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analyze your team's time and productivity."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total hours this month", value: "164.5h", sub: "vs 148h last month" },
          { label: "Billable hours", value: "132h", sub: "80% billable rate" },
          { label: "Avg. daily hours", value: "7.5h", sub: "Per team member" },
        ].map((s) => (
          <Card key={s.label} size="sm">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Monthly breakdown</CardTitle>
          <CardDescription>Hours by project for the current month</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[
              { project: "Shyft Web App", hours: 68, total: 164, color: "bg-primary" },
              { project: "Client Portal", hours: 45, total: 164, color: "bg-blue-500" },
              { project: "Design System", hours: 28, total: 164, color: "bg-purple-500" },
              { project: "Internal", hours: 23, total: 164, color: "bg-muted-foreground" },
            ].map((item) => (
              <div key={item.project} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.project}</span>
                  <span className="text-muted-foreground tabular-nums">{item.hours}h</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.hours / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
