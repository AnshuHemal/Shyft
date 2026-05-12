"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MONTH_NAMES } from "@/lib/timesheet-utils";
import {
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HolidayManager() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Add dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDate, setNewDate] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [dateError, setDateError] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<Holiday | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchHolidays() {
    setLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${year}`);
      const json = await res.json();
      if (res.ok) setHolidays(json.holidays);
    } catch {
      toast.error("Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchHolidays(); }, [year]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!newName.trim()) { setNameError("Holiday name is required."); valid = false; }
    if (!newDate) { setDateError("Date is required."); valid = false; }
    if (!valid) return;

    setAdding(true);
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), date: newDate, description: newDesc }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to add holiday.");
        return;
      }
      setHolidays((prev) =>
        [...prev, json.holiday].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
      setAddOpen(false);
      setNewName(""); setNewDate(""); setNewDesc("");
      toast.success(`"${json.holiday.name}" added.`);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/holidays/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete holiday."); return; }
      setHolidays((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`"${deleteTarget.name}" removed.`);
    } finally {
      setDeleting(false);
    }
  }

  // Group by month
  const byMonth = React.useMemo(() => {
    const map: Record<number, Holiday[]> = {};
    holidays.forEach((h) => {
      const m = new Date(h.date).getUTCMonth();
      if (!map[m]) map[m] = [];
      map[m].push(h);
    });
    return map;
  }, [holidays]);

  return (
    <div className={cn("space-y-6 transition-all duration-500", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Holiday Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage public and company holidays for your organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{year}</span>
          <Button variant="outline" size="icon-sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            Add holiday
          </Button>
        </div>
      </div>

      {/* Holiday list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          Loading…
        </div>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarIcon className="size-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No holidays for {year}</p>
            <p className="text-sm text-muted-foreground">Add holidays to automatically mark them in employee timesheets.</p>
            <Button size="sm" className="gap-1.5 mt-2" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-4" />
              Add first holiday
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([monthIdx, monthHolidays]) => (
              <Card key={monthIdx}>
                <CardHeader className="border-b border-border/60 py-3">
                  <CardTitle className="text-base">{MONTH_NAMES[Number(monthIdx)]}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-border/60">
                  {monthHolidays.map((holiday, i) => {
                    const date = new Date(holiday.date);
                    const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getUTCDay()];
                    return (
                      <div
                        key={holiday.id}
                        className={cn(
                          "flex items-center gap-4 py-3 transition-all duration-300",
                          mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                        )}
                        style={{ transitionDelay: `${i * 40}ms` }}
                      >
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-xs font-medium leading-none">{dayName}</span>
                          <span className="text-base font-bold leading-none mt-0.5">
                            {date.getUTCDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{holiday.name}</p>
                          {holiday.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{holiday.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(holiday)}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          aria-label="Delete holiday"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add holiday dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o && !adding) { setAddOpen(false); setNewName(""); setNewDate(""); setNewDesc(""); setNameError(""); setDateError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add holiday</DialogTitle>
            <DialogDescription>
              Add a public or company holiday. It will automatically be marked in all employee timesheets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} noValidate className="space-y-4 py-2">
            <Field>
              <FieldLabel htmlFor="holiday-name">
                Holiday name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="holiday-name"
                placeholder="e.g. Diwali, Republic Day"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNameError(""); }}
                autoFocus
                aria-invalid={!!nameError}
              />
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="holiday-date">
                Date <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="holiday-date"
                type="date"
                value={newDate}
                onChange={(e) => { setNewDate(e.target.value); setDateError(""); }}
                aria-invalid={!!dateError}
              />
              {dateError && <FieldError>{dateError}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="holiday-desc">Description (optional)</FieldLabel>
              <Input
                id="holiday-desc"
                placeholder="Brief description…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
              <Button type="submit" className="gap-2" disabled={adding}>
                {adding ? <Spinner className="size-4" /> : <PlusIcon className="size-4" />}
                {adding ? "Adding…" : "Add holiday"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove holiday?</DialogTitle>
            <DialogDescription>
              Remove <strong>{deleteTarget?.name}</strong> from the holiday calendar?
              This will not affect already-submitted timesheets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting ? <Spinner className="size-4" /> : <TrashIcon className="size-4" />}
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
