"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarDays, MessageSquare, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { Badge, PriorityBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { employeeName } from "@/lib/data/queries";
import type { Task, TaskStatus } from "@/types";

const COLUMNS: TaskStatus[] = ["todo", "inProgress", "review", "done"];
const columnAccent: Record<TaskStatus, string> = {
  todo: "var(--text-muted)",
  inProgress: "var(--info)",
  review: "var(--warning)",
  done: "var(--success)",
};

function TaskCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const { t, locale } = useI18n();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : { ...listeners, ...attributes })}
      className={cn(
        "cursor-grab rounded-xl border border-border bg-surface p-3.5 shadow-soft transition-shadow select-none",
        overlay ? "rotate-2 shadow-pop" : "hover:shadow-pop",
        isDragging && !overlay && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-[13px] leading-snug font-semibold", task.status === "done" ? "text-ink-3 line-through" : "text-ink")}>
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <Badge key={label} tone="neutral">{label}</Badge>
          ))}
        </div>
      ) : null}
      {task.subtasksTotal > 0 ? (
        <p className="mt-2 text-[11px] text-ink-3 tabular-nums">
          {formatNumber(task.subtasksDone, locale)}/{formatNumber(task.subtasksTotal, locale)} {t("tasks.subtasks")}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between">
        <Avatar name={employeeName(task.assigneeId)} size="sm" />
        <span className="flex items-center gap-2.5 text-[11px] text-ink-3 tabular-nums">
          {task.comments > 0 ? (
            <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{formatNumber(task.comments, locale)}</span>
          ) : null}
          {task.attachments > 0 ? (
            <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{formatNumber(task.attachments, locale)}</span>
          ) : null}
          <span className="flex items-center gap-0.5">
            <CalendarDays className="h-3 w-3" />
            {formatDate(task.dueDate, locale, { day: "numeric", month: "short" })}
          </span>
        </span>
      </div>
    </div>
  );
}

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { t, locale } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-64 w-72 shrink-0 flex-col rounded-2xl bg-surface-2/60 p-3 transition-colors",
        isOver && "bg-accent/8 ring-2 ring-accent/40",
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: columnAccent[status] }} />
        <p className="text-xs font-bold text-ink">{t(`status.${status}`)}</p>
        <span className="ms-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-ink-3 tabular-nums">
          {formatNumber(tasks.length, locale)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ tasks, onMove }: { tasks: Task[]; onMove: (taskId: string, status: TaskStatus) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const over = event.over?.id;
    if (over && COLUMNS.includes(over as TaskStatus)) {
      onMove(String(event.active.id), over as TaskStatus);
    }
  }

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <Column key={status} status={status} tasks={tasks.filter((task) => task.status === status)} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
