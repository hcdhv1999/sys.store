"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type MessageKey } from "./en";
import { ar } from "./ar";
import { defaultLocale, dirOf, LOCALE_COOKIE, type Locale } from "./config";

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, ar };

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: MessageKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Pages prerender with the Arabic default; the persisted cookie locale is
  // applied after hydration (the <html> dir/lang is already correct from the
  // pre-paint boot script in the root layout).
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )hirf-locale=(ar|en)/);
    if (match && match[1] !== defaultLocale) setLocaleState(match[1] as Locale);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = dirOf(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dirOf(locale),
      t: (key) => dictionaries[locale][key] ?? key,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
