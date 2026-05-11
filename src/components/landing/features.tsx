import {
  ClockIcon,
  BarChart3Icon,
  UsersIcon,
  ShieldCheckIcon,
  ZapIcon,
  BellIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ClockIcon,
    title: "Smart time tracking",
    description:
      "One-click timers, automatic idle detection, and calendar integrations that capture your work without interrupting it.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: BarChart3Icon,
    title: "Honest insights",
    description:
      "Visual reports that show where time actually goes — by project, client, or team member — with zero fluff.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: UsersIcon,
    title: "Team visibility",
    description:
      "See your team's workload at a glance. Spot bottlenecks early and balance capacity before burnout happens.",
    color: "text-green-500 bg-green-500/10",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy first",
    description:
      "Employees control what they share. No screenshots, no surveillance — just the data that matters for billing and planning.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: ZapIcon,
    title: "Instant setup",
    description:
      "Connect your tools in minutes. Shyft integrates with Jira, Linear, Notion, Slack, and 40+ other apps out of the box.",
    color: "text-yellow-500 bg-yellow-500/10",
  },
  {
    icon: BellIcon,
    title: "Smart reminders",
    description:
      "Gentle nudges when you forget to log time, weekly summaries, and budget alerts before projects go over.",
    color: "text-rose-500 bg-rose-500/10",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-widest">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Everything your team needs
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Built for teams that value transparency without sacrificing trust.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-xs hover:shadow-md hover:border-border transition-all duration-300"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl mb-4",
                  feature.color
                )}
              >
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
