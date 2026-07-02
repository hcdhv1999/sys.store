"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CheckSquare, Kanban, List, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useEmployees, useProjects, useTasks } from "@/hooks/use-data";
import { employeeName, projectName } from "@/lib/data/queries";
import { KanbanBoard } from "@/features/tasks/kanban";
import { TaskFormDialog } from "@/features/tasks/task-form";
import { cn } from "@/lib/utils";
import type { Priority, Task, TaskStatus } from "@/types";

const columnHelper = createColumnHelper<Task>();

type View = "kanban" | "list" | "calendar";

export default function TasksPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("kanban");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [formOpen, setFormOpen] = useState(false);

  // Local board state seeded from the repository (optimistic updates on drag).
  useEffect(() => {
    if (!isLoading && !hydrated) {
      setTasks(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (assignee === "all" || task.assigneeId === assignee) &&
          (priority === "all" || task.priority === priority),
      ),
    [tasks, assignee, priority],
  );

  function moveTask(taskId: string, status: TaskStatus) {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
    toast(`${t("common.updated")}: ${t(`status.${status}`)}`, "info");
  }

  const columns = useMemo<ColumnDef<Task, unknown>[]>(
    () =>
      [
        columnHelper.accessor("title", {
          header: t("common.name"),
          cell: (info) => (
            <span>
              <span className="block max-w-72 truncate font-semibold text-ink">{info.getValue()}</span>
              <span className="block text-xs text-ink-3">{projectName(info.row.original.projectId)}</span>
            </span>
          ),
        }),
        columnHelper.accessor((row) => employeeName(row.assigneeId), {
          id: "assignee",
          header: t("common.assignee"),
          cell: (info) => (
            <span className="flex items-center gap-2 text-ink-2">
              <Avatar name={info.getValue() as string} size="sm" />
              {info.getValue() as string}
            </span>
          ),
        }),
        columnHelper.accessor("dueDate", {
          header: t("common.dueDate"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("labels", {
          header: t("tasks.labels"),
          enableSorting: false,
          cell: (info) => (
            <span className="flex gap-1">
              {(info.getValue() as string[]).slice(0, 2).map((label) => (
                <Badge key={label} tone="neutral">{label}</Badge>
              ))}
            </span>
          ),
        }),
        columnHelper.accessor("priority", { header: t("common.priority"), cell: (info) => <PriorityBadge priority={info.getValue()} /> }),
        columnHelper.accessor("status", { header: t("common.status"), cell: (info) => <StatusBadge status={info.getValue()} /> }),
      ] as ColumnDef<Task, unknown>[],
    [t, locale],
  );

  const views: { id: View; icon: typeof Kanban; label: string }[] = [
    { id: "kanban", icon: Kanban, label: t("tasks.kanban") },
    { id: "list", icon: List, label: t("tasks.listView") },
    { id: "calendar", icon: CalendarDays, label: t("tasks.calendarView") },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("tasks.title")}
        subtitle={t("tasks.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("tasks.addTask")}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                view === v.id ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink",
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-44" aria-label={t("common.assignee")}>
            <option value="all">{t("common.assignee")}: {t("common.all")}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as "all" | Priority)} className="w-40" aria-label={t("common.priority")}>
            <option value="all">{t("common.priority")}: {t("common.all")}</option>
            {(["urgent", "high", "medium", "low"] as const).map((p) => (
              <option key={p} value={p}>{t(`priority.${p}`)}</option>
            ))}
          </Select>
        </div>
      </div>

      {!hydrated ? (
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-72" />
          ))}
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard tasks={filtered} onMove={moveTask} />
      ) : view === "list" ? (
        <Card>
          <DataTable data={filtered} columns={columns} pageSize={12} />
        </Card>
      ) : (
        <TasksMonthGrid tasks={filtered} />
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projects={projects}
        employees={employees}
        onCreate={(task) => {
          setTasks((prev) => [task, ...prev]);
          toast(`${t("tasks.addTask")} ✓`);
        }}
      />
    </div>
  );
}

/** July 2026 month grid with tasks pinned to their due dates. */
function TasksMonthGrid({ tasks }: { tasks: Task[] }) {
  const { t, locale } = useI18n();
  const year = 2026;
  const month = 6; // July (0-based)
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startOffset = first.getUTCDay(); // 0 = Sunday
  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 5, 28 + i)).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { weekday: "short" }),
  );

  const monthTitle = first.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { month: "long", year: "numeric" });

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <CheckSquare className="h-4 w-4 text-accent" />
          {monthTitle}
        </p>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-surface-2/60 text-center text-[10px] font-bold text-ink-3 uppercase">
        {dayNames.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const iso = day ? `2026-07-${String(day).padStart(2, "0")}` : "";
          const dayTasks = day ? tasks.filter((task) => task.dueDate === iso) : [];
          return (
            <div key={i} className={cn("min-h-24 border-b border-e border-border/60 p-1.5", !day && "bg-surface-2/40")}>
              {day ? (
                <>
                  <p className={cn("mb-1 text-[11px] font-bold tabular-nums", iso === "2026-07-02" ? "text-accent" : "text-ink-3")}>
                    {formatNumber(day, locale)}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <p
                        key={task.id}
                        title={task.title}
                        className={cn(
                          "truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          task.priority === "urgent" ? "bg-danger-bg text-danger" : task.priority === "high" ? "bg-warning-bg text-warning" : "bg-info-bg text-info",
                        )}
                      >
                        {task.title}
                      </p>
                    ))}
                    {dayTasks.length > 3 ? <p className="px-1 text-[9px] text-ink-3">+{dayTasks.length - 3}</p> : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="px-5 py-3 text-[11px] text-ink-3">{t("tasks.subtitle")}</p>
    </Card>
  );
}
