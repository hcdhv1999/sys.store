"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent/12 text-accent",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

// Central mapping so every module colors statuses identically.
const statusTone: Record<string, Tone> = {
  active: "success", live: "success", paid: "success", approved: "success", done: "success",
  completed: "success", present: "success", launched: "success",
  inProgress: "info", sent: "info", review: "info", remote: "info", planning: "info",
  development: "info", partial: "info",
  pending: "warning", onHold: "warning", paused: "warning", draft: "neutral", lead: "accent",
  maintenance: "warning", onLeave: "warning", todo: "neutral",
  overdue: "danger", rejected: "danger", expired: "danger", inactive: "neutral", archived: "neutral",
};

const priorityTone: Record<string, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return <Badge tone={statusTone[status] ?? "neutral"}>{t(`status.${status}` as MessageKey)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useI18n();
  return <Badge tone={priorityTone[priority] ?? "neutral"}>{t(`priority.${priority}` as MessageKey)}</Badge>;
}
