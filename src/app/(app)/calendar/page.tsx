"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { CalendarPlus, ChevronLeft, ChevronRight, CheckCircle2, Clock, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DataError } from "@/components/ui/data-error";
import { useToast } from "@/components/ui/toast";
import { useClients, useEmployees, useProjects } from "@/hooks/use-data";
import { useCreateEvent, useUpdateEvent, useUpdateTask } from "@/hooks/use-mutations";
import { useCalendarItems, taskIdOf, todayISO, type CalendarItem } from "@/features/calendar/use-calendar-items";
import { CALENDAR_TYPES, EVENT_TYPES, DONE_CHIP, DONE_DOT, LATE_CHIP, LATE_DOT, type CalendarType } from "@/lib/calendar/event-types";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n/en";

function chipClass(item: CalendarItem): string {
  if (item.done) return DONE_CHIP;
  if (item.late) return LATE_CHIP;
  return EVENT_TYPES[item.type].chip;
}
function dotClass(item: CalendarItem): string {
  if (item.done) return DONE_DOT;
  if (item.late) return LATE_DOT;
  return EVENT_TYPES[item.type].dot;
}

function ItemChip({ item }: { item: CalendarItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <p
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={item.title}
      className={cn("cursor-grab truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold select-none", chipClass(item), isDragging && "opacity-40")}
    >
      {item.time ? `${item.time} · ` : ""}{item.title}
    </p>
  );
}

