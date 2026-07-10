"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useI18n } from "@/lib/i18n/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { ClientInput } from "@/services/repository";

// Quick capture: only the person, their mobile, and what they do are
// required. Everything else can be completed later from the profile.
const optional = (schema: z.ZodString) => schema.optional().or(z.literal(""));

const schema = z.object({
  fullName: z.string().min(2),
  mobile: z.string().min(9),
  businessActivity: z.string().min(2),
  companyName: optional(z.string().min(2)),
  email: optional(z.string().email()),
  cr: optional(z.string().regex(/^\d{10}$/)),
  vatNumber: optional(z.string().regex(/^\d{15}$/)),
  address: optional(z.string().min(3)),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ClientFormDialog({
  open,
  onClose,
  onCreate,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  // Emits a repository input; the page persists it (Supabase in production).
  onCreate: (input: ClientInput) => void;
  submitting?: boolean;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    onCreate({
      // The company falls back to the person's name for individual clients.
      name: values.companyName?.trim() || values.fullName,
      industry: values.businessActivity,
      status: "active",
      city: "",
      address: values.address ?? "",
      cr: values.cr ?? "",
      vatNumber: values.vatNumber ?? "",
      website: "",
      email: values.email ?? "",
      phone: values.mobile,
      notes: values.notes ?? "",
      contactName: values.fullName,
    });
    reset();
  });

  const err = (k: keyof FormValues) => (errors[k] ? t("common.invalidValue") : undefined);

  return (
    <Dialog open={open} onClose={onClose} title={t("clients.addClient")} wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || submitting}>{t("common.create")}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* Required */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("clients.fullName")} error={err("fullName")} className="sm:col-span-2">
            <Input autoFocus {...register("fullName")} />
          </Field>
          <Field label={t("clients.mobile")} error={err("mobile")}>
            <Input dir="ltr" inputMode="tel" placeholder="+966 5X XXX XXXX" {...register("mobile")} />
          </Field>
          <Field label={t("clients.businessActivity")} error={err("businessActivity")}>
            <Input placeholder="مطاعم / تجارة إلكترونية / عيادات…" {...register("businessActivity")} />
          </Field>
        </div>

        {/* Optional */}
        <div className="rounded-xl border border-dashed border-border p-4">
          <p className="mb-3 text-xs font-bold text-ink-3 uppercase">{t("clients.optionalSection")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("clients.company")} error={err("companyName")}>
              <Input {...register("companyName")} />
            </Field>
            <Field label={t("common.email")} error={err("email")}>
              <Input type="email" dir="ltr" {...register("email")} />
            </Field>
            <Field label={t("clients.cr")} error={err("cr")}>
              <Input dir="ltr" maxLength={10} placeholder="1010XXXXXX" {...register("cr")} />
            </Field>
            <Field label={t("clients.vatNumber")} error={err("vatNumber")}>
              <Input dir="ltr" maxLength={15} placeholder="3XXXXXXXXXXXXX3" {...register("vatNumber")} />
            </Field>
            <Field label={t("clients.address")} error={err("address")} className="sm:col-span-2">
              <Input {...register("address")} />
            </Field>
            <Field label={t("common.notes")} className="sm:col-span-2">
              <Textarea rows={2} {...register("notes")} />
            </Field>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
