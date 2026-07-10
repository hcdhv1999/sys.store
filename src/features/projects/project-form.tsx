"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Client, Employee } from "@/types";
import type { ProjectInput } from "@/services/repository";

const schema = z.object({
  name: z.string().min(3),
  clientId: z.string().min(1),
  service: z.string().min(2),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  budget: z.coerce.number().positive(),
  startDate: z.string().min(8),
  deadline: z.string().min(8),
  managerId: z.string().min(1),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ProjectFormDialog({
  open,
  onClose,
  onCreate,
  clients,
  employees,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: ProjectInput) => void;
  clients: Client[];
  employees: Employee[];
  submitting?: boolean;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { priority: "medium" } });

  const onSubmit = handleSubmit((values) => {
    onCreate({
      clientId: values.clientId,
      name: values.name,
      service: values.service,
      priority: values.priority,
      budget: values.budget,
      startDate: values.startDate,
      deadline: values.deadline,
      managerId: values.managerId,
      description: values.description ?? "",
    });
    reset();
  });

  const err = (k: keyof FormValues) => (errors[k] ? t("common.invalidValue") : undefined);

  return (
    <Dialog open={open} onClose={onClose} title={t("projects.addProject")} wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || submitting}>{t("common.create")}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t("common.name")} error={err("name")} className="sm:col-span-2">
          <Input {...register("name")} />
        </Field>
        <Field label={t("common.client")} error={err("clientId")}>
          <Select {...register("clientId")}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("projects.manager")} error={err("managerId")}>
          <Select {...register("managerId")}>
            <option value="">—</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("clients.industry")} error={err("service")}>
          <Input placeholder="تطوير ويب / هوية بصرية…" {...register("service")} />
        </Field>
        <Field label={t("common.priority")}>
          <Select {...register("priority")}>
            <option value="low">{t("priority.low")}</option>
            <option value="medium">{t("priority.medium")}</option>
            <option value="high">{t("priority.high")}</option>
            <option value="urgent">{t("priority.urgent")}</option>
          </Select>
        </Field>
        <Field label={t("common.budget")} error={err("budget")}>
          <Input type="number" min={0} dir="ltr" {...register("budget")} />
        </Field>
        <Field label={t("projects.startDate")} error={err("startDate")}>
          <Input type="date" dir="ltr" {...register("startDate")} />
        </Field>
        <Field label={t("projects.deadline")} error={err("deadline")}>
          <Input type="date" dir="ltr" {...register("deadline")} />
        </Field>
        <Field label={t("common.description")} className="sm:col-span-2">
          <Textarea rows={2} {...register("description")} />
        </Field>
      </form>
    </Dialog>
  );
}
