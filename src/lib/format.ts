import type { Locale } from "@/lib/i18n/config";

const currencyCache = new Map<string, Intl.NumberFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();

function intlLocale(locale: Locale) {
  // Latin digits in both languages keeps tables scannable and copy-paste safe.
  return locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US";
}

export function formatCurrency(value: number, locale: Locale, compact = false): string {
  const key = `${locale}-${compact}`;
  let fmt = currencyCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    });
    currencyCache.set(key, fmt);
  }
  return fmt.format(value);
}

export function formatNumber(value: number, locale: Locale, digits = 0): string {
  const key = `${locale}-${digits}`;
  let fmt = numberCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: digits });
    numberCache.set(key, fmt);
  }
  return fmt.format(value);
}

export function formatPercent(value: number, locale: Locale, digits = 1): string {
  return `${formatNumber(value, locale, digits)}%`;
}

export function formatDate(iso: string, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  return rtf.format(Math.round(diff / 2592000), "month");
}
