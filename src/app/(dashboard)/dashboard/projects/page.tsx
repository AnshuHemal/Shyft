import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

const PROJECTS = [
  { name: "SHYFT Web App", client: "Internal", hours: "124h", budget: "200h", status: "active", color: "bg-primary" },
  { name: "Client Portal", client: "Acme Corp", hours: "87h", budget: "100h", status: "active", color: "bg-blue-500" },
  { name: "Design System", client: "Internal", hours: "45h", budget: "80h", status: "active", color: "bg-purple-500" },
  { name: "Mobile App v2", client: "TechStart", hours: "200h", budget: "200h", status: "completed", color: "bg-green-500" },
  { name: "API Refactor", client: "Internal", hours: "32h", budget: "60h", status: "paused", color: "bg-yellow-500" },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage and track all your projects."
        actions={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            New project
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROJECTS.map((project) => {
          const pct = Math.round((parseInt(project.hours) / parseInt(project.budget)) * 100);
          return (
            <Card key={project.name} size="sm" className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("flex size-9 items-center justify-center rounded-lg text-white", project.color)}>
                    <FolderIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>
                  <Badge
                    variant={project.status === "active" ? "default" : project.status === "completed" ? "secondary" : "outline"}
                    className="text-sm capitalize shrink-0"
                  >
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{project.hours} logged</span>
                    <span>{pct}% of {project.budget}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", project.color, pct >= 100 && "bg-destructive")}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
