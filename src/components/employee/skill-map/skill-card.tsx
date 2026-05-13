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
  isReadOnly?: boolean;
}

export function SkillCard({ card, onRemove, overlay = false, isReadOnly = false }: SkillCardProps) {
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
      {...(!isReadOnly ? attributes : {})}
      {...(!isReadOnly ? listeners : {})}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-xs",
        "transition-all duration-300 select-none",
        overlay
          ? "shadow-2xl border-primary/40 bg-card scale-105 rotate-2 cursor-grabbing ring-4 ring-primary/5"
          : isReadOnly
            ? "hover:border-primary/10 cursor-default"
            : "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-20 grayscale-50"
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 group-hover:bg-primary/40 transition-all rounded-l-xl" />
      {/* Visual handle hint */}
      <div className="shrink-0 text-muted-foreground/20 group-hover:text-primary/60 transition-colors">
        <GripVerticalIcon className="size-4" />
      </div>

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
      {!isReadOnly && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(card.skillId);
                }}
                className={cn(
                  "shrink-0 flex size-6 items-center justify-center rounded-lg",
                  "text-muted-foreground/0 group-hover:text-muted-foreground/40",
                  "hover:text-destructive! hover:bg-destructive/10 transition-all duration-200"
                )}
                aria-label={`Remove ${card.name}`}
              />
            }
          >
            <XIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-destructive text-destructive-foreground border-none">
            <p className="text-[10px] font-bold uppercase tracking-widest">Remove Skill</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── Overlay card (shown while dragging) ──────────────────────────────────────

export function SkillCardOverlay({ card }: { card: SkillCardData }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-primary/40 bg-card px-3.5 py-3 shadow-2xl",
        "scale-105 rotate-2 cursor-grabbing ring-4 ring-primary/5 w-[var(--card-width)]"
      )}
      style={{
        // @ts-ignore
        "--card-width": "inherit"
      }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/40 rounded-l-xl" />
      <GripVerticalIcon className="size-4 text-primary/60 shrink-0" />
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
