"use client";

// Dashboard "Today" widget (Phase 5.5 §5). Reads the same unified calendar
// feed as the calendar page (real events + real tasks), so the numbers always
// match. Tenant-scoped via the underlying RLS-filtered queries.

import Link from "next/link";
import { AlarmClock, CalendarClock, CheckCircle2, ChevronLeft, Clock, Truck, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useCalendarItems } from "@/features/calendar/use-calendar-items";
import { EVENT_TYPES } from "@/lib/calendar/event-types";
import { cn } from "@/lib/utils";

export function TodayWidget() {
  const { t, locale } = useI18n();
  const { items, today, isLoading } = useCalendarItems();

  const todays = items.filter((i) => i.date === today).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const upcoming = items.filter((i) => i.date > today && !i.done).length;
  const late = items.filter((i) => i.late).length;
  const completedToday = todays.filter((i) => i.done).length;
  const future = items.filter((i) => i.date >= today && !i.done);
  const nextMeeting = future.filter((i) => i.type === "meeting").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const nextDelivery = future.filter((i) => i.type === "store" || i.type === "design").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  const stats = [
    { icon: CalendarClock, label: t("calendar.todaySchedule"), value: todays.length },
    { icon: Clock, label: t("calendar.upcoming"), value: upcoming },
    { icon: AlarmClock, label: t("calendar.late"), value: late, danger: true },
    { icon: CheckCircle2, label: t("calendar.completed"), value: completedToday },
  ];

  return (
    <Card>
      <CardHeader
        title={t("calendar.todaySchedule")}
        subtitle={formatDate(today, locale, { weekday: "long", day: "numeric", month: "long" })}
        action={<Link href="/calendar" className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover">{t("calendar.title")}<ChevronLeft className="h-3.5 w-3.5 ltr:rotate-180" /></Link>}
      />
      <CardBody className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-surface-2 p-3 text-center">
              <s.icon className={cn("mx-auto h-4 w-4", s.danger && s.value > 0 ? "text-danger" : "text-accent")} />
              <p className={cn("mt-1 text-lg font-bold tabular-nums", s.danger && s.value > 0 ? "text-danger" : "text-ink")}>{formatNumber(s.value, locale)}</p>
              <p className="text-[10px] text-ink-3">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <NextRow icon={Users} label={t("calendar.nextMeeting")} title={nextMeeting?.title} when={nextMeeting ? formatDate(nextMeeting.date, locale, { day: "numeric", month: "short" }) : undefined} empty={t("calendar.nothingToday")} />
          <NextRow icon={Truck} label={t("calendar.nextDelivery")} title={nextDelivery?.title} when={nextDelivery ? formatDate(nextDelivery.date, locale, { day: "numeric", month: "short" }) : undefined} empty={t("calendar.nothingToday")} />
        </div>

        {!isLoading && todays.length > 0 ? (
          <ul className="space-y-1.5">
            {todays.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-xs">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", EVENT_TYPES[i.type].dot)} />
                {i.time ? <span className="tabular-nums text-ink-3">{i.time}</span> : null}
                <span className={cn("truncate text-ink-2", i.done && "text-ink-3 line-through")}>{i.title}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}

function NextRow({ icon: Icon, label, title, when, empty }: { icon: typeof Users; label: string; title?: string; when?: string; empty: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border p-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-ink-3 uppercase">{label}</p>
        <p className="truncate text-xs font-semibold text-ink">{title ?? empty}</p>
        {when ? <p className="text-[10px] text-ink-3 tabular-nums">{when}</p> : null}
      </div>
    </div>
  );
}
