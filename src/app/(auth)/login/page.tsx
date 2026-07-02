"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { DEMO_EMAIL, DEMO_PASSWORD, isSupabaseConfigured, signIn } from "@/services/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const demo = !isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: demo ? { email: DEMO_EMAIL, password: DEMO_PASSWORD } : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signIn(values.email, values.password);
    if (!result.ok) {
      setServerError(t("auth.invalid"));
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">{t("auth.welcome")}</h1>
      <p className="mt-1 text-sm text-ink-2">{t("auth.loginSubtitle")}</p>

      {demo ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2.5 text-xs font-medium text-accent">
          <Sparkles className="h-4 w-4 shrink-0" />
          {t("auth.demoHint")}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label={t("auth.email")} error={errors.email && t("auth.invalid")}>
          <Input type="email" autoComplete="email" dir="ltr" {...register("email")} />
        </Field>
        <Field label={t("auth.password")} error={errors.password && t("auth.invalid")}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              dir="ltr"
              className="pe-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 -translate-y-1/2 cursor-pointer text-ink-3 hover:text-ink ltr:right-3 rtl:left-3"
              aria-label="toggle password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {serverError ? <p className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger">{serverError}</p> : null}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {t("auth.login")}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:text-accent-hover">
          {t("auth.forgot")}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
