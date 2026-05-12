/**
 * Timesheet utility functions shared between employee and HR views.
 */

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/**
 * Get all dates in a given month/year as Date objects (UTC midnight).
 */
export function getDaysInMonth(month: number, year: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(Date.UTC(year, month - 1, d)));
  }
  return days;
}

/**
 * Check if a date is a weekend (Saturday=6, Sunday=0).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Calculate net working minutes from start/end time strings and break minutes.
 * Times are in "HH:MM" 24h format.
 */
export function calcNetMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, total - breakMinutes);
}

/**
 * Format minutes as "Xh Ym" or "Xh".
 */
export function formatHours(minutes: number): string {
  if (minutes <= 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Check if a date is within the 48-hour edit window.
 * Employees can fill timesheets for today and yesterday (up to 48h ago).
 */
export function isWithinEditWindow(date: Date): boolean {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  // Compare date-only (ignore time)
  const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const cutoffOnly = new Date(Date.UTC(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate()));
  const todayOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return dateOnly >= cutoffOnly && dateOnly <= todayOnly;
}

/**
 * Check if a date is in the future (cannot fill future dates).
 */
export function isFutureDate(date: Date): boolean {
  const now = new Date();
  const todayOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return dateOnly > todayOnly;
}

/**
 * Generate time options in 30-minute increments for time pickers.
 */
export function getTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${hour12}:${mm} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

export const TIME_OPTIONS = getTimeOptions();

export const BREAK_OPTIONS = [
  { value: "0", label: "No break" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "50", label: "50 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];
