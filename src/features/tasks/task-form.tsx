"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Employee, Project, Task } from "@/types";
import { TENANT_ID } from "@/lib/data/seed";

const schema = z.object({
  title: z.string().min(3),
  projectId: z.string(),
  assigneeId: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().min(8),
  estimateH: z.coerce.number().min(0),
  labels: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function TaskFormDialog({
  open,
  onClose,
  onCreate,
  projects,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  projects: Project[];
  employees: Employee[];
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { priority: "medium", labels: "", projectId: "" } });

  const onSubmit = handleSubmit((values) => {
    onCreate({
      id: `tk-${Date.now()}`,
      tenantId: TENANT_ID,
      projectId: values.projectId || null,
      title: values.title,
      status: "todo",
      priority: values.priority,
      assigneeId: values.assigneeId,
      dueDate: values.dueDate,
      labels: values.labels.split(/[،,]/).map((l) => l.trim()).filter(Boolean),
      estimateH: values.estimateH,
      spentH: 0,
      subtasksDone: 0,
      subtasksTotal: 0,
      comments: 0,
      attachments: 0,
    });
    reset();
    onClose();
  });

  const err = (k: keyof FormValues) => (errors[k] ? t("common.invalidValue") : undefined);

  return (
    <Dialog open={open} onClose={onClose} title={t("tasks.addTask")} wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>{t("common.create")}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t("common.name")} error={err("title")} className="sm:col-span-2">
          <Input {...register("title")} />
        </Field>
        <Field label={t("common.project")}>
          <Select {...register("projectId")}>
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.assignee")} error={err("assigneeId")}>
          <Select {...register("assigneeId")}>
            <option value="">—</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.priority")}>
          <Select {...register("priority")}>
            <option value="low">{t("priority.low")}</option>
            <option value="medium">{t("priority.medium")}</option>
            <option value="high">{t("priority.high")}</option>
            <option value="urgent">{t("priority.urgent")}</option>
          </Select>
        </Field>
        <Field label={t("common.dueDate")} error={err("dueDate")}>
          <Input type="date" dir="ltr" {...register("dueDate")} />
        </Field>
        <Field label={t("tasks.estimate")} error={err("estimateH")}>
          <Input type="number" min={0} dir="ltr" {...register("estimateH")} />
        </Field>
        <Field label={t("tasks.labels")}>
          <Input placeholder="تصميم، عاجل" {...register("labels")} />
        </Field>
      </form>
    </Dialog>
  );
}
