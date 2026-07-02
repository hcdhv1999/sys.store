"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, Rocket, Users, Video, Flag } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { AvatarGroup } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { events as seedEvents, TENANT_ID } from "@/lib/data/seed";
import { clientName, employeeName } from "@/lib/data/queries";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventKind } from "@/types";
import type { MessageKey } from "@/lib/i18n/en";

const kindMeta: Record<EventKind, { icon: typeof Video; className: string; labelKey: MessageKey }> = {
  meeting: { icon: Video, className: "bg-info-bg text-info", labelKey: "calendar.meeting" },
  deadline: { icon: Flag, className: "bg-danger-bg text-danger", labelKey: "calendar.deadlineEv" },
  launch: { icon: Rocket, className: "bg-success-bg text-success", labelKey: "calendar.launch" },
  internal: { icon: Users, className: "bg-warning-bg text-warning", labelKey: "calendar.internal" },
};

const eventSchema = z.object({
  title: z.string().min(3),
  kind: z.enum(["meeting", "deadline", "launch", "internal"]),
  date: z.string().min(8),
  time: z.string().min(4),
  durationMin: z.coerce.number().min(0),
});
type EventForm = z.infer<typeof eventSchema>;

function EventChip({ event }: { event: CalendarEvent }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: event.id });
  const meta = kindMeta[event.kind];
  return (
    <p
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={event.title}
      className={cn(
        "cursor-grab truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold select-none",
        meta.className,
        isDragging && "opacity-40",
      )}
    >
      {event.time} · {event.title}
    </p>
  );
}

