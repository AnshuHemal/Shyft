"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { SkillColumn, type ProficiencyLevel } from "./skill-column";
import { SkillCardOverlay, type SkillCardData } from "./skill-card";
import { AddSkillDialog } from "./add-skill-dialog";
import {
  BrainCircuitIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  LayersIcon,
  ZapIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ColumnMap = Record<ProficiencyLevel, SkillCardData[]>;

const LEVELS: ProficiencyLevel[] = ["BEGINNER", "INTERMEDIATE", "PROFICIENT"];

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ columns }: { columns: ColumnMap }) {
  const total = LEVELS.reduce((acc, l) => acc + columns[l].length, 0);
  const proficient = columns.PROFICIENT.length;
  const intermediate = columns.INTERMEDIATE.length;
  const beginner = columns.BEGINNER.length;

  const stats = [
    {
      label: "Total skills",
      value: total,
      icon: LayersIcon,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Proficient",
      value: proficient,
      icon: ZapIcon,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Intermediate",
      value: intermediate,
      icon: TrendingUpIcon,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Beginner",
      value: beginner,
      icon: BrainCircuitIcon,
      color: "text-rose-500 bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "rounded-2xl border border-border/60 bg-card p-4 transition-all duration-500"
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={cn("flex size-9 items-center justify-center rounded-lg mb-3", s.color)}>
            <s.icon className="size-4" />
          </div>
          <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

interface SkillMapBoardProps {
  employeeId: string;
}

export function SkillMapBoard({ employeeId }: SkillMapBoardProps) {
  const [columns, setColumns] = React.useState<ColumnMap>({
    BEGINNER: [],
    INTERMEDIATE: [],
    PROFICIENT: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [activeCard, setActiveCard] = React.useState<SkillCardData | null>(null);
  const [addDialog, setAddDialog] = React.useState<{
    open: boolean;
    level: ProficiencyLevel | null;
  }>({ open: false, level: null });

  // Mount animation
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Fetch skill map
  async function fetchSkills() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/skills`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const map: ColumnMap = { BEGINNER: [], INTERMEDIATE: [], PROFICIENT: [] };
      for (const es of json.employeeSkills ?? []) {
        const card: SkillCardData = {
          id: es.id,
          skillId: es.skillId,
          name: es.skill.name,
          category: es.skill.category,
          color: es.skill.color,
          description: es.skill.description,
          proficiency: es.proficiency,
        };
        map[es.proficiency as ProficiencyLevel].push(card);
      }
      setColumns(map);
    } catch {
      toast.error("Failed to load skill map.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchSkills();
  }, [employeeId]);

  // ── DnD sensors ──────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function findCardColumn(cardId: string): ProficiencyLevel | null {
    for (const level of LEVELS) {
      if (columns[level].some((c) => c.id === cardId)) return level;
    }
    return null;
  }

  function findCard(cardId: string): SkillCardData | null {
    for (const level of LEVELS) {
      const found = columns[level].find((c) => c.id === cardId);
      if (found) return found;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const card = findCard(String(event.active.id));
    setActiveCard(card);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findCardColumn(activeId);
    // over could be a column id or a card id
    const overCol = LEVELS.includes(overId as ProficiencyLevel)
      ? (overId as ProficiencyLevel)
      : findCardColumn(overId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeCards = [...prev[activeCol]];
      const overCards = [...prev[overCol]];
      const cardIdx = activeCards.findIndex((c) => c.id === activeId);
      const [movedCard] = activeCards.splice(cardIdx, 1);

      // Insert at the position of the over card, or at end if over is the column
      const overCardIdx = overCards.findIndex((c) => c.id === overId);
      if (overCardIdx >= 0) {
        overCards.splice(overCardIdx, 0, { ...movedCard, proficiency: overCol });
      } else {
        overCards.push({ ...movedCard, proficiency: overCol });
      }

      return { ...prev, [activeCol]: activeCards, [overCol]: overCards };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findCardColumn(activeId);
    const overCol = LEVELS.includes(overId as ProficiencyLevel)
      ? (overId as ProficiencyLevel)
      : findCardColumn(overId);

    if (!activeCol || !overCol) return;

    // Same column — reorder only (no API call needed)
    if (activeCol === overCol) {
      setColumns((prev) => {
        const items = [...prev[activeCol]];
        const oldIdx = items.findIndex((c) => c.id === activeId);
        const newIdx = items.findIndex((c) => c.id === overId);
        if (oldIdx === newIdx) return prev;
        return { ...prev, [activeCol]: arrayMove(items, oldIdx, newIdx) };
      });
      return;
    }

    // Cross-column drop — update proficiency in DB
    const card = findCard(activeId);
    if (!card) return;

    try {
      const res = await fetch(
        `/api/employees/${employeeId}/skills/${card.skillId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proficiency: overCol }),
        }
      );
      if (!res.ok) {
        toast.error("Failed to update skill level.");
        // Revert
        fetchSkills();
      } else {
        toast.success(`${card.name} moved to ${overCol.toLowerCase()}.`);
      }
    } catch {
      toast.error("Failed to update skill level.");
      fetchSkills();
    }
  }

  // ── Remove skill ─────────────────────────────────────────────────────────────

  async function handleRemove(skillId: string) {
    // Optimistic remove
    setColumns((prev) => {
      const next = { ...prev };
      for (const level of LEVELS) {
        next[level] = prev[level].filter((c) => c.skillId !== skillId);
      }
      return next;
    });

    try {
      const res = await fetch(
        `/api/employees/${employeeId}/skills/${skillId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Failed to remove skill.");
        fetchSkills();
      } else {
        toast.success("Skill removed from your map.");
      }
    } catch {
      toast.error("Failed to remove skill.");
      fetchSkills();
    }
  }

  // ── Add skill ─────────────────────────────────────────────────────────────────

  function handleAddClick(level: ProficiencyLevel) {
    setAddDialog({ open: true, level });
  }

  function handleSkillAdded(employeeSkill: any) {
    const card: SkillCardData = {
      id: employeeSkill.id,
      skillId: employeeSkill.skillId,
      name: employeeSkill.skill.name,
      category: employeeSkill.skill.category,
      color: employeeSkill.skill.color,
      description: employeeSkill.skill.description,
      proficiency: employeeSkill.proficiency,
    };
    setColumns((prev) => ({
      ...prev,
      [card.proficiency]: [...prev[card.proficiency], card],
    }));
    toast.success(`${card.name} added to your skill map.`);
  }

  const allSkillIds = LEVELS.flatMap((l) => columns[l].map((c) => c.skillId));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Skill Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag skills between columns to update your proficiency level.
          </p>
        </div>
        <button
          onClick={fetchSkills}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 bg-card",
            "text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50",
            "transition-all duration-200 shadow-xs disabled:opacity-50"
          )}
        >
          <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <StatsBar columns={columns} />

      {/* Hint banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-3.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BrainCircuitIcon className="size-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How it works:</span>{" "}
          Drag any skill card left or right to change your proficiency level. Click{" "}
          <span className="font-semibold text-foreground">+ Add skill</span> at the bottom of any column to add from your organisation's library.
        </p>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Loading your skill map…</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEVELS.map((level) => (
              <SkillColumn
                key={level}
                level={level}
                cards={columns[level]}
                onRemove={handleRemove}
                onAddClick={handleAddClick}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}>
            {activeCard ? <SkillCardOverlay card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add skill dialog */}
      <AddSkillDialog
        open={addDialog.open}
        targetLevel={addDialog.level}
        employeeId={employeeId}
        existingSkillIds={allSkillIds}
        onClose={() => setAddDialog({ open: false, level: null })}
        onAdded={handleSkillAdded}
      />
    </div>
  );
}
