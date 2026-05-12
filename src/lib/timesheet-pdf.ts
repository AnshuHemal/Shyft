/**
 * timesheet-pdf.ts
 * Client-side PDF generation for monthly timesheets using jsPDF + autotable.
 * Filename format: "Hemal Katariya Timesheet Format '26 - April.pdf"
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DAY_NAMES, calcNetMinutes, formatHours, MONTH_NAMES } from "./timesheet-utils";

type DayType = "WORKING" | "HOLIDAY" | "LEAVE" | "HALF_DAY" | "WEEKEND";

interface TimesheetTask {
  startTime: string;
  endTime: string;
  subject: string;
  description: string | null;
  isLearning: boolean;
  links: { url: string; label: string }[];
  project: { name: string; isLearning: boolean } | null;
}

interface TimesheetEntry {
  date: string;
  dayType: DayType;
  breakMinutes: number;
  tasks: TimesheetTask[];
}

interface TimesheetPDFOptions {
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employeeId: string | null;
  month: number;
  year: number;
  entries: TimesheetEntry[];
  holidays: { date: string; name: string }[];
  status: string;
  orgName?: string;
}

// ── Colour palette (matches the app's design) ─────────────────────────────────
const COLORS = {
  primary:    [99,  102, 241] as [number, number, number],  // indigo-500
  dark:       [15,  23,  42]  as [number, number, number],  // slate-900
  muted:      [100, 116, 139] as [number, number, number],  // slate-500
  border:     [226, 232, 240] as [number, number, number],  // slate-200
  white:      [255, 255, 255] as [number, number, number],
  headerBg:   [248, 250, 252] as [number, number, number],  // slate-50
  weekend:    [240, 253, 244] as [number, number, number],  // green-50
  holiday:    [239, 246, 255] as [number, number, number],  // blue-50
  leave:      [254, 252, 232] as [number, number, number],  // yellow-50
  halfday:    [250, 245, 255] as [number, number, number],  // purple-50
  approved:   [209, 250, 229] as [number, number, number],  // green-100
  rejected:   [254, 226, 226] as [number, number, number],  // red-100
  hrApproved: [167, 243, 208] as [number, number, number],  // emerald-200
};

const DAY_TYPE_LABELS: Record<DayType, string> = {
  WORKING:  "Working",
  HOLIDAY:  "Holiday",
  WEEKEND:  "Weekend",
  LEAVE:    "Leave",
  HALF_DAY: "Half Day",
};

function getRowBg(dayType: DayType): [number, number, number] {
  switch (dayType) {
    case "HOLIDAY":  return COLORS.holiday;
    case "WEEKEND":  return COLORS.weekend;
    case "LEAVE":    return COLORS.leave;
    case "HALF_DAY": return COLORS.halfday;
    default:         return COLORS.white;
  }
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT:        "Draft",
    SUBMITTED:    "Submitted for Review",
    APPROVED:     "Lead Approved",
    REJECTED:     "Rejected",
    HR_SUBMITTED: "Submitted to HR",
    HR_APPROVED:  "HR Approved",
  };
  return map[status] ?? status;
}

export function generateTimesheetPDF(opts: TimesheetPDFOptions): void {
  const {
    firstName, lastName, designation, department, employeeId,
    month, year, entries, holidays, status, orgName,
  } = opts;

  const fullName = `${firstName} ${lastName}`;
  const monthName = MONTH_NAMES[month - 1];
  const shortYear = String(year).slice(2);

  // ── Filename: "Hemal Katariya Timesheet Format '26 - April.pdf" ──────────
  const filename = `${fullName} Timesheet Format '${shortYear} - ${monthName}.pdf`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 22, "F");

  // Logo / org name
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(orgName ?? "SHYFT", margin, 14);

  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Timesheet Report", pageW / 2, 14, { align: "center" });

  // Period
  doc.setFontSize(10);
  doc.text(`${monthName} ${year}`, pageW - margin, 14, { align: "right" });

  // ── Employee info block ───────────────────────────────────────────────────
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 22, pageW, 18, "F");
  doc.setDrawColor(...COLORS.border);
  doc.line(0, 40, pageW, 40);

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(fullName, margin, 32);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  const meta: string[] = [];
  if (designation) meta.push(designation);
  if (department)  meta.push(department);
  if (employeeId)  meta.push(`ID: ${employeeId}`);
  doc.text(meta.join("  ·  "), margin, 38);

  // Status badge (right side)
  const statusLabel = getStatusLabel(status);
  const statusBadgeW = doc.getTextWidth(statusLabel) + 8;
  const badgeBg: [number, number, number] =
    status === "HR_APPROVED"  ? COLORS.hrApproved :
    status === "APPROVED"     ? COLORS.approved :
    status === "REJECTED"     ? COLORS.rejected :
    COLORS.headerBg;
  doc.setFillColor(...badgeBg);
  doc.roundedRect(pageW - margin - statusBadgeW, 26, statusBadgeW, 8, 2, 2, "F");
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, pageW - margin - statusBadgeW / 2, 31.5, { align: "center" });

  // ── Summary row ───────────────────────────────────────────────────────────
  const workingEntries = entries.filter((e) => e.tasks.length > 0);
  const totalMins = workingEntries.reduce((acc, e) => {
    const taskMins = e.tasks.reduce((tAcc, t) => tAcc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
    return acc + Math.max(0, taskMins - (e.breakMinutes || 0));
  }, 0);
  const daysLogged = workingEntries.length;
  const holidayCount = entries.filter((e) => e.dayType === "HOLIDAY").length;
  const leaveCount   = entries.filter((e) => e.dayType === "LEAVE").length;

  const summaryItems = [
    { label: "Days Logged",  value: String(daysLogged) },
    { label: "Total Hours",  value: formatHours(totalMins) },
    { label: "Holidays",     value: String(holidayCount) },
    { label: "Leaves",       value: String(leaveCount) },
    { label: "Period",       value: `${monthName} ${year}` },
  ];

  const colW = (pageW - margin * 2) / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = margin + i * colW + colW / 2;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(item.value, x, 50, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(item.label.toUpperCase(), x, 55, { align: "center" });
  });

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, 58, pageW - margin, 58);

  // ── Table ─────────────────────────────────────────────────────────────────
  const holidayMap = new Map(holidays.map((h) => [h.date.split("T")[0], h.name]));

  const tableRows = entries.map((entry) => {
    const date = new Date(entry.date);
    const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
    const dayName = DAY_NAMES[date.getUTCDay()];
    const dayTypeLabel = DAY_TYPE_LABELS[entry.dayType];

    // Holiday name tooltip
    const holidayName = entry.dayType === "HOLIDAY"
      ? (holidayMap.get(entry.date.split("T")[0]) ?? "")
      : "";
    const statusCell = holidayName ? `${dayTypeLabel}\n(${holidayName})` : dayTypeLabel;

    // Timeline: "10:00–19:00 | ProjectName"
    const timeline = entry.tasks.length > 0
      ? entry.tasks.map((t) => {
          const proj = t.project ? ` [${t.project.name}]` : "";
          const lrn  = (t.project?.isLearning || t.isLearning) ? " [Lrn]" : "";
          return `${t.startTime}–${t.endTime}${proj}${lrn}`;
        }).join("\n")
      : "—";

    // Net hours
    const taskMins = entry.tasks.reduce((acc, t) => acc + calcNetMinutes(t.startTime, t.endTime, 0), 0);
    const net = Math.max(0, taskMins - (entry.breakMinutes || 0));
    const hoursCell = net > 0
      ? `${formatHours(net)}${entry.breakMinutes ? `\n(${entry.breakMinutes}m break)` : ""}`
      : "—";

    // Activity
    const activity = entry.tasks.length > 0
      ? entry.tasks.map((t) => {
          const desc = t.description ? `\n  ${t.description}` : "";
          return `• ${t.subject}${desc}`;
        }).join("\n")
      : "—";

    // Links: Show only labels with professional styling
    const links = entry.tasks.flatMap((t) => t.links ?? []);
    const linksCell = links.length > 0
      ? links.map((l) => l.label || "Link").join("\n")
      : "—";

    return [dateStr, dayName, statusCell, timeline, hoursCell, activity, linksCell];
  });

  autoTable(doc, {
    startY: 61,
    head: [["Date", "Day", "Status", "Timeline", "Hours", "Activity & Projects", "Documentation"]],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineColor: COLORS.border,
      lineWidth: 0.1,
      textColor: COLORS.dark,
      font: "helvetica",
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "center", fontStyle: "bold" }, // Date
      1: { cellWidth: 14, halign: "center", textColor: COLORS.muted }, // Day
      2: { cellWidth: 24 }, // Status
      3: { cellWidth: 42 }, // Timeline
      4: { cellWidth: 22, halign: "center", fontStyle: "bold" }, // Hours
      5: { cellWidth: "auto" }, // Activity
      6: { cellWidth: 40, textColor: COLORS.primary, fontStyle: "bold" }, // Documentation (Links)
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const entry = entries[data.row.index];
        if (entry) {
          data.cell.styles.fillColor = getRowBg(entry.dayType);
        }
        // If it's the documentation column and has content, make it look like a link
        if (data.column.index === 6 && data.cell.text[0] !== "—") {
          data.cell.styles.textColor = COLORS.primary;
        }
      }
    },
    didDrawCell: (data) => {
      // Add actual clickable links to the PDF
      if (data.section === "body" && data.column.index === 6 && data.cell.text[0] !== "—") {
        const entry = entries[data.row.index];
        const links = entry.tasks.flatMap((t) => t.links ?? []);
        if (links.length > 0) {
          // For simplicity, we link the whole cell to the first one if multiple exist
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: links[0].url });
        }
      }
    },
    alternateRowStyles: { fillColor: undefined },
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${fullName}  ·  ${monthName} ${year}  ·  Generated ${new Date().toLocaleDateString("en-IN")}`,
      margin,
      pageH - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, pageH - 9, pageW - margin, pageH - 9);
  }

  doc.save(filename);
}
