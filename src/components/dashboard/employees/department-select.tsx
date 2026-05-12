"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusIcon, BuildingIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
}

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DepartmentSelect({
  value,
  onChange,
  disabled = false,
}: DepartmentSelectProps) {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [fetched, setFetched] = React.useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  // Fetch departments once on mount
  React.useEffect(() => {
    if (fetched) return;
    fetch("/api/departments")
      .then((r) => r.json())
      .then((json) => {
        setDepartments(json.departments ?? []);
        setFetched(true);
      })
      .catch(() => toast.error("Failed to load departments."));
  }, [fetched]);

  // ── Add department ──────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();

    if (!name) {
      setNameError("Department name is required.");
      return;
    }

    // Client-side duplicate check (case-insensitive)
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setNameError(`"${name}" already exists. Choose a different name.`);
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (!res.ok) {
        setNameError(json.error ?? "Failed to create department.");
        return;
      }

      const created: Department = json.department;

      // Insert into sorted list
      setDepartments((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );

      // Select the new department
      onChange(created.name);

      // Close modal
      setModalOpen(false);
      setNewName("");
      setNameError("");

      toast.success(`"${created.name}" department added.`);
    } catch {
      setNameError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function openModal() {
    setNewName("");
    setNameError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (adding) return;
    setModalOpen(false);
    setNewName("");
    setNameError("");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Combobox — Base UI handles portal/positioning, no overflow issues */}
      <Combobox
        value={value}
        onValueChange={(v) => onChange(v ?? "")}
        disabled={disabled}
      >
        <ComboboxInput
          placeholder="Select department…"
          showClear={!!value}
          className="w-full"
        />

        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No departments found.</ComboboxEmpty>

            {departments.map((dept) => (
              <ComboboxItem
                key={dept.id}
                value={dept.name}
                className="cursor-pointer p-2 rounded-md transition-all duration-200 data-highlighted:bg-primary/10"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                    <BuildingIcon className="size-4" />
                  </div>
                  <span className="font-medium text-sm truncate">{dept.name}</span>
                </div>
              </ComboboxItem>
            ))}

            {/* Add new department — triggers modal */}
            <>
              <ComboboxSeparator className="my-1 opacity-50" />
              <button
                type="button"
                onMouseDown={(e) => {
                  // Use mousedown so it fires before the combobox closes
                  e.preventDefault();
                  openModal();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-all rounded-md"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/20">
                  <PlusIcon className="size-4" />
                </div>
                Add new department
              </button>
            </>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {/* Add department modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
            <DialogDescription>
              Create a new department for your organisation. It will be
              available immediately in the dropdown.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} noValidate>
            <div className="py-2">
              <Field>
                <FieldLabel htmlFor="dept-name">
                  Department name{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="dept-name"
                  placeholder="e.g. Engineering, Marketing, HR…"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNameError("");
                  }}
                  autoFocus
                  aria-invalid={!!nameError}
                  disabled={adding}
                />
                {nameError && <FieldError>{nameError}</FieldError>}
              </Field>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={adding || !newName.trim()}
              >
                {adding ? (
                  <Spinner className="size-4" />
                ) : (
                  <PlusIcon className="size-4" />
                )}
                {adding ? "Adding…" : "Add department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
