"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updatePassword } from "@/services/auth";

const schema = z
  .object({
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"] });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    const result = await updatePassword(values.password);
    if (result.ok) {
      toast(t("auth.updatePassword") + " ✓");
      router.replace("/login");
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{t("auth.newPassword")}</h1>
      <p className="mt-1 text-sm text-ink-2">{t("auth.resetSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label={t("auth.newPassword")} error={errors.password && t("auth.invalid")}>
          <Input type="password" autoComplete="new-password" dir="ltr" {...register("password")} />
        </Field>
        <Field label={t("auth.confirmPassword")} error={errors.confirm && t("auth.invalid")}>
          <Input type="password" autoComplete="new-password" dir="ltr" {...register("confirm")} />
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {t("auth.updatePassword")}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-xs font-semibold text-accent hover:text-accent-hover">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
