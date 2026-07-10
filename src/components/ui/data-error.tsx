"use client";

// Production data-error surface. Shown when Supabase is not configured or
// a query fails — production never silently falls back to demo data.

import { DatabaseZap } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DataConfigError } from "@/lib/data-mode";
import { Card } from "./card";

export function DataError({ error }: { error: unknown }) {
  const { t } = useI18n();
  const isConfig = error instanceof DataConfigError;
  return (
    <Card className="border-danger/30">
      <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-bg text-danger">
          <DatabaseZap className="h-6 w-6" />
        </span>
        <p className="mt-1 text-sm font-bold text-ink">
          {isConfig ? t("data.notConfigured") : t("data.queryFailed")}
        </p>
        <p className="max-w-md text-xs leading-relaxed text-ink-2">
          {isConfig ? t("data.notConfiguredHint") : t("data.queryFailedHint")}
        </p>
        {!isConfig && error instanceof Error ? (
          <code className="mt-2 max-w-md truncate rounded-lg bg-surface-2 px-3 py-1.5 text-[11px] text-ink-3" dir="ltr">
            {error.message}
          </code>
        ) : null}
      </div>
    </Card>
  );
}
