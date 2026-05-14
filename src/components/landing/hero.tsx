"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PlayCircleIcon, SparklesIcon } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] size-[800px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] size-[600px] rounded-full bg-accent/20 blur-[100px]" />
        <div className="absolute top-[30%] left-[60%] size-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div
        className="absolute inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <motion.div 
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Announcement badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <Badge
            variant="outline"
            className="gap-1.5 px-4 py-1.5 text-sm font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors shadow-sm cursor-default backdrop-blur-md"
          >
            <SparklesIcon className="size-4" />
            Introducing SHYFT 2.0 — The Ultimate HRMS
            <ArrowRightIcon className="size-3" />
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-foreground leading-[1.1]"
        >
          Manage your team, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
            without the chaos.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed"
        >
          The all-in-one platform for modern companies. From automated employee onboarding and asset tracking to timesheets, leave management, and multi-level approvals.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all" nativeButton={false} render={<Link href="/signup" />}>
            Start for free
            <ArrowRightIcon className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2 border-2 hover:bg-muted/50 hover:scale-105 transition-all"
            render={<a href="#features" />}
          >
            <PlayCircleIcon className="size-5" />
            See features
          </Button>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-8 text-sm font-medium text-muted-foreground"
        >
          No credit card required · Free forever plan · Setup in minutes
        </motion.p>

        {/* Dashboard preview */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 100, scale: 0.9 },
            visible: { 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { type: "spring", stiffness: 50, damping: 20, delay: 0.6 }
            }
          } as any}
          className="mt-20 relative mx-auto max-w-5xl group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-blue-500/30 to-indigo-500/30 rounded-[2.5rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
          
          {/* Main Mockup Container */}
          <div className="relative rounded-[2rem] border border-border/50 bg-background shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex gap-2">
                <div className="size-3.5 rounded-full bg-red-400/80 shadow-sm" />
                <div className="size-3.5 rounded-full bg-amber-400/80 shadow-sm" />
                <div className="size-3.5 rounded-full bg-emerald-400/80 shadow-sm" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-6 rounded-md bg-muted/40 w-1/3 flex items-center justify-center border border-border/30">
                  <span className="text-[10px] text-muted-foreground font-medium">shyft-hq.vercel.app</span>
                </div>
              </div>
            </div>
            
            {/* Mock Dashboard UI */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-muted/10">
              
              {/* Sidebar Mock */}
              <div className="hidden md:flex flex-col gap-3">
                <div className="h-8 w-24 bg-primary/20 rounded-lg mb-4" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-10 rounded-xl ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border/50'}`} />
                ))}
              </div>

              {/* Main Content Mock */}
              <div className="md:col-span-3 space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded-full" />
                    <div className="h-8 w-64 bg-foreground/10 rounded-lg" />
                  </div>
                  <div className="h-10 w-32 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-xs font-bold">
                    Approve Leave
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Pending Onboardings", value: "3" },
                    { label: "Asset Requests", value: "12" },
                    { label: "Timesheets Review", value: "8" },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <SparklesIcon className="size-12" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="h-48 rounded-2xl bg-card border border-border/50 shadow-sm p-5 flex flex-col justify-end gap-2">
                   <div className="flex justify-between items-center mb-4">
                     <div className="h-4 w-40 bg-muted rounded-full" />
                     <div className="h-4 w-16 bg-muted rounded-full" />
                   </div>
                   <div className="flex items-end gap-2 h-full">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 72].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1 + i * 0.05, duration: 0.8, type: "spring" }}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/20 to-primary/60"
                      />
                    ))}
                   </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
