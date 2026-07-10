"use client";

// Task details experience — opens over the workspace (edit without leaving
// the page). Every control is wired: status/priority/assignee/project/client/
// dates and time tracking patch the task; comments are real (task_comments
// table, local optimistic in demo); the activity timeline reflects real
// session events. Attachments are honestly deferred (needs Storage).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Ban, CalendarClock, Download, FileText, FolderKanban, MessageSquare, Paperclip, RotateCcw, Send, Timer, Trash2, Upload, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatDateTime, formatNumber, relativeTime } from "@/lib/format";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { listTaskComments, addTaskComment, listTaskAttachments, attachmentUrl, ATTACHMENT_MAX_MB } from "@/services/repository";
import { useTaskAttachments } from "@/hooks/use-mutations";
import { employeeName, taskClientId } from "@/lib/data/queries";
import { cn } from "@/lib/utils";
import type { Client, Employee, FileItem, Priority, Project, Task, TaskComment, TaskStatus } from "@/types";
import type { MessageKey } from "@/lib/i18n/en";

const STATUSES: TaskStatus[] = ["todo", "inProgress", "review", "done", "cancelled"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export interface ActivityEntry {
  id: string;
  actorId: string;
  kind: "created" | "moved";
  status?: TaskStatus;
  at: string;
}

export function TaskDetail({
  task,
  employees,
  projects,
  clients,
  activity,
  onPatch,
  onCancel,
  onReopen,
  onClose,
}: {
  task: Task;
  employees: Employee[];
  projects: Project[];
  clients: Client[];
  activity: ActivityEntry[];
  onPatch: (patch: Partial<Task>) => void;
  onCancel: () => void;
  onReopen: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const clientId = taskClientId(task);

  // Real comments: seed-backed in demo, task_comments table with Supabase.
  const { data: fetched = [] } = useQuery({
    queryKey: ["task-comments", task.id],
    queryFn: () => listTaskComments(task.id),
  });
  const [localComments, setLocalComments] = useState<TaskComment[]>([]);
  const [draft, setDraft] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => setLocalComments([]), [task.id]);
  const comments = [...fetched, ...localComments];

  async function postComment() {
    const body = draft.trim();
    if (!body) return;
    const optimistic: TaskComment = {
      id: `tc-${Date.now()}`,
      tenantId: task.tenantId,
      taskId: task.id,
      authorId: "e-1",
      body,
      createdAt: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      await addTaskComment(task.id, body);
    } catch {
      setLocalComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      toast(t("common.invalidValue"), "error");
    }
  }

  return (
    <Dialog open onClose={onClose} title={t("tasks.details")} wide>
      <div className="space-y-5">
        {/* Title + status/priority */}
        <div>
          <input
            value={task.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            className="w-full rounded-lg border border-transparent bg-transparent text-base font-bold text-ink hover:border-border focus:border-accent focus:outline-none"
            aria-label={t("tasks.title2")}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.labels.map((l) => (
              <span key={l} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">{l}</span>
            ))}
          </div>
        </div>

        {/* Editable fields grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled label={t("common.status")}>
            <Select value={task.status} onChange={(e) => onPatch({ status: e.target.value as TaskStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}` as MessageKey)}</option>)}
            </Select>
          </Labeled>
          <Labeled label={t("common.priority")}>
            <Select value={task.priority} onChange={(e) => onPatch({ priority: e.target.value as Priority })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{t(`priority.${p}` as MessageKey)}</option>)}
            </Select>
          </Labeled>
          <Labeled label={t("common.assignee")} icon={User}>
            <Select value={task.assigneeId} onChange={(e) => onPatch({ assigneeId: e.target.value })}>
              <option value="">{t("tasks.unassigned")}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Labeled>
          <Labeled label={t("common.project")} icon={FolderKanban}>
            <Select value={task.projectId ?? ""} onChange={(e) => onPatch({ projectId: e.target.value || null })}>
              <option value="">{t("tasks.noProject")}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Labeled>
          <Labeled label={t("common.client")}>
            {task.projectId ? (
              <p className="flex h-10 items-center text-sm text-ink-2">
                {clientId ? (
                  <Link href={`/clients/${clientId}`} className="font-semibold text-accent hover:text-accent-hover">
                    {clients.find((c) => c.id === clientId)?.name ?? "—"}
                  </Link>
                ) : t("tasks.noClient")}
              </p>
            ) : (
              <Select value={task.clientId ?? ""} onChange={(e) => onPatch({ clientId: e.target.value || null })}>
                <option value="">{t("tasks.noClient")}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            )}
          </Labeled>
          <Labeled label={t("tasks.startDate")} icon={CalendarClock}>
            <Input type="date" dir="ltr" value={task.startDate ?? ""} onChange={(e) => onPatch({ startDate: e.target.value })} />
          </Labeled>
          <Labeled label={t("common.dueDate")}>
            <Input type="date" dir="ltr" value={task.dueDate} onChange={(e) => onPatch({ dueDate: e.target.value })} />
          </Labeled>
        </div>

        {/* Description / notes */}
        <Labeled label={t("common.description")}>
          <Textarea rows={2} value={task.notes ?? ""} onChange={(e) => onPatch({ notes: e.target.value })} />
        </Labeled>

        {/* Time tracking (real fields) */}
        <div className="rounded-xl border border-border p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink"><Timer className="h-3.5 w-3.5 text-accent" />{t("tasks.timeTracking")}</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-2">
              {t("tasks.estimated")} ({t("tasks.hours")})
              <Input type="number" min={0} dir="ltr" className="mt-1" value={task.estimateH || ""} onChange={(e) => onPatch({ estimateH: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-ink-2">
              {t("tasks.actual")} ({t("tasks.hours")})
              <Input type="number" min={0} dir="ltr" className="mt-1" value={task.spentH || ""} onChange={(e) => onPatch({ spentH: Number(e.target.value) })} />
            </label>
          </div>
          {task.estimateH > 0 ? (
            <Progress value={Math.min(100, (task.spentH / task.estimateH) * 100)} className="mt-3" />
          ) : null}
        </div>

        {/* Comments (real) */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink"><MessageSquare className="h-3.5 w-3.5 text-accent" />{t("tasks.comments")} ({formatNumber(comments.length, locale)})</p>
          <div className="space-y-2.5">
            {comments.length === 0 ? (
              <p className="text-xs text-ink-3">{t("tasks.noComments")}</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={employeeName(c.authorId)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs"><span className="font-bold text-ink">{employeeName(c.authorId)}</span> <span className="text-ink-3">{relativeTime(c.createdAt, locale)}</span></p>
                    <p className="mt-0.5 text-sm text-ink-2">{c.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postComment()} placeholder={t("tasks.addComment")} />
            <Button onClick={postComment} disabled={!draft.trim()}><Send className="h-4 w-4" />{t("tasks.postComment")}</Button>
          </div>
        </div>

        {/* Attachments — real Supabase Storage (task_id-scoped, tenant-isolated) */}
        <Attachments task={task} />

        {/* Activity timeline (real session events) */}
        <div>
          <p className="mb-2 text-xs font-bold text-ink">{t("tasks.activity")}</p>
          <ul className="relative space-y-3 ps-4 before:absolute before:inset-y-1 before:start-[3px] before:w-px before:bg-border">
            {activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -start-4 top-1 h-2 w-2 rounded-full border-2 border-accent bg-surface" />
                <p className="text-xs text-ink-2">
                  <span className="font-bold text-ink">{employeeName(a.actorId)}</span>{" "}
                  {a.kind === "created" ? t("tasks.created") : <>{t("tasks.movedTo")} <b className="text-ink">{t(`status.${a.status}` as MessageKey)}</b></>}
                  <span className="text-ink-3"> · {formatDateTime(a.at, locale)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Destructive action */}
        <div className="flex items-center gap-2 border-t border-border pt-4">
          {task.status === "cancelled" ? (
            <Button variant="outline" onClick={onReopen}><RotateCcw className="h-4 w-4" />{t("tasks.reopen")}</Button>
          ) : confirmCancel ? (
            <>
              <span className="text-xs text-ink-2">{t("tasks.cancelConfirm")}</span>
              <Button variant="danger" size="sm" onClick={() => { onCancel(); setConfirmCancel(false); }}>{t("common.confirm")}</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>{t("common.cancel")}</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmCancel(true)} className="text-danger"><Ban className="h-4 w-4" />{t("tasks.cancelTask")}</Button>
          )}
          <span className="ms-auto text-[11px] text-ink-3">{t("common.dueDate")}: {formatDate(task.dueDate, locale)}</span>
        </div>
      </div>
    </Dialog>
  );
}

/** Task attachments — upload/list/open/delete backed by Supabase Storage. */
function Attachments({ task }: { task: Task }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, remove } = useTaskAttachments();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["task-attachments", task.id],
    queryFn: () => listTaskAttachments(task.id),
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
      toast(t("tasks.attachmentTooLarge"), "error");
      return;
    }
    upload.mutate(
      { taskId: task.id, file },
      {
        onSuccess: () => toast(`${file.name} ✓`),
        onError: (err) => toast(err instanceof Error && err.name === "AttachmentValidationError" ? t("tasks.attachmentBadType") : t("data.saveFailed"), "error"),
      },
    );
  }

  async function open(item: FileItem) {
    try {
      const url = await attachmentUrl(item);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast(t("data.queryFailed"), "error");
    }
  }

  function del(item: FileItem) {
    remove.mutate(item, { onError: () => toast(t("data.saveFailed"), "error") });
  }

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold text-ink"><Paperclip className="h-3.5 w-3.5 text-accent" />{t("tasks.attachments")} ({formatNumber(files.length, locale)})</p>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="h-3.5 w-3.5" />{upload.isPending ? t("tasks.uploading") : t("tasks.uploadFile")}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={onPick} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" />
      </div>
      {isLoading ? (
        <p className="text-xs text-ink-3">…</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-ink-3">{t("tasks.noAttachments")}</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5">
              <FileText className="h-4 w-4 shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{f.name}</span>
              <span className="shrink-0 text-[11px] text-ink-3 tabular-nums">{formatNumber(f.sizeMB, locale)} MB</span>
              <button onClick={() => open(f)} title={t("tasks.download")} className="cursor-pointer rounded-md p-1 text-ink-3 hover:bg-surface hover:text-accent">
                <Download className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => del(f)} title={t("tasks.deleteAttachment")} disabled={remove.isPending} className="cursor-pointer rounded-md p-1 text-ink-3 hover:bg-surface hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-ink-3">{t("tasks.attachmentHint")}</p>
    </div>
  );
}

function Labeled({ label, icon: Icon, children }: { label: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <label className={cn("block")}>
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-ink-2">
        {Icon ? <Icon className="h-3 w-3 text-ink-3" /> : null}{label}
      </span>
      {children}
    </label>
  );
}
