"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  PlusIcon,
  Trash2Icon,
  ClockIcon,
  LinkIcon,
  BriefcaseIcon,
  XIcon,
  PlusCircleIcon,
  CoffeeIcon,
  CalendarCheckIcon,
  MoonIcon,
  SunIcon,
  ActivityIcon,
  AlertCircleIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIME_OPTIONS,
  BREAK_OPTIONS,
  calcNetMinutes,
  formatHours,
  getEndTimeOptions,
  timeToMinutes,
  minutesToTime,
  formatTime12h
} from "@/lib/timesheet-utils";
import { Spinner } from "@/components/ui/spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskLink {
  url: string;
  label: string;
}

interface TaskLog {
  id?: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  subject: string;
  description: string;
  projectId: string;
  isLearning: boolean;
  links: TaskLink[];
}

interface Project {
  id: string;
  name: string;
  client: string | null;
  isLearning: boolean;
}

interface TaskLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any;
  onSave: (id: string, data: any) => Promise<void>;
}

type DayType = "WORKING" | "HALF_DAY" | "LEAVE";

// ── TaskLogModal Component ────────────────────────────────────────────────────

export function TaskLogModal({ isOpen, onClose, entry, onSave }: TaskLogModalProps) {
  const [tasks, setTasks] = React.useState<TaskLog[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Attendance state
  const [dayType, setDayType] = React.useState<DayType>("WORKING");
  const [breakMinutes, setBreakMinutes] = React.useState(0);

  // Initialize from entry
  React.useEffect(() => {
    if (isOpen && entry) {
      setDayType(entry.dayType === "HALF_DAY" || entry.dayType === "LEAVE" || entry.dayType === "WORKING" ? entry.dayType : "WORKING");
      setBreakMinutes(entry.breakMinutes || 0);

      if (entry.tasks && entry.tasks.length > 0) {
        setTasks(entry.tasks.map((t: any) => ({
          ...t,
          taskId: t.taskId || "",
          description: t.description || "",
          links: Array.isArray(t.links) ? t.links : []
        })));
      } else {
        setTasks([{
          taskId: "",
          startTime: "09:00",
          endTime: "10:00",
          subject: "",
          description: "",
          projectId: "",
          isLearning: false,
          links: []
        }]);
      }
      fetchProjects();
    }
  }, [isOpen, entry]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  }

  function addTask() {
    const lastTask = tasks[tasks.length - 1];
    let nextStartTime = "09:00";
    if (lastTask?.endTime && lastTask.endTime !== "24:00") {
      nextStartTime = lastTask.endTime;
    }
    const nextStartMins = timeToMinutes(nextStartTime);
    const nextEndMins = Math.min(1440, nextStartMins + 60);
    const nextEndTime = minutesToTime(nextEndMins);

    setTasks([...tasks, {
      taskId: "",
      startTime: nextStartTime,
      endTime: nextEndTime,
      subject: "",
      description: "",
      projectId: "",
      isLearning: false,
      links: []
    }]);
  }

  function removeTask(index: number) {
    if (tasks.length === 1) {
      setTasks([{
        taskId: "",
        startTime: "09:00",
        endTime: "10:00",
        subject: "",
        description: "",
        projectId: "",
        isLearning: false,
        links: []
      }]);
    } else {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  }

  function handleStartTimeChange(index: number, newStartTime: string) {
    const task = tasks[index];
    const prevStartMins = timeToMinutes(task.startTime);
    const prevEndMins = task.endTime ? timeToMinutes(task.endTime) : null;
    const newStartMins = timeToMinutes(newStartTime);

    let newEndTime = task.endTime;
    // If the task previously had a valid duration, preserve it
    if (prevEndMins && prevEndMins > prevStartMins) {
      const duration = prevEndMins - prevStartMins;
      const shiftedEndMins = Math.min(1440, newStartMins + duration);
      newEndTime = minutesToTime(shiftedEndMins);
    } else {
      // Default to 60 mins after start time
      const defaultEndMins = Math.min(1440, newStartMins + 60);
      newEndTime = minutesToTime(defaultEndMins);
    }

    // Safety check: ensure newEndTime is strictly greater than newStartMins
    if (timeToMinutes(newEndTime) <= newStartMins) {
      const minEndMins = Math.min(1440, newStartMins + 30);
      newEndTime = minutesToTime(minEndMins);
    }

    updateTask(index, { startTime: newStartTime, endTime: newEndTime });
  }

  function updateTask(index: number, data: Partial<TaskLog>) {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], ...data };
    setTasks(newTasks);
  }

  async function handleSave() {
    // Validation for working days
    if (dayType !== "LEAVE") {
      if (tasks.length === 0) {
        toast.error("Please add at least one task log");
        return;
      }

      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        if (!t.startTime || !t.endTime) {
          toast.error(`Task #${i + 1}: Please select both start and end time`);
          return;
        }

        const startMins = timeToMinutes(t.startTime);
        const endMins = timeToMinutes(t.endTime);
        if (endMins <= startMins) {
          toast.error(`Task #${i + 1}: End time must be after start time`);
          return;
        }

        if (!t.subject.trim()) {
          toast.error(`Task #${i + 1}: Please enter an activity subject`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await onSave(entry.id, {
        tasks: dayType === "LEAVE" ? [] : tasks,
        dayType,
        breakMinutes
      });
      onClose();
    } catch (err) {
      toast.error("Failed to save tasks");
    } finally {
      setSaving(false);
    }
  }

  const totalTaskMins = tasks.reduce((acc, t) => acc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
  const netMins = Math.max(0, totalTaskMins - breakMinutes);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto p-0 gap-0 shadow-2xl border-none">
        <DialogHeader className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">Work Log Details</DialogTitle>
              <DialogDescription className="text-sm font-medium">
                {entry && new Date(entry.date).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </DialogDescription>
            </div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <CalendarCheckIcon className="size-6" />
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-10">
          {/* Day Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Day Type Selector */}
            <div className="space-y-3">
              <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Work Status</FieldLabel>
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40 shadow-inner">
                {[
                  { id: "WORKING", label: "Full Day", icon: SunIcon, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
                  { id: "HALF_DAY", label: "Half Day", icon: MoonIcon, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
                  { id: "LEAVE", label: "On Leave", icon: XIcon, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" }
                ].map((item) => {
                  const isActive = dayType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDayType(item.id as DayType)}
                      className={cn(
                        "flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300 gap-1.5",
                        isActive
                          ? cn("shadow-md scale-105 z-10", item.color)
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className={cn("size-4", isActive ? "" : "opacity-40")} />
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Break Selector */}
            <div className="space-y-3">
              <FieldLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">Daily Breaks</FieldLabel>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CoffeeIcon className="size-4 text-primary/60" />
                </div>
                <select
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value))}
                  disabled={dayType === "LEAVE"}
                  className="w-full h-12 pl-10 pr-4 rounded-2xl border border-border/60 bg-card/50 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {BREAK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <PlusIcon className="size-3 text-muted-foreground/40 rotate-45" />
                </div>
              </div>
            </div>
          </div>

          {dayType !== "LEAVE" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Task Details</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {tasks.map((task, index) => (
                <div key={index} className="relative group/task bg-card rounded-3xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                      <ActivityIcon className="size-3.5" />
                      Task Log #{index + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeTask(index)}
                      className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-full transition-colors"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      {(() => {
                        const startMins = timeToMinutes(task.startTime);
                        const endMins = task.endTime ? timeToMinutes(task.endTime) : 0;
                        const isInvalidDecreasing = Boolean(task.endTime && endMins <= startMins);
                        const durationMins = (!isInvalidDecreasing && task.endTime) ? (endMins - startMins) : 0;
                        const endTimeOptions = getEndTimeOptions(task.startTime);

                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <Field>
                              <div className="flex items-center justify-between mb-1.5 ml-1">
                                <FieldLabel className="text-[11px] font-semibold text-muted-foreground">Start Time</FieldLabel>
                              </div>
                              <div className="relative">
                                <select
                                  value={task.startTime}
                                  onChange={(e) => handleStartTimeChange(index, e.target.value)}
                                  className="w-full h-11 rounded-xl border border-border/60 bg-muted/20 pl-3.5 pr-8 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                  {TIME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                                  <ClockIcon className="size-3.5" />
                                </div>
                              </div>
                            </Field>

                            <Field>
                              <div className="flex items-center justify-between mb-1.5 ml-1">
                                <FieldLabel className="text-[11px] font-semibold text-muted-foreground">End Time</FieldLabel>
                                {durationMins > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 animate-in fade-in duration-200">
                                    <ClockIcon className="size-2.5" />
                                    {formatHours(durationMins)}
                                  </span>
                                ) : isInvalidDecreasing ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md border border-destructive/20 animate-in fade-in duration-200">
                                    <AlertCircleIcon className="size-2.5" />
                                    Must be after start
                                  </span>
                                ) : null}
                              </div>
                              <div className="relative">
                                <select
                                  value={task.endTime}
                                  onChange={(e) => updateTask(index, { endTime: e.target.value })}
                                  className={cn(
                                    "w-full h-11 rounded-xl border pl-3.5 pr-8 text-sm font-medium focus:ring-4 outline-none transition-all appearance-none cursor-pointer",
                                    isInvalidDecreasing
                                      ? "border-destructive/80 bg-destructive/5 text-destructive focus:ring-destructive/20"
                                      : "border-border/60 bg-muted/20 text-foreground focus:ring-primary/10 focus:border-primary/50"
                                  )}
                                >
                                  <option value="" disabled>Select End Time</option>
                                  {isInvalidDecreasing && task.endTime && (
                                    <option value={task.endTime} disabled className="text-destructive font-semibold">
                                      ⚠️ {formatTime12h(task.endTime)} (Invalid: before start)
                                    </option>
                                  )}
                                  {endTimeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                                  <ClockIcon className="size-3.5" />
                                </div>
                              </div>
                            </Field>
                          </div>
                        );
                      })()}

                      <Field>
                        <FieldLabel className="text-[11px] font-semibold text-muted-foreground mb-1.5 ml-1">Project Assignment</FieldLabel>
                        <select
                          value={task.isLearning ? "LEARNING" : task.projectId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "LEARNING") {
                              updateTask(index, { projectId: "", isLearning: true });
                            } else {
                              updateTask(index, { projectId: val, isLearning: false });
                            }
                          }}
                          className="w-full h-11 rounded-xl border border-border/60 bg-muted/20 px-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                        >
                          <option value="">Internal Activity (No Project)</option>
                          <option value="LEARNING" className="text-amber-600 font-semibold">✨ Learning & Self-Development</option>
                          <optgroup label="Active Client Projects">
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.isLearning ? " (Lrn)" : ""} {p.client ? `— ${p.client}` : ""}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel className="text-[11px] font-semibold text-muted-foreground mb-1.5 ml-1 flex items-center justify-between">
                          <span>Task ID / Ticket #</span>
                          <span className="text-[10px] text-muted-foreground/60 font-normal">Optional</span>
                        </FieldLabel>
                        <Input
                          placeholder="e.g. TSK-102, PROJ-45, #123"
                          value={task.taskId || ""}
                          onChange={(e) => updateTask(index, { taskId: e.target.value })}
                          className="h-11 rounded-xl border-border/60 bg-muted/20 focus:ring-4 focus:ring-primary/10 font-mono text-xs"
                        />
                      </Field>
                    </div>

                    <div className="space-y-5">
                      <Field>
                        <FieldLabel className="text-[11px] font-semibold text-muted-foreground mb-1.5 ml-1">Activity Subject</FieldLabel>
                        <Input
                          placeholder="What did you work on?"
                          value={task.subject}
                          onChange={(e) => updateTask(index, { subject: e.target.value })}
                          className="h-11 rounded-xl border-border/60 bg-muted/20 focus:ring-4 focus:ring-primary/10"
                        />
                      </Field>
                      <Field>
                        <FieldLabel className="text-[11px] font-semibold text-muted-foreground mb-1.5 ml-1">Description / Notes</FieldLabel>
                        <Textarea
                          placeholder="Briefly describe the tasks achieved..."
                          value={task.description}
                          onChange={(e) => updateTask(index, { description: e.target.value })}
                          className="min-h-[106px] rounded-xl text-sm py-3 resize-none border-border/60 bg-muted/20 focus:ring-4 focus:ring-primary/10"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
                      <LinkIcon className="size-3 text-primary" />
                      Activity Links & Documentation
                    </p>
                    <div className="space-y-3">
                      {task.links.map((link, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-3 bg-muted/5 border border-border/40 rounded-2xl p-3 group/link transition-all hover:bg-muted/10">
                          <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Label (e.g. PR #123)"
                              value={link.label}
                              onChange={(e) => {
                                const newLinks = [...task.links];
                                newLinks[lIdx].label = e.target.value;
                                updateTask(index, { links: newLinks });
                              }}
                              className="h-9 text-xs border-none bg-background shadow-sm focus:ring-2 focus:ring-primary/10"
                            />
                            <Input
                              placeholder="URL Link"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...task.links];
                                newLinks[lIdx].url = e.target.value;
                                updateTask(index, { links: newLinks });
                              }}
                              className="h-9 text-xs border-none bg-background shadow-sm focus:ring-2 focus:ring-primary/10"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              const newLinks = task.links.filter((_, i) => i !== lIdx);
                              updateTask(index, { links: newLinks });
                            }}
                            className="rounded-full opacity-0 group-hover/link:opacity-100 transition-all bg-background shadow-sm border border-border/40"
                          >
                            <XIcon className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateTask(index, { links: [...task.links, { url: "", label: "" }] });
                        }}
                        className="h-9 text-[11px] font-bold text-primary hover:text-primary hover:bg-primary/5 gap-2 px-4 rounded-xl border border-primary/10 border-dashed"
                      >
                        <PlusCircleIcon className="size-4" />
                        Add documentation link
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full py-8 border-dashed border-2 bg-primary/[0.02] border-primary/20 hover:bg-primary/[0.04] hover:border-primary/40 text-primary/60 hover:text-primary transition-all rounded-[2rem] gap-3 group"
                onClick={addTask}
              >
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusIcon className="size-5" />
                </div>
                <span className="font-bold tracking-tight">Add another task log for today</span>
              </Button>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-700 bg-rose-500/[0.02] rounded-[3rem] border border-dashed border-rose-500/20">
              <div className="size-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                <MoonIcon className="size-10" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-rose-700">You are on Leave</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">Tasks and activities are disabled for leave entries. Simply save to confirm your status.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-card border-t border-border/40 sticky bottom-0">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Logged Time</span>
                <span className="text-xl font-black tabular-nums text-foreground">{formatHours(totalTaskMins)}</span>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Daily Break</span>
                <span className="text-xl font-black tabular-nums text-amber-600">{formatHours(breakMinutes)}</span>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Net Productive</span>
                <span className="text-2xl font-black tabular-nums text-primary underline underline-offset-8 decoration-primary/20">{formatHours(netMins)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button variant="ghost" onClick={onClose} disabled={saving} className="px-8 font-bold h-12 rounded-2xl hover:bg-muted">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-initial h-12 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
              >
                {saving ? <Spinner className="size-4 mr-2" /> : <CalendarCheckIcon className="size-4 mr-2" />}
                {saving ? "Syncing..." : "Save Log"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
