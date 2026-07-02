"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -end-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #D88935 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -start-24 h-[28rem] w-[28rem] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7ba6a6 0%, transparent 70%)" }}
        />
        <BrandMark large />
        <div className="relative">
          <p className="text-4xl leading-snug font-bold text-white">
            {locale === "ar" ? "كل أعمال وكالتك،" : "Your entire agency,"}
            <br />
            <span className="text-accent">{locale === "ar" ? "في منصة واحدة." : "in one platform."}</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground">{t("brand.tagline")}</p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/60">© 2026 حِرف — HIRF</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 flex items-center gap-1 ltr:right-4 rtl:left-4">
          <button
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-2"
          >
            <Languages className="h-4 w-4" />
            {locale === "ar" ? "English" : "العربية"}
          </button>
          <button
            onClick={toggle}
            aria-label="theme"
            className="cursor-pointer rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-2"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <div className="w-full max-w-sm animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
