"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PlayCircleIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Announcement badge */}
        <div
          className={cn(
            "inline-flex mb-8 transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1 text-sm font-medium border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-default"
          >
            <SparklesIcon className="size-3" />
            Now in public beta — free to get started
            <ArrowRightIcon className="size-3" />
          </Badge>
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] transition-all duration-700 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          Work tracked.
          <br />
          <span className="text-primary">Time respected.</span>
        </h1>

        {/* Subheadline */}
        <p
          className={cn(
            "mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed transition-all duration-700 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          SHYFT gives your team a clear view of where time goes — without the
          micromanagement. Smart tracking, honest insights, and workflows that
          actually fit how you work.
        </p>

        {/* CTA buttons */}
        <div
          className={cn(
            "mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 delay-300",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <Button size="lg" nativeButton={false} className="w-full sm:w-auto gap-2 px-6" render={<Link href="/signup" />}>
            Get started free
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="w-full sm:w-auto gap-2 px-6"
            render={<a href="#how-it-works" />}
          >
            <PlayCircleIcon className="size-4" />
            See how it works
          </Button>
        </div>

        {/* Social proof */}
        <p
          className={cn(
            "mt-8 text-sm text-muted-foreground transition-all duration-700 delay-[400ms]",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          No credit card required · Free forever plan · Setup in 2 minutes
        </p>

        {/* Dashboard preview */}
        <div
          className={cn(
            "mt-16 relative transition-all duration-1000 delay-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl" />
            {/* Mock dashboard card */}
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400/70" />
                  <div className="size-3 rounded-full bg-yellow-400/70" />
                  <div className="size-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-md bg-muted/60 max-w-48 mx-auto" />
                </div>
              </div>
              {/* Dashboard content mockup */}
              <div className="p-6 grid grid-cols-3 gap-4">
                {[
                  { label: "Hours this week", value: "38.5h", color: "text-primary" },
                  { label: "Tasks completed", value: "24", color: "text-green-500" },
                  { label: "Team members", value: "8", color: "text-blue-500" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/60 bg-background p-4"
                  >
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-2xl font-semibold", stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                ))}
                {/* Chart placeholder */}
                <div className="col-span-3 rounded-xl border border-border/60 bg-background p-4 h-32 flex items-end gap-1.5">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 72].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
