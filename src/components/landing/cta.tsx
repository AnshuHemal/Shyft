"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-24 sm:py-32 bg-muted/10 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative overflow-hidden rounded-[3rem] bg-foreground px-8 py-20 sm:px-16 sm:py-24 text-center shadow-2xl"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[400px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
          
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/10 mb-8 border border-white/20 shadow-xl backdrop-blur-md">
              <SparklesIcon className="size-8 text-primary-foreground" />
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-background mb-6">
              Ready to upgrade your workspace?
            </h2>
            <p className="text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Join the future of workforce management. Automate onboarding, track time transparently, and manage your assets and leaves with zero friction.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                variant="default"
                nativeButton={false}
                className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                render={<Link href="/signup" />}
              >
                Start your free workspace
                <ArrowRightIcon className="size-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/40 transition-all"
                render={<Link href="/login" />}
              >
                Sign in to your account
              </Button>
            </div>
            <p className="mt-8 text-sm font-medium text-white/50 uppercase tracking-widest">
              No credit card required · Setup in minutes
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
