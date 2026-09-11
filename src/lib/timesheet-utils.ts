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
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
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
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format a 24h "HH:MM" time string into 12h AM/PM format.
 * e.g., "09:00" -> "09:00 AM", "17:00" -> "05:00 PM"
 */
export function formatTime12h(timeStr: string, padZero: boolean = true): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr || "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ? mStr.padStart(2, "0") : "00";
  if (isNaN(h)) return timeStr;
  if (h === 24) return "12:00 AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  const displayHour = padZero ? String(hour12).padStart(2, "0") : String(hour12);
  return `${displayHour}:${m} ${ampm}`;
}

/**
 * Format a 24h start/end time range into 12h AM/PM format.
 * e.g., "09:00", "17:00" -> "09:00 AM - 05:00 PM"
 */
export function formatTimeRange12h(startTime: string, endTime: string, padZero: boolean = true): string {
  if (!startTime && !endTime) return "—";
  if (!startTime) return formatTime12h(endTime, padZero);
  if (!endTime) return formatTime12h(startTime, padZero);
  return `${formatTime12h(startTime, padZero)} - ${formatTime12h(endTime, padZero)}`;
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
 * Check if a given month/year is fully complete (i.e. today is past the last day of that month).
 * Employees can only submit once the entire month has passed.
 */
export function isMonthComplete(month: number, year: number): boolean {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  // Last day of the given month at UTC midnight
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)); // month is 1-based, so month,0 = last day
  return todayUTC > lastDayOfMonth;
}

/**
 * Returns how many days remain in the given month from today.
 * Returns 0 if the month is already complete.
 */
export function daysRemainingInMonth(month: number, year: number): number {
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0));
  if (todayUTC > lastDayOfMonth) return 0;
  const diff = lastDayOfMonth.getTime() - todayUTC.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
      const label = `${String(hour12).padStart(2, "0")}:${mm} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

export const TIME_OPTIONS = getTimeOptions();

/**
 * Converts a "HH:MM" string to total minutes since 00:00.
 * e.g. "09:30" -> 570, "24:00" -> 1440
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Converts total minutes into a "HH:MM" 24h string.
 * e.g. 570 -> "09:30", 1440 -> "24:00"
 */
export function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(1440, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface EndTimeOption {
  value: string;
  label: string;
  durationMins: number;
}

/**
 * Generate valid end-time options strictly AFTER the given start time in 30-min increments.
 * Each option displays its 12h time and duration (e.g. "10:00 AM (1h)", "10:30 AM (1h 30m)").
 */
export function getEndTimeOptions(startTime?: string): EndTimeOption[] {
  if (!startTime) return [];
  const startMins = timeToMinutes(startTime);
  const options: EndTimeOption[] = [];

  // Minimum end time is startMins + 30 minutes, aligned to next 30-minute block
  const firstEndMins = Math.max(30, Math.floor(startMins / 30) * 30 + 30);

  for (let mins = firstEndMins; mins <= 1440; mins += 30) {
    const value = minutesToTime(mins);
    const duration = mins - startMins;
    const timeLabel = formatTime12h(value);
    const durationLabel = formatHours(duration);
    options.push({
      value,
      label: `${timeLabel} (${durationLabel})`,
      durationMins: duration,
    });
  }

  return options;
}

export const BREAK_OPTIONS = [
  { value: "0", label: "No break" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "50", label: "50 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];

/**
 * Returns a Tailwind background color class for a given day type.
 */
export function getDayTypeColor(type: string): string {
  switch (type) {
    case "WORKING":
      return "bg-primary";
    case "HOLIDAY":
      return "bg-amber-500";
    case "LEAVE":
      return "bg-rose-500";
    case "HALF_DAY":
      return "bg-indigo-500";
    case "WEEKEND":
      return "bg-slate-300 dark:bg-slate-700";
    default:
      return "bg-muted";
  }
}
