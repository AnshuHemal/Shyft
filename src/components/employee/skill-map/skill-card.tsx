"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { GripVerticalIcon, XIcon } from "lucide-react";

export interface SkillCardData {
  id: string;          // employeeSkill id (used as dnd id)
  skillId: string;
  name: string;
  category: string;
  color: string | null;
  description: string | null;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "PROFICIENT";
}

const CATEGORY_COLORS: Record<string, string> = {
  Frontend:   "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Backend:    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Database:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Mobile:     "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  DevOps:     "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Tools:      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  Design:     "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  Testing:    "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Other:      "bg-muted text-muted-foreground border-border",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

interface SkillCardProps {
  card: SkillCardData;
  onRemove: (skillId: string) => void;
  isDragging?: boolean;
  overlay?: boolean;
}

export function SkillCard({ card, onRemove, overlay = false }: SkillCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 shadow-xs",
        "transition-all duration-200 select-none",
        overlay
          ? "shadow-2xl border-primary/30 bg-card scale-105 rotate-1 cursor-grabbing"
          : "hover:border-border hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVerticalIcon className="size-3.5" />
      </button>

      {/* Skill name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{card.name}</p>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-bold mt-0.5",
            getCategoryColor(card.category)
          )}
        >
          {card.category}
        </span>
      </div>

      {/* Remove button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(card.skillId);
              }}
              className={cn(
                "shrink-0 flex size-5 items-center justify-center rounded-full",
                "text-muted-foreground/0 group-hover:text-muted-foreground/60",
                "hover:text-destructive! hover:bg-destructive/10 transition-all duration-150"
              )}
              aria-label={`Remove ${card.name}`}
            />
          }
        >
          <XIcon className="size-3" />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Remove from skill map</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ── Overlay card (shown while dragging) ──────────────────────────────────────

export function SkillCardOverlay({ card }: { card: SkillCardData }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-primary/30 bg-card px-3 py-2.5",
        "shadow-2xl scale-105 rotate-1 cursor-grabbing"
      )}
    >
      <GripVerticalIcon className="size-3.5 text-muted-foreground/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{card.name}</p>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-bold mt-0.5",
            getCategoryColor(card.category)
          )}
        >
          {card.category}
        </span>
      </div>
    </div>
  );
}
