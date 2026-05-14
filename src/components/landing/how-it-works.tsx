"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Create your organization",
    description:
      "Sign up in seconds and instantly generate your HR dashboard. Invite your leads and set up your organizational hierarchy.",
  },
  {
    step: "02",
    title: "Onboard your employees",
    description:
      "Send a single link. Employees securely upload their KYC and professional documents via our automated Cloudinary wizard.",
  },
  {
    step: "03",
    title: "Run your operations on autopilot",
    description:
      "From time-tracking and leave approvals to asset management and reimbursements—everything flows through designated approval chains.",
  },
];

export function HowItWorks() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring" } },
  };

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <span className="text-sm font-bold tracking-widest uppercase">The SHYFT Workflow</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            From chaos to clarity in three steps
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            We've stripped away the complexity of traditional HR systems. You'll be up and running before your coffee gets cold.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
            className="hidden lg:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-1 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 rounded-full origin-left" 
          />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8"
          >
            {STEPS.map((step, index) => (
              <motion.div key={step.step} variants={itemVariants} className="relative flex flex-col items-center text-center lg:items-start lg:text-left group">
                {/* Step number */}
                <div
                  className={cn(
                    "relative z-10 flex size-20 items-center justify-center rounded-3xl border-2 font-bold text-2xl mb-8 transition-all duration-500 shadow-sm",
                    index === 0
                      ? "border-primary bg-primary text-primary-foreground shadow-primary/20 scale-110 group-hover:scale-125"
                      : "border-border bg-card text-muted-foreground group-hover:border-primary/50 group-hover:text-primary group-hover:scale-110"
                  )}
                >
                  {step.step}
                  {/* Subtle pulse for active step */}
                  {index === 0 && <div className="absolute inset-0 rounded-3xl bg-primary animate-ping opacity-20" />}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed lg:pr-8">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
