"use client";

import Link from "next/link";
import { ZapIcon, GlobeIcon, MessageSquareIcon, MailIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const FOOTER_LINKS = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Onboarding", href: "#" },
    { label: "Leave & Assets", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

const SOCIAL_LINKS = [
  { icon: GlobeIcon, href: "#" },
  { icon: MessageSquareIcon, href: "#" },
  { icon: MailIcon, href: "#" },
];

export function Footer() {
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1,
        ease: "easeOut" 
      } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <footer className="border-t border-border/50 bg-background pt-16 pb-8 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 size-[800px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <motion.div 
        variants={containerVariants as any}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <motion.div variants={itemVariants as any} className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group w-fit">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <ZapIcon className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">SHYFT</span>
            </Link>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xs mb-8">
              The modern HRMS platform for teams who value transparency, efficiency, and zero friction. Setup in minutes.
            </p>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social, i) => (
                <a key={i} href={social.href} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <motion.div variants={itemVariants as any} key={category}>
              <p className="text-base font-bold text-foreground mb-6 uppercase tracking-wider text-sm">
                {category}
              </p>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-all"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Separator className="my-8 opacity-50" />

        <motion.div variants={itemVariants as any} className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} SHYFT Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Built with care for teams everywhere.</span>
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse ml-2" />
            <span className="text-emerald-500">All systems operational</span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
