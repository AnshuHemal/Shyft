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
  ArrowRightIcon,
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
  const [draggedWidth, setDraggedWidth] = React.useState<number | null>(null);
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

  // ── DnD helpers ─────────────────────────────────────────────────────────────

  function findContainer(id: string) {
    if (id in columns) return id as ProficiencyLevel;
    return (Object.keys(columns) as ProficiencyLevel[]).find((key) =>
      columns[key].some((item) => item.id === id)
    );
  }

  function findCard(id: string) {
    for (const level of LEVELS) {
      const card = columns[level].find((c) => c.id === id);
      if (card) return card;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const card = findCard(String(active.id));
    setActiveCard(card);

    // Capture the initial width of the dragged element
    const rect = active.rect.current.initial;
    if (rect) {
      setDraggedWidth(rect.width);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex: number;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowLastItem =
          over &&
          overIndex === overItems.length - 1 &&
          event.activatorEvent.type === "pointerdown"; // basic check

        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter((item) => item.id !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          { ...activeItems[activeIndex], proficiency: overContainer },
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    const activeContainer = findContainer(activeId);
    const overContainer = overId ? findContainer(overId) : null;

    if (!activeContainer || !overContainer || !overId) {
      setActiveCard(null);
      return;
    }

    const activeIndex = columns[activeContainer].findIndex((item) => item.id === activeId);
    const overIndex = columns[overContainer].findIndex((item) => item.id === overId);

    // If container changed, call API
    if (activeContainer !== overContainer || activeIndex !== overIndex) {
      if (activeContainer === overContainer) {
        // Reorder in same column
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      } else {
        // Handle cross-column drop finalization
        const card = findCard(activeId);
        if (card) {
          try {
            const res = await fetch(
              `/api/employees/${employeeId}/skills/${card.skillId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proficiency: overContainer }),
              }
            );
            if (!res.ok) throw new Error();
            toast.success(`${card.name} moved to ${overContainer.toLowerCase()}.`);
          } catch {
            toast.error("Failed to update skill level.");
            fetchSkills(); // Revert
          }
        }
      }
    }

    setActiveCard(null);
    setDraggedWidth(null);
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

  // ── Sensors & Collision ──────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom modifier to center the card on the cursor
  const snapCenterToCursor = ({ transform, activeNodeRect }: any) => {
    if (!activeNodeRect) return transform;
    return {
      ...transform,
      x: transform.x + transform.x - (transform.x + activeNodeRect.width / 2),
      y: transform.y + transform.y - (transform.y + activeNodeRect.height / 2),
    };
  };

  const centerModifier = ({ transform, activeNodeRect }: any) => {
    if (!activeNodeRect) return transform;
    return {
      ...transform,
      x: transform.x - activeNodeRect.width / 2,
      y: transform.y - activeNodeRect.height / 2,
    };
  };

  // The actual fix for "to the right" is often just setting the transform origin or using snapCenter
  // But dnd-kit's DragOverlay usually handles the offset if we DON'T use custom modifiers unless needed.
  // The user's issue implies the offset isn't being calculated.

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BrainCircuitIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Skill Map</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize and manage your professional skill set.
            </p>
          </div>
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
      <div className="group flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 transition-all duration-300 hover:bg-primary/8">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ZapIcon className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Optimize your profile</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Drag skills across levels to reflect your growth. Maintaining an accurate skill map helps your organization allocate projects more effectively.
          </p>
        </div>
        <ArrowRightIcon className="size-4 text-primary/40 group-hover:translate-x-1 transition-transform hidden sm:block" />
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Assembling your skill map…</p>
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

          <DragOverlay
            zIndex={1000}
            modifiers={[centerModifier]}
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeCard ? (
              <div
                className="touch-none pointer-events-none"
                style={{ width: draggedWidth ? `${draggedWidth}px` : "auto" }}
              >
                <SkillCardOverlay card={activeCard} />
              </div>
            ) : null}
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
