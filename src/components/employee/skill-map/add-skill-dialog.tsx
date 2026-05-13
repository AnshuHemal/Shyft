"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SearchIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  BookOpenIcon,
} from "lucide-react";
import { getCategoryColor } from "./skill-card";
import type { ProficiencyLevel } from "./skill-column";
import { COLUMN_CONFIG } from "./skill-column";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  onAdded: (employeeSkill: unknown) => void;
}

const CATEGORIES = [
  "All", "Frontend", "Backend", "Database",
  "Mobile", "DevOps", "Tools", "Design", "Testing", "Other",
];

// ── Category icon map ─────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  All:      "✦",
  Frontend: "🎨",
  Backend:  "⚙️",
  Database: "🗄️",
  Mobile:   "📱",
  DevOps:   "🚀",
  Tools:    "🔧",
  Design:   "✏️",
  Testing:  "🧪",
  Other:    "📦",
};

// ── Skill item ────────────────────────────────────────────────────────────────

interface SkillItemProps {
  skill: LibrarySkill;
  alreadyAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

function SkillItem({ skill, alreadyAdded, isAdding, onAdd }: SkillItemProps) {
  return (
    <button
      disabled={alreadyAdded || isAdding}
      onClick={onAdd}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200",
        alreadyAdded
          ? "opacity-50 cursor-not-allowed bg-muted/20"
          : "hover:bg-muted/50 hover:shadow-sm active:scale-[0.99] cursor-pointer"
      )}
    >
      {/* Category dot */}
      <div className={cn(
        "shrink-0 size-8 rounded-xl flex items-center justify-center text-sm border",
        getCategoryColor(skill.category)
      )}>
        {CATEGORY_EMOJI[skill.category] ?? "📦"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{skill.name}</p>
        {skill.description ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
            {skill.description}
          </p>
        ) : (
          <span className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-bold mt-0.5",
            getCategoryColor(skill.category)
          )}>
            {skill.category}
          </span>
        )}
      </div>

      {/* Action indicator */}
      <div className={cn(
        "shrink-0 size-7 rounded-xl flex items-center justify-center transition-all duration-200",
        alreadyAdded
          ? "bg-emerald-500/10"
          : "bg-muted/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20"
      )}>
        {isAdding ? (
          <Spinner className="size-3.5" />
        ) : alreadyAdded ? (
          <CheckIcon className="size-3.5 text-emerald-500" />
        ) : (
          <PlusIcon className="size-3.5 text-muted-foreground group-hover:text-primary-foreground" />
        )}
      </div>
    </button>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

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
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Fetch skill library when dialog opens
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setSkills(d.skills ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Auto-focus search after animation
    const t = setTimeout(() => searchRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = skills.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  // Group by category for display
  const grouped = React.useMemo(() => {
    if (activeCategory !== "All") return { [activeCategory]: filtered };
    return filtered.reduce<Record<string, LibrarySkill[]>>((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {});
  }, [filtered, activeCategory]);

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
      if (res.ok) onAdded(json.employeeSkill);
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
  const addedCount = existingSkillIds.length;
  const availableCount = skills.filter((s) => !existingSkillIds.includes(s.id)).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Override the default sm:max-w-md with a wider size
          "max-w-2xl! w-[calc(100vw-2rem)] sm:w-[640px]",
          "rounded-3xl p-0 overflow-hidden border border-border/60 shadow-2xl gap-0",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="relative overflow-hidden">
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="relative px-6 pt-6 pb-5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <SparklesIcon className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    Add Skill
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Pick from your organisation&apos;s skill library
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Target level badge */}
                {config && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black",
                    config.countClass,
                    config.accentClass
                  )}>
                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                    Adding to {config.label}
                  </span>
                )}
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Search input */}
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search skills by name or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-muted/30",
                  "text-sm placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background",
                  "transition-all duration-200"
                )}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="flex flex-nowrap gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5 -mx-6 px-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="text-[10px]">{CATEGORY_EMOJI[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Skill list ── */}
        <div className="overflow-y-auto" style={{ maxHeight: "380px" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Spinner className="size-5" />
              <p className="text-sm font-medium">Loading skill library…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl">
                {search ? "🔍" : "📭"}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {search ? "No matching skills" : "No skills in this category"}
                </p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  {search ? "Try a different search term" : "Ask HR to add skills to the library"}
                </p>
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="px-3 py-2">
              {Object.entries(grouped).map(([category, categorySkills]) => (
                <div key={category}>
                  {/* Category header — only shown in "All" view */}
                  {activeCategory === "All" && (
                    <div className="flex items-center gap-2 px-2 py-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {CATEGORY_EMOJI[category]} {category}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[10px] font-bold text-muted-foreground/40">
                        {categorySkills.length}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {categorySkills.map((skill) => (
                      <SkillItem
                        key={skill.id}
                        skill={skill}
                        alreadyAdded={existingSkillIds.includes(skill.id)}
                        isAdding={adding === skill.id}
                        onAdd={() => handleAdd(skill)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpenIcon className="size-3.5" />
              <span><span className="font-bold text-foreground">{skills.length}</span> skills in library</span>
            </div>
            {addedCount > 0 && (
              <>
                <span className="text-border">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="size-3.5 text-emerald-500" />
                  <span><span className="font-bold text-foreground">{addedCount}</span> already added</span>
                </div>
              </>
            )}
            {availableCount > 0 && (
              <>
                <span className="text-border">·</span>
                <span><span className="font-bold text-foreground">{availableCount}</span> available</span>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="rounded-xl font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
