"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaInverted = false,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  /** percent change vs previous period */
  delta?: number;
  /** for costs: a decrease is good */
  deltaInverted?: boolean;
  hint?: string;
}) {
  const { t, locale } = useI18n();
  const positive = delta !== undefined && (deltaInverted ? delta < 0 : delta > 0);

  return (
    <Card className="p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-ink-2">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary dark:bg-primary/15">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
      {delta !== undefined ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 font-bold tabular-nums", positive ? "text-success" : "text-danger")}>
            {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {formatNumber(Math.abs(delta), locale, 1)}%
          </span>
          <span className="text-ink-3">{t("common.vsLastMonth")}</span>
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-ink-3">{hint}</p>
      ) : null}
    </Card>
  );
}
