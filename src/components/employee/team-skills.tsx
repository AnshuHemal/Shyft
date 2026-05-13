"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillMapBoard } from "@/components/employee/skill-map/skill-map-board";
import { 
  UsersIcon, 
  ArrowLeftIcon, 
  SearchIcon,
  BrainCircuitIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  TargetIcon
} from "lucide-react";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  avatar?: string | null;
  status: string;
}

export function TeamSkills() {
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function fetchTeam() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/team");
      const json = await res.json();
      if (res.ok) {
        setTeam(json.team ?? []);
      }
    } catch {
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTeam();
  }, []);

  const filtered = team.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.designation.toLowerCase().includes(search.toLowerCase()) ||
    (m.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (selectedMember) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => setSelectedMember(null)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeftIcon className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Team List
        </button>

        <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-border/40">
          <Avatar className="size-12 rounded-2xl border-2 border-background shadow-sm">
            <AvatarImage src={selectedMember.avatar || ""} />
            <AvatarFallback className="text-sm font-black bg-primary/5 text-primary">
              {selectedMember.firstName[0]}{selectedMember.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-bold leading-none">
              {selectedMember.firstName} {selectedMember.lastName}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMember.designation} {selectedMember.department ? `· ${selectedMember.department}` : ""}
            </p>
          </div>
        </div>

        <SkillMapBoard 
          employeeId={selectedMember.id} 
          isReadOnly={true} 
          employeeName={`${selectedMember.firstName} ${selectedMember.lastName}`}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Skills</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor and support the professional growth of your team members.
          </p>
        </div>
        
        <div className="relative min-w-[280px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search team members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/50 border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Direct Reports", value: team.length, icon: UsersIcon, color: "text-blue-500 bg-blue-500/10" },
          { label: "Skills Tracked", value: "Active", icon: TrendingUpIcon, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Growth Goals", value: "Monitored", icon: TargetIcon, color: "text-amber-500 bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-4 shadow-xs">
            <div className={cn("size-10 rounded-xl flex items-center justify-center", s.color)}>
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Spinner className="size-6" />
          <p className="text-sm font-medium">Synchronizing team data…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground rounded-3xl border border-dashed border-border/60 bg-muted/5">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
            <UsersIcon className="size-8 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">No team members found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member, i) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={cn(
                "group relative flex flex-col items-start p-5 rounded-3xl border border-border/60 bg-card text-left transition-all duration-300",
                "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]",
                "animate-in fade-in slide-in-from-bottom-2 duration-500"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between w-full mb-4">
                <Avatar className="size-14 rounded-2xl border-2 border-background shadow-md group-hover:scale-110 transition-transform duration-500">
                  <AvatarImage src={member.avatar || ""} />
                  <AvatarFallback className="text-lg font-black bg-primary/5 text-primary">
                    {member.firstName[0]}{member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="size-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ChevronRightIcon className="size-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{member.designation}</p>
                
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {member.department && (
                    <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70 transition-colors uppercase tracking-tight">
                      {member.department}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-tight">
                    View Map
                  </span>
                </div>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <BrainCircuitIcon className="size-5 text-primary/20" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
