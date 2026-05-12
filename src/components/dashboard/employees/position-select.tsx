"use client";

import * as React from "react";
import { ChevronDownIcon, LoaderIcon, AlertCircleIcon, PlusIcon, BriefcaseIcon, AwardIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Position {
  id: string;
  name: string;
  description: string | null;
  level: number | null;
}

interface PositionSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// ── PositionSelect Component ──────────────────────────────────────────────────

export function PositionSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a position…",
}: PositionSelectProps) {
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newPositionName, setNewPositionName] = React.useState("");
  const [newPositionDesc, setNewPositionDesc] = React.useState("");
  const [newPositionLevel, setNewPositionLevel] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Fetch positions
  const fetchPositions = React.useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/positions${query}`);

      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data = await response.json();
      setPositions(data.positions || []);
      setFetched(true);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError("Could not load positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when dropdown opens for the first time
  React.useEffect(() => {
    if (isOpen && !fetched && !loading) {
      fetchPositions("");
    }
  }, [isOpen, fetched, loading, fetchPositions]);

  // Debounce search input while dropdown is open
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => {
      fetchPositions(searchInput.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput, isOpen, fetchPositions]);

  // Filtered positions based on search
  const filteredPositions = searchInput
    ? positions.filter((p) =>
      p.name.toLowerCase().includes(searchInput.toLowerCase())
    )
    : positions;

  // Create new position
  const handleCreatePosition = async () => {
    if (!newPositionName.trim()) {
      toast.error("Position name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPositionName.trim(),
          description: newPositionDesc.trim() || null,
          level: newPositionLevel ? parseInt(newPositionLevel) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create position");
      }

      const data = await response.json();

      // Add to list and select it
      setPositions([...positions, data.position]);
      onChange(data.position.name);

      // Reset form
      setNewPositionName("");
      setNewPositionDesc("");
      setNewPositionLevel("");
      setShowAddDialog(false);
      setSearchInput("");

      toast.success("Position created successfully");
    } catch (err) {
      console.error("Error creating position:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create position");
    } finally {
      setIsCreating(false);
    }
  };

  // Get selected position label
  const selectedPosition = positions.find((p) => p.id === value);
  const displayLabel = selectedPosition?.name || placeholder;

  return (
    <>
      <Combobox
        value={value}
        onValueChange={(val) => onChange(val || "")}
        open={isOpen}
        onOpenChange={setIsOpen}
        inputValue={searchInput}
        onInputValueChange={setSearchInput}
      >
        <ComboboxInput
          disabled={disabled || loading}
          placeholder={placeholder}
          showClear
        />

        {isOpen && (
          <ComboboxContent
            className="overflow-hidden p-1 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            {/* Loading state */}
            {loading && !positions.length && (
              <div className="flex items-center justify-center gap-2 py-6 px-4">
                <Spinner className="size-4" />
                <span className="text-sm text-muted-foreground">Loading positions…</span>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex items-start gap-2 py-3 px-4 text-sm text-destructive bg-destructive/5">
                <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{error}</p>
                  <button
                    className="text-xs underline mt-1 hover:no-underline"
                    onClick={() => fetchPositions()}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredPositions.length === 0 && !error && (
              <div className="py-8 px-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {searchInput ? "No positions found" : "No positions yet"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setShowAddDialog(true);
                    setIsOpen(false);
                  }}
                >
                  <PlusIcon className="size-3.5" />
                  Create position
                </Button>
              </div>
            )}

            {/* Items */}
            {!loading &&
              filteredPositions.length > 0 &&
              filteredPositions.map((position, idx) => (
                <React.Fragment key={position.id}>
                  <ComboboxItem
                    value={position.name}
                    className="cursor-pointer p-2 rounded-md transition-all duration-200 data-highlighted:bg-primary/10"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                        <BriefcaseIcon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{position.name}</p>
                          {position.level && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider shrink-0">
                              L{position.level}
                            </span>
                          )}
                        </div>
                        {position.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {position.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </ComboboxItem>
                </React.Fragment>
              ))}

            {/* Create new — Persistent at bottom */}
            {!loading && (
              <>
                <ComboboxSeparator className="my-1 opacity-50" />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowAddDialog(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-all rounded-md"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/20">
                    <PlusIcon className="size-4" />
                  </div>
                  Create new position
                </button>
              </>
            )}
          </ComboboxContent>
        )}
      </Combobox>

      {/* Add Position Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create new position</DialogTitle>
            <DialogDescription>
              Add a new position/level to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="position-name">Position name</FieldLabel>
              <Input
                id="position-name"
                placeholder="e.g., Team Lead, Senior Developer"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                disabled={isCreating}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="position-desc">Description (optional)</FieldLabel>
              <textarea
                id="position-desc"
                placeholder="Brief description of the position…"
                rows={2}
                value={newPositionDesc}
                onChange={(e) => setNewPositionDesc(e.target.value)}
                disabled={isCreating}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="position-level">Level (optional)</FieldLabel>
              <Input
                id="position-level"
                type="number"
                placeholder="1 (entry), 2 (mid), 3 (senior), etc."
                min="1"
                max="10"
                value={newPositionLevel}
                onChange={(e) => setNewPositionLevel(e.target.value)}
                disabled={isCreating}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreatePosition}
              disabled={isCreating || !newPositionName.trim()}
              className="gap-1.5"
            >
              {isCreating ? (
                <>
                  <Spinner className="size-4" />
                  Creating…
                </>
              ) : (
                <>
                  <PlusIcon className="size-4" />
                  Create position
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
