import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auth header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Shyft home">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <ZapIcon className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Shyft</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Auth content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Auth footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Shyft ·{" "}
          <a href="#" className="hover:text-foreground transition-colors underline underline-offset-4">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="#" className="hover:text-foreground transition-colors underline underline-offset-4">
            Terms
          </a>
        </p>
      </footer>
    </div>
  );
}
