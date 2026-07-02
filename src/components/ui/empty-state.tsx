"use client";

import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  hint,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-1 text-sm font-semibold text-ink">{title ?? t("common.noResults")}</p>
      <p className="max-w-xs text-xs text-ink-2">{hint ?? t("common.noResultsHint")}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