function DayCell({ day, iso, items, selected, isToday, onSelect }: {
  day: number | null;
  iso: string;
  items: CalendarItem[];
  selected: boolean;
  isToday: boolean;
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
          <p className={cn("mb-1 text-[11px] font-bold tabular-nums", isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" : "text-ink-3")}>
            {formatNumber(day, locale)}
          </p>
          <div className="space-y-1">
            {items.slice(0, 4).map((item) => <ItemChip key={item.id} item={item} />)}
            {items.length > 4 ? <p className="px-1 text-[9px] font-semibold text-ink-3">+{formatNumber(items.length - 4, locale)}</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

const eventSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["store", "design", "meeting", "campaign", "invoice", "quotation", "reminder", "task"]),
  clientId: z.string(),
  projectId: z.string(),
  assigneeId: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  date: z.string().min(8),
  time: z.string(),
  durationMin: z.coerce.number().min(0),
  reminder: z.enum(["none", "onTime", "min30", "hour1", "hour2", "day1"]),
  notes: z.string(),
});
type EventForm = z.infer<typeof eventSchema>;

const KIND_FOR_TYPE: Record<CalendarType, "meeting" | "deadline" | "launch" | "internal"> = {
  meeting: "meeting", campaign: "launch", store: "launch", design: "deadline",
  invoice: "deadline", quotation: "deadline", reminder: "deadline", task: "internal",
};

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const { items, isLoading, isError, error } = useCalendarItems();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const updateTask = useUpdateTask();

  const today = todayISO(); // real current date, no hardcoded reference
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(today);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fType, setFType] = useState<"all" | CalendarType>("all");
  const [fClient, setFClient] = useState("all");
  const [fProject, setFProject] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const clientName = (id: string | null) => (id && clients.find((c) => c.id === id)?.name) || "—";
  const projectName = (id: string | null) => (id && projects.find((p) => p.id === id)?.name) || "—";
  const employeeName = (id: string | null) => (id && employees.find((e) => e.id === id)?.name) || t("tasks.unassigned");

  // § FILTERS + SEARCH
  const filtered = useMemo(() => {
    const q = query.trim();
    return items.filter((it) =>
      (fType === "all" || it.type === fType) &&
      (fClient === "all" || it.clientId === fClient) &&
      (fProject === "all" || it.projectId === fProject) &&
      (fAssignee === "all" || it.assigneeId === fAssignee) &&
      (q === "" || it.title.includes(q)),
    );
  }, [items, query, fType, fClient, fProject, fAssignee]);

  const year = Number(today.slice(0, 4));
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

  const itemsByDay = (iso: string) => filtered.filter((it) => it.date === iso);
  const dayItems = itemsByDay(selectedDay).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  // § WEEK BAR — 7 days of the week containing the selected day.
  const weekDays = useMemo(() => {
    const base = new Date(`${selectedDay}T00:00:00Z`);
    const start = new Date(base);
    start.setUTCDate(base.getUTCDate() - base.getUTCDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [selectedDay]);

  function reschedule(id: string, targetIso: string) {
    const item = items.find((it) => it.id === id);
    if (!item || item.date === targetIso) return;
    if (item.source === "task") {
      const tid = taskIdOf(item);
      if (tid) updateTask.mutate({ id: tid, patch: { dueDate: targetIso } }, { onError: () => toast(t("data.saveFailed"), "error") });
    } else {
      updateEvent.mutate({ id, patch: { date: targetIso } }, { onError: () => toast(t("data.saveFailed"), "error") });
    }
    toast(`${t("common.updated")}: ${formatDate(targetIso, locale)}`, "info");
  }
  function handleDragEnd(e: DragEndEvent) {
    const targetIso = e.over?.id;
    if (typeof targetIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(targetIso)) reschedule(String(e.active.id), targetIso);
  }

  function markDone(item: CalendarItem) {
    const tid = taskIdOf(item);
    if (tid) updateTask.mutate({ id: tid, patch: { status: "done" } }, { onError: () => toast(t("data.saveFailed"), "error") });
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { type: "meeting", priority: "medium", clientId: "", projectId: "", assigneeId: "", date: selectedDay, time: "10:00", durationMin: 30, reminder: "hour1", notes: "" },
  });

  const onCreate = handleSubmit((values) => {
    createEvent.mutate(
      {
        title: values.title,
        kind: KIND_FOR_TYPE[values.type],
        type: values.type,
        date: values.date,
        time: values.time,
        durationMin: values.durationMin,
        clientId: values.clientId || null,
        projectId: values.projectId || null,
        assigneeId: values.assigneeId || null,
        priority: values.priority,
        reminder: values.reminder,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => { toast(`${t("calendar.newEvent")} ✓`); setFormOpen(false); reset(); },
        onError: (err) => toast(err instanceof Error ? err.message : t("data.saveFailed"), "error"),
      },
    );
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("calendar.title")}
        subtitle={t("calendar.subtitle")}
        actions={<Button variant="accent" onClick={() => setFormOpen(true)}><CalendarPlus className="h-4 w-4" />{t("calendar.newEvent")}</Button>}
      />

      {/* § WEEK BAR */}
      <div className="mb-4 grid grid-cols-7 gap-2">
        {weekDays.map((iso) => {
          const dayNum = Number(iso.slice(8, 10));
          const count = itemsByDay(iso).length;
          const types = [...new Set(itemsByDay(iso).map((i) => (i.done ? "done" : i.late ? "late" : i.type)))].slice(0, 4);
          const isToday = iso === today;
          const isSel = iso === selectedDay;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDay(iso)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors",
                isSel ? "border-accent bg-accent/8" : "border-border hover:bg-surface-2",
              )}
            >
              <span className="text-[10px] font-semibold text-ink-3 uppercase">
                {new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar" : "en-US", { weekday: "short" })}
              </span>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums", isToday ? "bg-accent text-white" : "text-ink")}>
                {formatNumber(dayNum, locale)}
              </span>
              <span className="text-[10px] font-semibold text-ink-2 tabular-nums">{count > 0 ? count : "—"}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                {types.map((tp) => (
                  <span key={tp} className={cn("h-1.5 w-1.5 rounded-full", tp === "done" ? DONE_DOT : tp === "late" ? LATE_DOT : EVENT_TYPES[tp as CalendarType].dot)} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* § FILTERS + SEARCH */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto h-3.5 w-3.5 text-ink-3" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="w-48 ps-8" />
        </span>
        <Select value={fType} onChange={(e) => setFType(e.target.value as "all" | CalendarType)} className="w-36" aria-label={t("calendar.filterType")}>
          <option value="all">{t("calendar.filterType")}</option>
          {CALENDAR_TYPES.map((tp) => <option key={tp} value={tp}>{t(EVENT_TYPES[tp].labelKey)}</option>)}
        </Select>
        <Select value={fClient} onChange={(e) => setFClient(e.target.value)} className="w-40" aria-label={t("common.client")}>
          <option value="all">{t("common.client")}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={fProject} onChange={(e) => setFProject(e.target.value)} className="w-40" aria-label={t("common.project")}>
          <option value="all">{t("common.project")}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className="w-40" aria-label={t("common.assignee")}>
          <option value="all">{t("common.assignee")}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        {(query || fType !== "all" || fClient !== "all" || fProject !== "all" || fAssignee !== "all") ? (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setFType("all"); setFClient("all"); setFProject("all"); setFAssignee("all"); }}>
            <X className="h-3.5 w-3.5" />{t("common.clear")}
          </Button>
        ) : null}
      </div>

      {isError ? (
        <DataError error={error} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {/* § MONTH VIEW */}
          <Card className="overflow-hidden xl:col-span-3">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-sm font-bold text-ink">{monthTitle}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setMonthIndex((m) => Math.max(0, m - 1))} aria-label={t("common.previous")}>
                  <ChevronRight className="h-4 w-4 ltr:rotate-180" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setMonthIndex(new Date().getMonth()); setSelectedDay(today); }}>{t("common.today")}</Button>
                <Button variant="ghost" size="icon" onClick={() => setMonthIndex((m) => Math.min(11, m + 1))} aria-label={t("common.next")}>
                  <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-surface-2/60 text-center text-[10px] font-bold text-ink-3 uppercase">
              {dayNames.map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            {isLoading ? (
              <div className="p-4"><Skeleton className="h-80" /></div>
            ) : (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-7">
                  {cells.map((day, i) => {
                    const iso = day ? isoOf(day) : "";
                    return (
                      <DayCell key={i} day={day} iso={iso} items={day ? itemsByDay(iso) : []} selected={Boolean(day) && iso === selectedDay} isToday={iso === today} onSelect={setSelectedDay} />
                    );
                  })}
                </div>
              </DndContext>
            )}
          </Card>

          {/* § DAY PANEL */}
          <Card className="h-fit">
            <CardHeader title={t("calendar.agendaFor")} subtitle={formatDate(selectedDay, locale, { weekday: "long", day: "numeric", month: "long" })} />
            <CardBody className="space-y-3 p-4">
              {dayItems.length === 0 ? (
                <EmptyState title={t("calendar.noEvents")} hint={t("notif.emptyHint")} />
              ) : (
                dayItems.map((item) => {
                  const meta = EVENT_TYPES[item.type];
                  return (
                    <div key={item.id} className="rounded-xl border border-border p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-semibold text-ink", item.done && "text-ink-3 line-through")}>{item.title}</p>
                        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", chipClass(item))}>
                          <meta.icon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                        {item.time ? <span className="flex items-center gap-1 tabular-nums"><Clock className="h-3.5 w-3.5" />{item.time}</span> : null}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.chip)}>{t(meta.labelKey)}</span>
                        {item.priority ? <PriorityBadge priority={item.priority as never} /> : null}
                      </div>
                      {item.clientId ? <p className="mt-1 text-xs text-ink-3">{t("common.client")}: {clientName(item.clientId)}</p> : null}
                      {item.projectId ? <p className="text-xs text-ink-3">{t("common.project")}: {projectName(item.projectId)}</p> : null}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-ink-2">
                          <Avatar name={employeeName(item.assigneeId)} size="sm" />{employeeName(item.assigneeId)}
                        </span>
                        {item.source === "task" ? (
                          <span className="flex gap-1">
                            {!item.done ? (
                              <Button variant="ghost" size="sm" onClick={() => markDone(item)} title={t("calendar.markComplete")}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm" onClick={() => router.push(`/tasks?task=${taskIdOf(item)}`)}>{t("calendar.openTask")}</Button>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="outline" className="w-full" onClick={() => { setFormOpen(true); }}>
                <CalendarPlus className="h-4 w-4" />{t("calendar.newEvent")}
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* § TASK / EVENT CREATION */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("calendar.newEvent")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting || createEvent.isPending}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t("common.name")} error={errors.title && t("common.invalidValue")} className="sm:col-span-2">
            <Input autoFocus {...register("title")} />
          </Field>
          <Field label={t("calendar.eventType")}>
            <Select {...register("type")}>
              {CALENDAR_TYPES.map((tp) => <option key={tp} value={tp}>{t(EVENT_TYPES[tp].labelKey)}</option>)}
            </Select>
          </Field>
          <Field label={t("common.priority")}>
            <Select {...register("priority")}>
              {(["low", "medium", "high", "urgent"] as const).map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
            </Select>
          </Field>
          <Field label={t("common.client")}>
            <Select {...register("clientId")}><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </Field>
          <Field label={t("common.project")}>
            <Select {...register("projectId")}><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          </Field>
          <Field label={t("common.assignee")}>
            <Select {...register("assigneeId")}><option value="">{t("tasks.unassigned")}</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
          </Field>
          <Field label={t("calendar.reminder")}>
            <Select {...register("reminder")}>
              {(["none", "onTime", "min30", "hour1", "hour2", "day1"] as const).map((r) => <option key={r} value={r}>{t(`calendar.remind.${r}` as MessageKey)}</option>)}
            </Select>
          </Field>
          <Field label={t("common.date")} error={errors.date && t("common.invalidValue")}>
            <Input type="date" dir="ltr" {...register("date")} />
          </Field>
          <Field label={t("calendar.time")}>
            <Input type="time" dir="ltr" {...register("time")} />
          </Field>
          <Field label={t("common.description")} className="sm:col-span-2">
            <Textarea rows={2} {...register("notes")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
