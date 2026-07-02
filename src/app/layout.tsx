import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
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

// Applies the persisted locale/theme before first paint. Keeping the cookie
// read out of the server tree lets every route prerender statically, which is
// what Cloudflare Pages (next-on-pages) requires for function-free deploys.
const bootScript = `(function(){try{
var m=document.cookie.match(/(?:^|; )hirf-locale=(ar|en)/);var l=m?m[1]:"ar";
var d=document.documentElement;d.lang=l;d.dir=l==="en"?"ltr":"rtl";
if(/(?:^|; )hirf-theme=dark/.test(document.cookie))d.classList.add("dark");
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className={`${inter.variable} ${plexArabic.variable} min-h-dvh antialiased`}>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>{children}</ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
