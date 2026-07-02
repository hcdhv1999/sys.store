"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Client } from "@/types";
import { TENANT_ID } from "@/lib/data/seed";

const schema = z.object({
  name: z.string().min(2),
  industry: z.string().min(2),
  status: z.enum(["active", "lead", "inactive"]),
  city: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  cr: z.string().regex(/^\d{10}$/),
  vatNumber: z.string().regex(/^\d{15}$/),
  website: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ClientFormDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (client: Client) => void;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: "lead" } });

  const onSubmit = handleSubmit((values) => {
    onCreate({
      id: `cl-${Date.now()}`,
      tenantId: TENANT_ID,
      name: values.name,
      industry: values.industry,
      status: values.status,
      city: values.city,
      address: "",
      cr: values.cr,
      vatNumber: values.vatNumber,
      website: values.website ?? "",
      email: values.email,
      phone: values.phone,
      contacts: [],
      tags: [],
      since: new Date().toISOString().slice(0, 10),
      notes: values.notes ?? "",
      lastActivity: new Date().toISOString(),
    });
    reset();
    onClose();
  });

  const err = (k: keyof FormValues) => (errors[k] ? t("common.invalidValue") : undefined);

  return (
    <Dialog open={open} onClose={onClose} title={t("clients.addClient")} wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>{t("common.create")}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t("clients.company")} error={err("name")} className="sm:col-span-2">
          <Input {...register("name")} />
        </Field>
        <Field label={t("clients.industry")} error={err("industry")}>
          <Input {...register("industry")} />
        </Field>
        <Field label={t("common.status")}>
          <Select {...register("status")}>
            <option value="lead">{t("status.lead")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="inactive">{t("status.inactive")}</option>
          </Select>
        </Field>
        <Field label={t("common.email")} error={err("email")}>
          <Input type="email" dir="ltr" {...register("email")} />
        </Field>
        <Field label={t("common.phone")} error={err("phone")}>
          <Input dir="ltr" placeholder="+966 5X XXX XXXX" {...register("phone")} />
        </Field>
        <Field label={t("common.city")} error={err("city")}>
          <Input {...register("city")} />
        </Field>
        <Field label={t("common.website")}>
          <Input dir="ltr" placeholder="example.sa" {...register("website")} />
        </Field>
        <Field label={t("clients.cr")} error={err("cr")}>
          <Input dir="ltr" maxLength={10} placeholder="1010XXXXXX" {...register("cr")} />
        </Field>
        <Field label={t("clients.vatNumber")} error={err("vatNumber")}>
          <Input dir="ltr" maxLength={15} placeholder="3XXXXXXXXXXXXX3" {...register("vatNumber")} />
        </Field>
        <Field label={t("common.notes")} className="sm:col-span-2">
          <Textarea rows={2} {...register("notes")} />
        </Field>
      </form>
    </Dialog>
  );
}
