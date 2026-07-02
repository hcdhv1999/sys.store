export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "hirf-locale";
export const THEME_COOKIE = "hirf-theme";
export const SESSION_COOKIE = "hirf-session";

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
