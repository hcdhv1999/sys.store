"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Client, Employee, Project, Task, TaskStatus } from "@/types";
import type { MessageKey } from "@/lib/i18n/en";
import { TENANT_ID } from "@/lib/data/seed";

// Fast capture: only title + status are required; everything else optional.
const schema = z.object({
  title: z.string().min(2),
  status: z.enum(["todo", "inProgress", "review", "done", "cancelled"]),
  projectId: z.string(),
  clientId: z.string(),
  assigneeId: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  startDate: z.string(),
  dueDate: z.string(),
  description: z.string(),
  labels: z.string(),
});
type FormValues = z.infer<typeof schema>;

const STATUSES: TaskStatus[] = ["todo", "inProgress", "review", "done"];

export function TaskFormDialog({
  open,
  onClose,
  onCreate,
  projects,
  employees,
  clients,
  defaultProjectId,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  projects: Project[];
  employees: Employee[];
  clients: Client[];
  /** preselect this project (and its client) when opened from a project */
  defaultProjectId?: string;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "todo", priority: "medium", labels: "", projectId: "", clientId: "", assigneeId: "", startDate: "", dueDate: "", description: "" },
  });

  // Reset with the preselected project (and inherit its client) each open.
  useEffect(() => {
    if (!open) return;
    const proj = defaultProjectId ? projects.find((p) => p.id === defaultProjectId) : undefined;
    reset({
      status: "todo", priority: "medium", labels: "", startDate: "", dueDate: "", description: "",
      title: "",
      projectId: proj?.id ?? "",
      clientId: proj?.clientId ?? "",
      assigneeId: "",
    });
  }, [open, defaultProjectId, projects, reset]);

  const projectId = watch("projectId");
  // When a project is chosen, inherit its client automatically.
  useEffect(() => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj?.clientId) setValue("clientId", proj.clientId);
  }, [projectId, projects, setValue]);

  const onSubmit = handleSubmit((values) => {
    onCreate({
      id: `tk-${Date.now()}`,
      tenantId: TENANT_ID,
      projectId: values.projectId || null,
      clientId: values.clientId || null,
      title: values.title,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId,
      creatorId: "e-1",
      startDate: values.startDate || undefined,
      dueDate: values.dueDate || "2026-12-31",
      labels: values.labels.split(/[،,]/).map((l) => l.trim()).filter(Boolean),
      estimateH: 0,
      spentH: 0,
      notes: values.description || undefined,
      subtasksDone: 0,
      subtasksTotal: 0,
      comments: 0,
      attachments: 0,
    });
    reset();
    onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} title={t("tasks.newTask")} wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>{t("common.create")}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t("tasks.title2")} error={errors.title && t("common.invalidValue")} className="sm:col-span-2">
          <Input autoFocus {...register("title")} />
        </Field>
        <Field label={t("common.status")}>
          <Select {...register("status")}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}` as MessageKey)}</option>)}
          </Select>
        </Field>
        <Field label={t("common.priority")}>
          <Select {...register("priority")}>
            {(["low", "medium", "high", "urgent"] as const).map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("common.project")}>
          <Select {...register("projectId")}>
            <option value="">{t("tasks.noProject")}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label={t("common.client")}>
          <Select {...register("clientId")}>
            <option value="">{t("tasks.noClient")}</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label={t("common.assignee")}>
          <Select {...register("assigneeId")}>
            <option value="">{t("tasks.unassigned")}</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>
        <Field label={t("tasks.labels")}>
          <Input placeholder="تصميم، عاجل" {...register("labels")} />
        </Field>
        <Field label={t("tasks.startDate")}>
          <Input type="date" dir="ltr" {...register("startDate")} />
        </Field>
        <Field label={t("common.dueDate")}>
          <Input type="date" dir="ltr" {...register("dueDate")} />
        </Field>
        <Field label={t("common.description")} className="sm:col-span-2">
          <Textarea rows={2} {...register("description")} />
        </Field>
      </form>
    </Dialog>
  );
}
