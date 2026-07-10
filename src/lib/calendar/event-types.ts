// Calendar event-type + smart-color system (Phase 5.5).
// One source of truth for the type taxonomy, icons and colors used by the
// week bar, month grid, day panel and the dashboard "Today" widget. Colors are
// theme-aware (dark-mode safe) and reuse the design-system tokens where a
// semantic one exists, falling back to the Tailwind palette otherwise.

import { Boxes, Brush, CalendarDays, FileText, Megaphone, ReceiptText, Users, Bell } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/en";

export type CalendarType =
  | "store"
  | "design"
  | "meeting"
  | "campaign"
  | "invoice"
  | "quotation"
  | "reminder"
  | "task";

export interface TypeMeta {
  icon: typeof CalendarDays;
  labelKey: MessageKey;
  /** chip background + text (list rows, badges) */
  chip: string;
  /** solid dot / bar color (month grid, timeline) */
  dot: string;
}

// § SMART COLORS — store=green, design=orange, meeting=blue, campaign=purple,
// invoice=yellow, quotation=teal, reminder=sky, general task=neutral.
export const EVENT_TYPES: Record<CalendarType, TypeMeta> = {
  store: { icon: Boxes, labelKey: "calendar.type.store", chip: "bg-success-bg text-success", dot: "bg-success" },
  design: { icon: Brush, labelKey: "calendar.type.design", chip: "bg-accent/12 text-accent", dot: "bg-accent" },
  meeting: { icon: Users, labelKey: "calendar.type.meeting", chip: "bg-info-bg text-info", dot: "bg-info" },
  campaign: { icon: Megaphone, labelKey: "calendar.type.campaign", chip: "bg-purple-500/12 text-purple-600 dark:text-purple-300", dot: "bg-purple-500" },
  invoice: { icon: ReceiptText, labelKey: "calendar.type.invoice", chip: "bg-warning-bg text-warning", dot: "bg-warning" },
  quotation: { icon: FileText, labelKey: "calendar.type.quotation", chip: "bg-teal-500/12 text-teal-600 dark:text-teal-300", dot: "bg-teal-500" },
  reminder: { icon: Bell, labelKey: "calendar.type.reminder", chip: "bg-sky-500/12 text-sky-600 dark:text-sky-300", dot: "bg-sky-500" },
  task: { icon: CalendarDays, labelKey: "calendar.type.task", chip: "bg-surface-2 text-ink-2", dot: "bg-ink-3" },
};

export const CALENDAR_TYPES = Object.keys(EVENT_TYPES) as CalendarType[];

// Status overrides win over type color: late = red, completed = gray.
export const LATE_CHIP = "bg-danger-bg text-danger";
export const LATE_DOT = "bg-danger";
export const DONE_CHIP = "bg-surface-2 text-ink-3 line-through";
export const DONE_DOT = "bg-ink-3";

/** Map the legacy events.kind enum onto the richer calendar type taxonomy. */
export function typeFromKind(kind: string): CalendarType {
  switch (kind) {
    case "meeting": return "meeting";
    case "launch": return "campaign";
    case "deadline": return "reminder";
    default: return "task";
  }
}

/** Reminder lead times (§9). Architecture allows push/email delivery later. */
export const REMINDER_OPTIONS = ["none", "onTime", "min30", "hour1", "hour2", "day1"] as const;
export type ReminderLead = (typeof REMINDER_OPTIONS)[number];
