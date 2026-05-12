"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  FolderIcon, 
  PlusIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircle2Icon,
  PlusCircleIcon,
  LayoutGridIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  client: string | null;
  status: string;
  color: string | null;
  budget: number | null;
  _count: { members: number };
}

interface ProjectListProps {
  isSenior: boolean;
}

export function ProjectList({ isSenior }: ProjectListProps) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [client, setClient] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const fetchProjects = React.useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, client, budget }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create project");
        return;
      }

      setProjects([data.project, ...projects]);
      setShowAddDialog(false);
      setName("");
      setDescription("");
      setClient("");
      setBudget("");
      toast.success("Project created successfully!");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <Spinner className="size-6" />
        <p className="text-sm font-medium">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold tracking-tight">Active Projects</h2>
          <p className="text-sm text-muted-foreground">
            Projects you're currently leading or working on.
          </p>
        </div>
        {isSenior && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2 shadow-sm shadow-primary/20">
            <PlusIcon className="size-4" />
            New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
          <div className="flex size-12 items-center justify-center rounded-full bg-background border shadow-sm">
            <FolderIcon className="size-6 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No projects found</p>
            <p className="text-xs">You haven't been assigned to any projects yet.</p>
          </div>
          {isSenior && (
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="mt-2">
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
              <CardContent className="p-0">
                <div className={cn("h-1.5 w-full", project.color || "bg-primary")} />
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base leading-none group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      {project.client && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <BriefcaseIcon className="size-3" />
                          {project.client}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px] h-5">
                      {project.status}
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <LayoutGridIcon className="size-3" />
                        <span>{(project._count?.members ?? 0)} members</span>
                      </div>
                      {project.budget && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="size-3" />
                          <span>{project.budget}h budget</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-xs" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircleIcon className="size-5 text-primary" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Set up a new workstream. Your manager will be notified of this new project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <Field>
              <FieldLabel htmlFor="name">Project Name <span className="text-destructive">*</span></FieldLabel>
              <Input 
                id="name" 
                placeholder="e.g. Q3 Marketing Sprint" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="client">Client / Internal</FieldLabel>
                <Input 
                  id="client" 
                  placeholder="e.g. Acme Corp" 
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="budget">Budget (Hours)</FieldLabel>
                <Input 
                  id="budget" 
                  type="number" 
                  placeholder="100" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea 
                id="description" 
                placeholder="What is this project about?" 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
              />
            </Field>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <LayoutGridIcon className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !name.trim()} className="gap-2">
                {isCreating ? <Spinner className="size-4" /> : <PlusIcon className="size-4" />}
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
