"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { AlarmClock, CalendarClock, CalendarDays, CheckCircle2, CheckSquare, Kanban, ListChecks, List, ListTodo, Plus, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useEmployees, useProjects, useTasks } from "@/hooks/use-data";
import { clientName, employeeName, isOverdue, projectName, taskClientId, taskKpis } from "@/lib/data/queries";
import { useCreateTask, useUpdateTask } from "@/hooks/use-mutations";
import { DataError } from "@/components/ui/data-error";
import { KanbanBoard } from "@/features/tasks/kanban";
import { TaskFormDialog } from "@/features/tasks/task-form";
import { TaskDetail, type ActivityEntry } from "@/features/tasks/task-detail";
import { cn } from "@/lib/utils";
import type { Priority, Task, TaskStatus } from "@/types";

const columnHelper = createColumnHelper<Task>();
const CURRENT_USER = "e-1"; // signed-in owner (drives "My tasks")

type View = "kanban" | "list" | "calendar";

function TasksWorkspace() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const params = useSearchParams();
  // Single source of truth: the query cache. Mutations patch it optimistically
  // and invalidate on settle, so the board, list, calendar, and every other
  // page stay in sync and survive a refresh (no local task-array shadow state).
  const { data: tasks, isLoading, isError: tasksError, error: tasksErr } = useTasks();
  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();
  const { data: clients } = useClients();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [view, setView] = useState<View>("kanban");
  const [mine, setMine] = useState(false);
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [project, setProject] = useState("all");
  const [client, setClient] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  // Session activity log per task (created + moves) — real events, not mock.
  const [activityLog, setActivityLog] = useState<Record<string, ActivityEntry[]>>({});

  // Deep link from a project ("+ add task") preselects that project.
  const preselectProject = params.get("project") ?? undefined;
  useEffect(() => {
    if (preselectProject) setFormOpen(true);
  }, [preselectProject]);

  // Deep link from project/client task rows opens that task's details.
  const deepTask = params.get("task");
  useEffect(() => {
    if (deepTask && !isLoading) setDetailId(deepTask);
  }, [deepTask, isLoading]);

  const kpis = taskKpis(tasks);
  const detail = tasks.find((tk) => tk.id === detailId) ?? null;

  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!mine || task.assigneeId === CURRENT_USER) &&
          (status === "all" || task.status === status) &&
          (priority === "all" || task.priority === priority) &&
          (project === "all" || task.projectId === project) &&
          (client === "all" || taskClientId(task) === client) &&
          (assignee === "all" || task.assigneeId === assignee),
      ),
    [tasks, mine, status, priority, project, client, assignee],
  );
  // The board never shows cancelled tasks.
  const boardTasks = useMemo(() => filtered.filter((task) => task.status !== "cancelled"), [filtered]);

  const logActivity = useCallback((taskId: string, entry: ActivityEntry) => {
    setActivityLog((prev) => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), entry] }));
  }, []);

  // Optimistic status move — the mutation patches the cache and rolls back
  // on a failed Supabase write; here we only log the session event + toast.
  const moveTask = useCallback(
    (taskId: string, next: TaskStatus) => {
      const prevTask = tasks.find((tk) => tk.id === taskId);
      if (!prevTask || prevTask.status === next) return;
      logActivity(taskId, { id: `a-${Date.now()}`, actorId: CURRENT_USER, kind: "moved", status: next, at: new Date().toISOString() });
      updateTask.mutate(
        { id: taskId, patch: { status: next } },
        {
          onSuccess: () => toast(`${t("common.updated")}: ${t(`status.${next}`)}`, "info"),
          onError: () => toast(t("data.saveFailed"), "error"),
        },
      );
    },
    [tasks, logActivity, t, toast, updateTask],
  );

  // Inline detail edits — the mutation owns the optimistic patch + rollback.
  const patchTask = useCallback(
    (taskId: string, patch: Partial<Task>) => {
      const prevTask = tasks.find((tk) => tk.id === taskId);
      if (!prevTask) return;
      if (patch.status) {
        logActivity(taskId, { id: `a-${Date.now()}`, actorId: CURRENT_USER, kind: "moved", status: patch.status, at: new Date().toISOString() });
      }
      updateTask.mutate(
        { id: taskId, patch },
        { onError: () => toast(t("data.saveFailed"), "error") },
      );
    },
    [tasks, logActivity, t, toast, updateTask],
  );

  const columns = useMemo<ColumnDef<Task, unknown>[]>(
    () =>
      [
        columnHelper.accessor("title", {
          header: t("common.name"),
          cell: (info) => (
            <span className="block max-w-64 truncate font-semibold text-ink">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor((row) => projectName(row.projectId), {
          id: "project",
          header: t("common.project"),
          cell: (info) => <span className="text-ink-2">{info.getValue() as string}</span>,
        }),
        columnHelper.accessor((row) => clientName(taskClientId(row)), {
          id: "client",
          header: t("common.client"),
          cell: (info) => <span className="text-ink-2">{info.getValue() as string}</span>,
        }),
        columnHelper.accessor((row) => (row.assigneeId ? employeeName(row.assigneeId) : t("tasks.unassigned")), {
          id: "assignee",
          header: t("common.assignee"),
          cell: (info) => (
            <span className="flex items-center gap-2 text-ink-2">
              {info.row.original.assigneeId ? <Avatar name={info.getValue() as string} size="sm" /> : null}
              {info.getValue() as string}
            </span>
          ),
        }),
        columnHelper.accessor("dueDate", {
          header: t("common.dueDate"),
          cell: (info) => (
            <span className={cn("tabular-nums", isOverdue(info.row.original) ? "font-semibold text-danger" : "text-ink-2")}>
              {formatDate(info.getValue(), locale)}
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
            {t("tasks.newTask")}
          </Button>
        }
      />

      {/* Real KPIs computed from the live task set */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("tasks.total")} value={formatNumber(kpis.total, locale)} icon={ListChecks} />
        <StatCard label={t("tasks.overdue")} value={formatNumber(kpis.overdue, locale)} icon={AlarmClock} />
        <StatCard label={t("tasks.dueToday")} value={formatNumber(kpis.dueToday, locale)} icon={CalendarClock} />
        <StatCard label={t("tasks.completed")} value={formatNumber(kpis.completed, locale)} icon={CheckCircle2} />
      </div>

      {/* View switch + My tasks */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <button
          onClick={() => setMine((m) => !m)}
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
            mine ? "bg-accent/12 text-accent" : "bg-surface-2 text-ink-2 hover:text-ink",
          )}
        >
          <UserRound className="h-3.5 w-3.5" />
          {t("tasks.myTasks")}
        </button>
      </div>

      {/* Full filter row */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as "all" | TaskStatus)} className="w-36" aria-label={t("tasks.filterStatus")}>
          <option value="all">{t("tasks.filterStatus")}: {t("common.all")}</option>
          {(["todo", "inProgress", "review", "done", "cancelled"] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as "all" | Priority)} className="w-32" aria-label={t("tasks.filterPriority")}>
          <option value="all">{t("tasks.filterPriority")}: {t("common.all")}</option>
          {(["urgent", "high", "medium", "low"] as const).map((p) => (
            <option key={p} value={p}>{t(`priority.${p}`)}</option>
          ))}
        </Select>
        <Select value={project} onChange={(e) => setProject(e.target.value)} className="w-44" aria-label={t("tasks.filterProject")}>
          <option value="all">{t("tasks.filterProject")}: {t("common.all")}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-40" aria-label={t("tasks.filterClient")}>
          <option value="all">{t("tasks.filterClient")}: {t("common.all")}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-40" aria-label={t("tasks.filterAssignee")}>
          <option value="all">{t("tasks.filterAssignee")}: {t("common.all")}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>

      {tasksError ? (
        <DataError error={tasksErr} />
      ) : isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-72" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState icon={ListTodo} title={t("tasks.noTasks")} hint={t("tasks.noTasksHint")}
            action={<Button variant="accent" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />{t("tasks.newTask")}</Button>} />
        </Card>
      ) : view === "kanban" ? (
        boardTasks.length === 0 ? (
          <Card><EmptyState icon={ListTodo} /></Card>
        ) : (
          <KanbanBoard tasks={boardTasks} onMove={moveTask} onOpen={setDetailId} />
        )
      ) : view === "list" ? (
        <Card>
          <DataTable data={filtered} columns={columns} pageSize={12} onRowClick={(tk) => setDetailId(tk.id)} />
        </Card>
      ) : (
        <TasksMonthGrid tasks={filtered} onOpen={setDetailId} />
      )}

      <TaskFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projects={projects}
        employees={employees}
        clients={clients}
        defaultProjectId={preselectProject}
        submitting={createTask.isPending}
        onCreate={(input) => {
          createTask.mutate(input, {
            onSuccess: (task) => {
              logActivity(task.id, { id: `a-${Date.now()}`, actorId: task.creatorId ?? CURRENT_USER, kind: "created", at: new Date().toISOString() });
              toast(`${t("tasks.newTask")} ✓`);
              setFormOpen(false);
            },
            onError: () => toast(t("data.saveFailed"), "error"),
          });
        }}
      />

      {detail ? (
        <TaskDetail
          task={detail}
          employees={employees}
          projects={projects}
          clients={clients}
          activity={[
            { id: `created-${detail.id}`, actorId: detail.creatorId ?? detail.assigneeId ?? CURRENT_USER, kind: "created", at: "2026-06-20T09:00:00Z" },
            ...(activityLog[detail.id] ?? []),
          ]}
          onPatch={(patch) => patchTask(detail.id, patch)}
          onCancel={() => { patchTask(detail.id, { status: "cancelled" }); toast(`${t("tasks.cancelTask")} ✓`, "info"); }}
          onReopen={() => patchTask(detail.id, { status: "todo" })}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-9 w-64" /></div>}>
      <TasksWorkspace />
    </Suspense>
  );
}

/** July 2026 month grid with tasks pinned to their due dates. */
function TasksMonthGrid({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
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
    new Date(Date.UTC(2026, 5, 28 + i)).toLocaleDateString(locale === "ar" ? "ar" : "en-US", { weekday: "short" }),
  );

  const monthTitle = first.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { month: "long", year: "numeric" });

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
          const dayTasks = day ? tasks.filter((task) => task.dueDate === iso && task.status !== "cancelled") : [];
          return (
            <div key={i} className={cn("min-h-24 border-b border-e border-border/60 p-1.5", !day && "bg-surface-2/40")}>
              {day ? (
                <>
                  <p className={cn("mb-1 text-[11px] font-bold tabular-nums", iso === "2026-07-02" ? "text-accent" : "text-ink-3")}>
                    {formatNumber(day, locale)}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onOpen(task.id)}
                        title={task.title}
                        className={cn(
                          "block w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-start text-[10px] font-semibold",
                          task.priority === "urgent" ? "bg-danger-bg text-danger" : task.priority === "high" ? "bg-warning-bg text-warning" : "bg-info-bg text-info",
                        )}
                      >
                        {task.title}
                      </button>
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
