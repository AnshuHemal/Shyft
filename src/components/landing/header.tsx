"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MenuIcon, XIcon, ZapIcon, ChevronRightIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-sm"
          : "py-5 bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="SHYFT home"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
              <ZapIcon className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">SHYFT</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
            <div className="flex items-center bg-muted/40 rounded-full px-2 py-1.5 border border-border/40 backdrop-blur-md">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-full transition-all hover:bg-background/80 hover:shadow-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-border/60 mx-1" />
            <Button variant="ghost" size="sm" nativeButton={false} className="font-semibold hover:bg-muted/50" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button size="sm" nativeButton={false} className="font-bold gap-1 shadow-md shadow-primary/20 hover:scale-105 transition-all" render={<Link href="/signup" />}>
              Get started <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="bg-muted/40"
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 pb-6 pt-4 mt-3 space-y-2 shadow-2xl">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors hover:bg-muted/50"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" size="lg" nativeButton={false} className="w-full font-bold" render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button size="lg" nativeButton={false} className="w-full font-bold shadow-lg shadow-primary/20" render={<Link href="/signup" />}>
                  Get started free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
