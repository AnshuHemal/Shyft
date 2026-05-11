"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    // scriptProps suppresses the React 19 "script tag inside component" warning.
    // next-themes injects an inline script to read the stored theme before
    // hydration (prevents flash of wrong theme). React 19 warns about this
    // pattern — suppressHydrationWarning silences it without changing behaviour.
    <NextThemesProvider
      {...props}
      scriptProps={{ suppressHydrationWarning: true }}
    >
      {children}
    </NextThemesProvider>
  );
}
