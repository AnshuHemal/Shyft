"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { SkillCard, type SkillCardData } from "./skill-card";
import { PlusIcon } from "lucide-react";

export type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "PROFICIENT";

interface ColumnConfig {
  id: ProficiencyLevel;
  label: string;
  sublabel: string;
  range: string;
  accentClass: string;
  headerClass: string;
  dropClass: string;
  emptyIcon: string;
  countClass: string;
}

export const COLUMN_CONFIG: Record<ProficiencyLevel, ColumnConfig> = {
  BEGINNER: {
    id: "BEGINNER",
    label: "Beginner",
    sublabel: "Still learning",
    range: "< 30%",
    accentClass: "border-rose-500/30",
    headerClass: "bg-rose-500/8 border-rose-500/20",
    dropClass: "bg-rose-500/5 border-rose-500/20",
    emptyIcon: "🌱",
    countClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  INTERMEDIATE: {
    id: "INTERMEDIATE",
    label: "Intermediate",
    sublabel: "Working knowledge",
    range: "30% – 70%",
    accentClass: "border-amber-500/30",
    headerClass: "bg-amber-500/8 border-amber-500/20",
    dropClass: "bg-amber-500/5 border-amber-500/20",
    emptyIcon: "⚡",
    countClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  PROFICIENT: {
    id: "PROFICIENT",
    label: "Proficient",
    sublabel: "Highly confident",
    range: "> 70%",
    accentClass: "border-emerald-500/30",
    headerClass: "bg-emerald-500/8 border-emerald-500/20",
    dropClass: "bg-emerald-500/5 border-emerald-500/20",
    emptyIcon: "🚀",
    countClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

interface SkillColumnProps {
  level: ProficiencyLevel;
  cards: SkillCardData[];
  onRemove: (skillId: string) => void;
  onAddClick: (level: ProficiencyLevel) => void;
  isOver?: boolean;
  isReadOnly?: boolean;
}

export function SkillColumn({ level, cards, onRemove, onAddClick, isReadOnly = false }: SkillColumnProps) {
  const config = COLUMN_CONFIG[level];
  const { setNodeRef, isOver } = useDroppable({ id: level });

  const cardIds = cards.map((c) => c.id);

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Column header */}
      <div
        className={cn(
          "rounded-t-2xl border border-b-0 px-4 py-3.5 flex items-center justify-between",
          config.headerClass
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight">{config.label}</h3>
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums min-w-[22px]",
                config.countClass
              )}
            >
              {cards.length}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            {config.sublabel} · {config.range}
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-b-2xl border border-t-0 p-3 transition-all duration-300",
          isOver
            ? cn("border-b-2", config.dropClass, config.accentClass, "ring-2 ring-primary/10 ring-inset")
            : "border-border/60 bg-muted/20"
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <SkillCard key={card.id} card={card} onRemove={onRemove} isReadOnly={isReadOnly} />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {cards.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed mt-1 transition-all duration-300",
              isOver ? cn(config.accentClass, "scale-[1.02] bg-background/50 shadow-inner") : "border-border/40 bg-background/20"
            )}
          >
            <span className="text-4xl mb-3 select-none opacity-80 group-hover:scale-110 transition-transform">{config.emptyIcon}</span>
            <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wider">
              Drop skills here
            </p>
          </div>
        )}

        {/* Add skill button */}
        {!isReadOnly && (
          <button
            onClick={() => onAddClick(level)}
            className={cn(
              "mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-3",
              "text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-primary",
              "hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
            )}
          >
            <PlusIcon className="size-3.5 group-hover:rotate-90 transition-transform duration-300" />
            Add skill
          </button>
        )}
      </div>
    </div>
  );
}
