"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 8;
// Accept uppercase letters A-Z (excluding I, O) and digits 2-9
const VALID_CHAR = /^[A-HJ-NP-Z2-9]$/i;

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OTPInput({
  value,
  onChange,
  disabled = false,
  length = OTP_LENGTH,
}: OTPInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  // Normalise: uppercase, strip invalid chars, cap at length
  function normalise(raw: string) {
    return raw
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, "")
      .slice(0, length);
  }

  function focusSlot(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clamped]?.focus();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        // Clear current slot
        const next = value.split("");
        next[index] = "";
        onChange(next.join("").replace(/\s/g, ""));
      } else if (index > 0) {
        // Move back and clear previous
        const next = value.split("");
        next[index - 1] = "";
        onChange(next.join("").replace(/\s/g, ""));
        focusSlot(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusSlot(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusSlot(index + 1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const next = value.split("");
      next[index] = "";
      onChange(next.join("").replace(/\s/g, ""));
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) {
    const raw = e.target.value;
    // Handle paste into a single slot
    if (raw.length > 1) {
      const pasted = normalise(raw);
      const chars = value.split("");
      pasted.split("").forEach((ch, i) => {
        if (index + i < length) chars[index + i] = ch;
      });
      const next = chars.join("").slice(0, length);
      onChange(next);
      focusSlot(Math.min(index + pasted.length, length - 1));
      return;
    }

    const char = raw.toUpperCase();
    if (char && !VALID_CHAR.test(char)) return; // reject invalid

    const chars = value.padEnd(length, "").split("");
    chars[index] = char;
    const next = chars.join("").trimEnd();
    onChange(next);

    if (char && index < length - 1) {
      focusSlot(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    e.preventDefault();
    const pasted = normalise(e.clipboardData.getData("text"));
    if (!pasted) return;
    const chars = value.padEnd(length, "").split("");
    pasted.split("").forEach((ch, i) => {
      if (index + i < length) chars[index + i] = ch;
    });
    onChange(chars.join("").trimEnd());
    focusSlot(Math.min(index + pasted.length, length - 1));
  }

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="group"
      aria-label="One-time password input"
    >
      {Array.from({ length }).map((_, i) => {
        const char = value[i] ?? "";
        const isFilled = char !== "";
        const isFocused = focusedIndex === i;
        const isNext = !isFilled && value.length === i; // next empty slot

        return (
          <div key={i} className="relative">
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              maxLength={2} // allow 2 so we can detect paste
              value={char}
              disabled={disabled}
              aria-label={`OTP character ${i + 1}`}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              className={cn(
                // Base
                "size-11 rounded-xl border bg-background text-center font-mono text-base font-semibold uppercase",
                "caret-transparent outline-none transition-all duration-200 select-none",
                "disabled:pointer-events-none disabled:opacity-40",
                // Default
                "border-border text-foreground",
                // Filled
                isFilled && "border-primary/60 bg-primary/5 text-primary",
                // Focused
                isFocused && "border-primary ring-3 ring-primary/20 scale-105",
                // Next-to-fill indicator
                isNext && !isFocused && "border-primary/40",
                // Error state (passed via aria-invalid on parent)
                "aria-invalid:border-destructive aria-invalid:ring-destructive/20"
              )}
            />
            {/* Animated bottom bar */}
            <span
              className={cn(
                "absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-primary transition-all duration-300",
                isFocused ? "w-6 opacity-100" : "w-0 opacity-0"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

// Auto-focus the first empty slot on mount
export function useOTPAutoFocus(
  inputRefs: React.MutableRefObject<Array<HTMLInputElement | null>>,
  value: string,
  length: number
) {
  React.useEffect(() => {
    const firstEmpty = Math.min(value.length, length - 1);
    inputRefs.current[firstEmpty]?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
