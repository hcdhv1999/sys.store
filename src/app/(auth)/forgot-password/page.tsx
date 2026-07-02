"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/services/auth";

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    await requestPasswordReset(values.email);
    setSent(true);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{t("auth.reset")}</h1>
      <p className="mt-1 text-sm text-ink-2">{t("auth.resetSubtitle")}</p>

      {sent ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-success-bg px-4 py-3.5">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-sm text-success">{t("auth.linkSent")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label={t("auth.email")} error={errors.email && t("auth.invalid")}>
            <Input type="email" autoComplete="email" dir="ltr" {...register("email")} />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("auth.sendLink")}
          </Button>
        </form>
      )}

      <div className="mt-4 text-center">
        <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover">
          <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" />
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
