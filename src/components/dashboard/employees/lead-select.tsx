"use client";

import * as React from "react";
import { UserIcon, ChevronDownIcon, SearchIcon, LoaderIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  avatar?: string | null;
}

interface LeadSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  excludeId?: string;
  placeholder?: string;
}

export function LeadSelect({
  value,
  onChange,
  disabled = false,
  excludeId,
  placeholder = "Select reporting lead…",
}: LeadSelectProps) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetched, setFetched] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const fetchEmployees = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
        setFetched(true);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen && !fetched && !loading) {
      fetchEmployees();
    }
  }, [isOpen, fetched, loading, fetchEmployees]);

  const filtered = employees.filter((e) => {
    if (e.id === excludeId) return false;
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || e.designation.toLowerCase().includes(search.toLowerCase());
  });

  const selected = employees.find((e) => e.id === value);

  return (
    <Combobox
      value={value}
      onValueChange={(val) => onChange(val || "")}
      open={isOpen}
      onOpenChange={setIsOpen}
      inputValue={search}
      onInputValueChange={setSearch}
    >
      <div className="relative">
        <ComboboxInput
          disabled={disabled}
          placeholder={placeholder}
          className="w-full"
          showClear
        />
      </div>

      <ComboboxContent
        className="min-w-[240px] p-1 border border-border/50 shadow-xl bg-popover/95 backdrop-blur-md"
        align="start"
      >
        <ComboboxList className="max-h-[300px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <ComboboxEmpty className="py-8 px-4 text-center">
              <p className="text-sm text-muted-foreground">No employees found.</p>
            </ComboboxEmpty>
          )}

          {!loading && filtered.map((emp) => (
            <ComboboxItem
              key={emp.id}
              value={emp.id}
              className="flex items-center gap-3 p-2 rounded-md transition-all duration-200 cursor-pointer data-highlighted:bg-primary/10"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar size="sm" className="size-8 shrink-0 border border-border/50">
                  {emp.avatar && <AvatarImage src={emp.avatar} alt={`${emp.firstName} ${emp.lastName}`} />}
                  <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {emp.firstName} {emp.lastName}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">
                    {emp.designation}
                  </span>
                </div>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
