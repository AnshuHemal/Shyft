"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  BrainCircuitIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  LayersIcon,
  UsersIcon,
  TagIcon,
  RefreshCwIcon,
} from "lucide-react";
import { getCategoryColor } from "@/components/employee/skill-map/skill-card";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  color: string | null;
}

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Mobile",
  "DevOps",
  "Tools",
  "Design",
  "Testing",
  "Other",
];

const CATEGORY_FILTER_OPTIONS = ["All", ...CATEGORIES];

// ── Add skill dialog ──────────────────────────────────────────────────────────

interface AddSkillDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (skill: Skill) => void;
}

function AddSkillDialog({ open, onClose, onCreated }: AddSkillDialogProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Frontend");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category, description: description.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create skill.");
        return;
      }
      onCreated(json.skill);
      toast.success(`"${json.skill.name}" added to the library.`);
      setName("");
      setDescription("");
      setCategory("Frontend");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl gap-0">
        <div className="bg-primary px-8 pt-8 pb-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            <BrainCircuitIcon className="size-24" />
          </div>
          <DialogHeader className="relative">
            <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-xl">
              <PlusIcon className="size-6" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
              Add New Skill
            </DialogTitle>
            <DialogDescription className="text-white/75 font-medium">
              Add a skill to your organisation's library.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 bg-card space-y-5">
          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Skill Name *
            </FieldLabel>
            <Input
              placeholder="e.g. React, PostgreSQL, Docker…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoFocus
              required
            />
          </Field>

          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Category *
            </FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150",
                    category === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent hover:border-border"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Description (optional)
            </FieldLabel>
            <Input
              placeholder="Brief description of this skill…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
          </Field>

          <DialogFooter className="flex gap-3 sm:justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="font-bold h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-11 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
            >
              {loading ? <Spinner className="size-4" /> : <PlusIcon className="size-4" />}
              Add Skill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SkillLibraryManagerProps {
  orgId: string;
}

export function SkillLibraryManager({ orgId: _orgId }: SkillLibraryManagerProps) {
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Skill | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchSkills() {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      const json = await res.json();
      setSkills(json.skills ?? []);
    } catch {
      toast.error("Failed to load skill library.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchSkills(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/skills/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete skill.");
        return;
      }
      setSkills((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" removed from the library.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = skills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  // Group by category for display
  const grouped = filtered.reduce<Record<string, Skill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categoryCount = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = skills.filter((s) => s.category === cat).length;
    return acc;
  }, {});

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Skill Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the skills available for your team's skill maps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSkills}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 shadow-xs disabled:opacity-50"
          >
            <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 rounded-xl shadow-lg shadow-primary/20"
          >
            <PlusIcon className="size-4" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total skills", value: skills.length, icon: LayersIcon, color: "text-primary bg-primary/10" },
          { label: "Categories", value: CATEGORIES.filter((c) => categoryCount[c] > 0).length, icon: TagIcon, color: "text-blue-500 bg-blue-500/10" },
          { label: "Most skills in", value: Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—", icon: UsersIcon, color: "text-purple-500 bg-purple-500/10" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={cn("rounded-2xl border border-border/60 bg-card p-4 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className={cn("flex size-9 items-center justify-center rounded-lg mb-3", s.color)}>
              <s.icon className="size-4" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            placeholder="Search skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-border/60"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORY_FILTER_OPTIONS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 border",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {cat}
              {cat !== "All" && categoryCount[cat] > 0 && (
                <span className="ml-1.5 opacity-60">{categoryCount[cat]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Skill grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Loading skill library…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
            <BrainCircuitIcon className="size-8 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No skills found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {skills.length === 0
                ? "Add your first skill to get started."
                : "Try a different search or category."}
            </p>
          </div>
          {skills.length === 0 && (
            <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2 rounded-xl mt-2">
              <PlusIcon className="size-4" />
              Add first skill
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, catSkills]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
                      getCategoryColor(category)
                    )}
                  >
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {catSkills.length} {catSkills.length === 1 ? "skill" : "skills"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {catSkills.map((skill, idx) => (
                    <div
                      key={skill.id}
                      className={cn(
                        "group flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5",
                        "hover:border-border hover:shadow-sm transition-all duration-200",
                        "animate-in fade-in slide-in-from-bottom-2 duration-300"
                      )}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{skill.name}</p>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {skill.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteTarget(skill)}
                        className={cn(
                          "shrink-0 flex size-7 items-center justify-center rounded-lg",
                          "text-muted-foreground/0 group-hover:text-muted-foreground/50",
                          "hover:text-destructive! hover:bg-destructive/10 transition-all duration-150"
                        )}
                        aria-label={`Delete ${skill.name}`}
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add dialog */}
      <AddSkillDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(skill) => setSkills((prev) => [...prev, skill])}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the skill from the library and from all employees' skill maps. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-destructive hover:bg-destructive/90 gap-2"
            >
              {deleting ? <Spinner className="size-4" /> : <Trash2Icon className="size-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
