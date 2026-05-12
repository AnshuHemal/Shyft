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
}

export function SkillColumn({ level, cards, onRemove, onAddClick }: SkillColumnProps) {
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
          "flex-1 rounded-b-2xl border border-t-0 p-3 transition-all duration-200",
          isOver
            ? cn("border-2", config.dropClass, config.accentClass)
            : "border-border/60 bg-muted/20"
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <SkillCard key={card.id} card={card} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {cards.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed mt-1 transition-all duration-200",
              isOver ? cn(config.accentClass, "scale-[1.02]") : "border-border/40"
            )}
          >
            <span className="text-3xl mb-2 select-none">{config.emptyIcon}</span>
            <p className="text-xs font-semibold text-muted-foreground/60">
              Drop skills here
            </p>
          </div>
        )}

        {/* Add skill button */}
        <button
          onClick={() => onAddClick(level)}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5",
            "text-xs font-semibold text-muted-foreground/60 hover:text-muted-foreground",
            "hover:border-border hover:bg-muted/40 transition-all duration-200 group"
          )}
        >
          <PlusIcon className="size-3.5 group-hover:scale-110 transition-transform" />
          Add skill
        </button>
      </div>
    </div>
  );
}
