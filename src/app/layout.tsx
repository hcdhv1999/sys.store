import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider, type Theme } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale, dirOf, LOCALE_COOKIE, locales, THEME_COOKIE, type Locale } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "حِرف — HIRF", template: "%s · حِرف" },
  description: "منصة ERP + CRM متكاملة للوكالات الرقمية في السعودية والخليج — HIRF, the operating system for digital agencies.",
  applicationName: "HIRF",
  icons: { icon: "/icon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : defaultLocale;
  const theme: Theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html lang={locale} dir={dirOf(locale)} className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <body className={`${inter.variable} ${plexArabic.variable} min-h-dvh antialiased`}>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLocale={locale}>
            <ToastProvider>{children}</ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
