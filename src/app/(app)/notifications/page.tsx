"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Briefcase, CheckCheck, Megaphone, Receipt, Server, SquareCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const kindMeta: Record<AppNotification["kind"], { icon: typeof Bell; className: string }> = {
  invoice: { icon: Receipt, className: "bg-warning-bg text-warning" },
  task: { icon: SquareCheck, className: "bg-info-bg text-info" },
  project: { icon: Briefcase, className: "bg-accent/12 text-accent" },
  campaign: { icon: Megaphone, className: "bg-success-bg text-success" },
  system: { icon: Server, className: "bg-surface-2 text-ink-2" },
};

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const { data: fetched, isLoading } = useNotifications();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setItems(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const unreadCount = items.filter((n) => !n.read).length;
  const visible = filter === "all" ? items : items.filter((n) => !n.read);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        title={t("notif.title")}
        subtitle={t("notif.subtitle")}
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" />
            {t("notif.markAllRead")}
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-1 rounded-xl bg-surface-2 p-1 w-fit">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              filter === f ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink",
            )}
          >
            {f === "all" ? t("common.all") : `${t("notif.unread")} (${unreadCount})`}
          </button>
        ))}
      </div>

      <Card>
        {!hydrated ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={BellOff} title={t("notif.empty")} hint={t("notif.emptyHint")} />
        ) : (
          <ul>
            {visible.map((n) => {
              const meta = kindMeta[n.kind];
              return (
                <li key={n.id} className="border-b border-border/60 last:border-0">
                  <Link
                    href={n.href}
                    onClick={() => markRead(n.id)}
                    className={cn("flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60", !n.read && "bg-accent/5")}
                  >
                    <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.className)}>
                      <meta.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
                        <span className="truncate text-sm font-bold text-ink">{n.title}</span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-ink-3">{relativeTime(n.createdAt, locale)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