function DayCell({
  day,
  iso,
  events,
  selected,
  onSelect,
}: {
  day: number | null;
  iso: string;
  events: CalendarEvent[];
  selected: boolean;
  onSelect: (iso: string) => void;
}) {
  const { locale } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: iso || `empty-${Math.random()}`, disabled: !day });

  return (
    <div
      ref={setNodeRef}
      onClick={day ? () => onSelect(iso) : undefined}
      className={cn(
        "min-h-28 cursor-pointer border-b border-e border-border/60 p-1.5 transition-colors",
        !day && "cursor-default bg-surface-2/40",
        isOver && "bg-accent/8",
        selected && "bg-accent/5 ring-2 ring-accent/50 ring-inset",
      )}
    >
      {day ? (
        <>
          <p className={cn("mb-1 text-[11px] font-bold tabular-nums", iso === "2026-07-02" ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" : "text-ink-3")}>
            {formatNumber(day, locale)}
          </p>
          <div className="space-y-1">
            {events.slice(0, 3).map((event) => (
              <EventChip key={event.id} event={event} />
            ))}
            {events.length > 3 ? <p className="px-1 text-[9px] text-ink-3">+{events.length - 3}</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents);
  const [monthIndex, setMonthIndex] = useState(6); // July 2026
  const [selectedDay, setSelectedDay] = useState("2026-07-02");
  const [formOpen, setFormOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const year = 2026;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const startOffset = first.getUTCDay();
  const cells = useMemo(() => {
    const list: (number | null)[] = [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [startOffset, daysInMonth]);

  const isoOf = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monthTitle = first.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { month: "long", year: "numeric" });
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 5, 28 + i)).toLocaleDateString(locale === "ar" ? "ar" : "en-US", { weekday: "short" }),
  );

  const dayEvents = events
    .filter((event) => event.date === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  function handleDragEnd(event: DragEndEvent) {
    const targetIso = event.over?.id;
    if (typeof targetIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(targetIso)) {
      setEvents((prev) => prev.map((ev) => (ev.id === String(event.active.id) ? { ...ev, date: targetIso } : ev)));
      toast(`${t("common.updated")}: ${formatDate(targetIso, locale)}`, "info");
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { kind: "meeting", date: selectedDay, time: "10:00", durationMin: 30 },
  });

  const onCreate = handleSubmit((values) => {
    setEvents((prev) => [
      ...prev,
      {
        id: `ev-${Date.now()}`,
        tenantId: TENANT_ID,
        title: values.title,
        kind: values.kind,
        date: values.date,
        time: values.time,
        durationMin: values.durationMin,
        attendeeIds: ["e-1"],
        relatedClientId: null,
      },
    ]);
    reset({ kind: "meeting", date: values.date, time: "10:00", durationMin: 30, title: "" });
    setFormOpen(false);
    toast(`${t("calendar.newEvent")} ✓`);
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("calendar.title")}
        subtitle={t("calendar.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <CalendarPlus className="h-4 w-4" />
            {t("calendar.newEvent")}
          </Button>
        }
      />

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(Object.keys(kindMeta) as EventKind[]).map((kind) => {
          const meta = kindMeta[kind];
          return (
            <span key={kind} className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.className)}>
              <meta.icon className="h-3 w-3" />
              {t(meta.labelKey)}
            </span>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="text-sm font-bold text-ink">{monthTitle}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMonthIndex((m) => Math.max(0, m - 1))} aria-label={t("common.previous")}>
                <ChevronRight className="h-4 w-4 ltr:rotate-180" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setMonthIndex(6); setSelectedDay("2026-07-02"); }}>
                {t("common.today")}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMonthIndex((m) => Math.min(11, m + 1))} aria-label={t("common.next")}>
                <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-border bg-surface-2/60 text-center text-[10px] font-bold text-ink-3 uppercase">
            {dayNames.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const iso = day ? isoOf(day) : "";
                return (
                  <DayCell
                    key={i}
                    day={day}
                    iso={iso}
                    events={day ? events.filter((event) => event.date === iso) : []}
                    selected={Boolean(day) && iso === selectedDay}
                    onSelect={setSelectedDay}
                  />
                );
              })}
            </div>
          </DndContext>
        </Card>

        {/* Day agenda */}
        <Card className="h-fit">
          <CardHeader title={t("calendar.agendaFor")} subtitle={formatDate(selectedDay, locale, { weekday: "long", day: "numeric", month: "long" })} />
          <CardBody className="space-y-3 p-4">
            {dayEvents.length === 0 ? (
              <EmptyState title={t("calendar.noEvents")} hint={t("notif.emptyHint")} />
            ) : (
              dayEvents.map((event) => {
                const meta = kindMeta[event.kind];
                return (
                  <div key={event.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{event.title}</p>
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                        <meta.icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-2 tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {event.time}
                      {event.durationMin > 0 ? ` · ${formatNumber(event.durationMin, locale)} ${locale === "ar" ? "دقيقة" : "min"}` : ""}
                    </p>
                    {event.relatedClientId ? (
                      <p className="mt-1 text-xs text-ink-3">{clientName(event.relatedClientId)}</p>
                    ) : null}
                    {event.attendeeIds.length > 0 ? (
                      <div className="mt-2.5">
                        <AvatarGroup names={event.attendeeIds.map(employeeName)} max={4} />
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("calendar.newEvent")}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="space-y-4" noValidate>
          <Field label={t("common.name")} error={errors.title && t("common.invalidValue")}>
            <Input {...register("title")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.status")}>
              <Select {...register("kind")}>
                {(Object.keys(kindMeta) as EventKind[]).map((kind) => (
                  <option key={kind} value={kind}>{t(kindMeta[kind].labelKey)}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.date")} error={errors.date && t("common.invalidValue")}>
              <Input type="date" dir="ltr" {...register("date")} />
            </Field>
            <Field label={locale === "ar" ? "الوقت" : "Time"} error={errors.time && t("common.invalidValue")}>
              <Input type="time" dir="ltr" {...register("time")} />
            </Field>
            <Field label={locale === "ar" ? "المدة (دقائق)" : "Duration (min)"}>
              <Input type="number" min={0} step={15} dir="ltr" {...register("durationMin")} />
            </Field>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
