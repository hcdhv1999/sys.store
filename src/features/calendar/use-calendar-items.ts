"use client";

// Unified calendar feed (Phase 5.5). Merges real `events` rows with items
// derived from real `tasks` (their due dates) into one timeline. Task items are
// derived at read time — no duplicate rows are written to the database, so
// "automatic events from tasks" never desynchronizes. Everything is tenant-
// scoped already because the underlying queries are RLS-filtered.

import { useMemo } from "react";
import { useEvents, useTasks } from "@/hooks/use-data";
import { TODAY, isOverdue } from "@/lib/data/queries";
import { typeFromKind, type CalendarType } from "@/lib/calendar/event-types";

export interface CalendarItem {
  id: string;
  source: "event" | "task";
  type: CalendarType;
  title: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm or ""
  clientId: string | null;
  projectId: string | null;
  assigneeId: string | null;
  priority?: string;
  done: boolean;
  late: boolean;
}

export function useCalendarItems() {
  const { data: events, isLoading: le, isError: ee, error: eerr } = useEvents();
  const { data: tasks, isLoading: lt, isError: te, error: terr } = useTasks();

  const items = useMemo<CalendarItem[]>(() => {
    const fromEvents: CalendarItem[] = events.map((e) => ({
      id: e.id,
      source: "event",
      type: (e.type as CalendarType) || typeFromKind(e.kind),
      title: e.title,
      date: e.date,
      time: e.time || "",
      clientId: e.relatedClientId ?? null,
      projectId: e.projectId ?? null,
      assigneeId: e.assigneeId ?? null,
      priority: e.priority,
      done: e.status === "done",
      late: false,
    }));

    const fromTasks: CalendarItem[] = tasks
      .filter((tk) => tk.dueDate && tk.status !== "cancelled")
      .map((tk) => ({
        id: `task-${tk.id}`,
        source: "task",
        type: "task",
        title: tk.title,
        date: tk.dueDate,
        time: "",
        clientId: tk.clientId ?? null,
        projectId: tk.projectId ?? null,
        assigneeId: tk.assigneeId || null,
        priority: tk.priority,
        done: tk.status === "done",
        late: isOverdue(tk),
      }));

    return [...fromEvents, ...fromTasks];
  }, [events, tasks]);

  return {
    items,
    isLoading: le || lt,
    isError: ee || te,
    error: eerr ?? terr,
    today: TODAY,
  };
}

/** The real task id behind a derived calendar item (for "open task"). */
export function taskIdOf(item: CalendarItem): string | null {
  return item.source === "task" ? item.id.replace(/^task-/, "") : null;
}
