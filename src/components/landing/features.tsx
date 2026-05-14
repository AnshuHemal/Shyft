"use client";

import {
  ClockIcon,
  UsersIcon,
  LaptopIcon,
  BanknoteIcon,
  CalendarOffIcon,
  UserCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: UserCheckIcon,
    title: "Secure Employee Onboarding",
    description:
      "Automate Day 1 with our multi-step KYC wizard. Collect PAN, Aadhaar, educational documents, and auto-sync to employee profiles.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: CalendarOffIcon,
    title: "Leave & Comp-Off Management",
    description:
      "A seamless portal for employees to apply for leaves and comp-offs, fully integrated with multi-level hierarchical approval chains.",
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    icon: BanknoteIcon,
    title: "Reimbursement Processing",
    description:
      "Employees can upload receipts instantly. HR gets a cinematic sliding drawer to review bills and approve claims with one click.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: LaptopIcon,
    title: "Asset Lifecycle Tracking",
    description:
      "Track every company asset from assignment to return. Employees can raise requests for new assets or replacements right from their dashboard.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: ClockIcon,
    title: "Timesheets & Real-time Tracking",
    description:
      "Ditch the spreadsheets. A high-performance time tracker with visual progress rings, idle detection, and comprehensive monthly audits.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: UsersIcon,
    title: "Multi-level Approvals",
    description:
      "Our advanced hierarchy engine ensures requests go exactly to the right Lead or Manager before HR review. No more lost emails.",
    color: "text-primary bg-primary/10",
  },
];

export function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold tracking-widest uppercase">Platform Capabilities</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Everything your HR team needs
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            SHYFT is a complete ecosystem built for modern enterprises. We handle the paperwork so you can focus on your people.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative rounded-3xl border border-border/50 bg-card p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Decorative background gradient */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 size-32 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-40 group-hover:scale-150" style={{ backgroundColor: "currentColor" }} />

              <div
                className={cn(
                  "inline-flex size-14 items-center justify-center rounded-2xl mb-6 shadow-sm border border-background/20",
                  feature.color
                )}
              >
                <feature.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {feature.description}
              </p>
              
              <div className="mt-auto flex items-center text-sm font-bold text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Learn more <ArrowRightIcon className="size-4 ml-1" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
