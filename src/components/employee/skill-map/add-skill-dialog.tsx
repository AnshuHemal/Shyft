"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SearchIcon, PlusIcon, CheckIcon } from "lucide-react";
import { getCategoryColor } from "./skill-card";
import type { ProficiencyLevel } from "./skill-column";
import { COLUMN_CONFIG } from "./skill-column";

interface LibrarySkill {
  id: string;
  name: string;
  category: string;
  color: string | null;
  description: string | null;
}

interface AddSkillDialogProps {
  open: boolean;
  targetLevel: ProficiencyLevel | null;
  employeeId: string;
  existingSkillIds: string[];
  onClose: () => void;
  onAdded: (employeeSkill: any) => void;
}

const CATEGORIES = ["All", "Frontend", "Backend", "Database", "Mobile", "DevOps", "Tools", "Design", "Testing", "Other"];

export function AddSkillDialog({
  open,
  targetLevel,
  employeeId,
  existingSkillIds,
  onClose,
  onAdded,
}: AddSkillDialogProps) {
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [skills, setSkills] = React.useState<LibrarySkill[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState<string | null>(null);

  // Fetch skill library
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setSkills(d.skills ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = skills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  async function handleAdd(skill: LibrarySkill) {
    if (!targetLevel) return;
    setAdding(skill.id);
    try {
      const res = await fetch(`/api/employees/${employeeId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, proficiency: targetLevel }),
      });
      const json = await res.json();
      if (res.ok) {
        onAdded(json.employeeSkill);
      }
    } finally {
      setAdding(null);
    }
  }

  function handleClose() {
    setSearch("");
    setActiveCategory("All");
    onClose();
  }

  const config = targetLevel ? COLUMN_CONFIG[targetLevel] : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <DialogTitle className="text-lg font-bold">Add Skill</DialogTitle>
              {config && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black border",
                    config.countClass,
                    config.accentClass
                  )}
                >
                  → {config.label}
                </span>
              )}
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Pick from your organisation's skill library.
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            <Input
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border/60 bg-muted/30 focus:bg-background"
              autoFocus
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skill list */}
        <div className="overflow-y-auto max-h-[340px] p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-5" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm font-semibold">No skills found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((skill) => {
                const alreadyAdded = existingSkillIds.includes(skill.id);
                const isAdding = adding === skill.id;

                return (
                  <button
                    key={skill.id}
                    disabled={alreadyAdded || isAdding}
                    onClick={() => handleAdd(skill)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                      alreadyAdded
                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                        : "hover:bg-muted/50 active:scale-[0.99]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{skill.name}</p>
                      {skill.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {skill.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        getCategoryColor(skill.category)
                      )}
                    >
                      {skill.category}
                    </span>
                    <div className="shrink-0 size-6 flex items-center justify-center">
                      {isAdding ? (
                        <Spinner className="size-3.5" />
                      ) : alreadyAdded ? (
                        <CheckIcon className="size-3.5 text-emerald-500" />
                      ) : (
                        <PlusIcon className="size-3.5 text-muted-foreground/50" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClose} className="rounded-xl">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
