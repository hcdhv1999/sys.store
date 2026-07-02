"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Languages, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useNotifications } from "@/hooks/use-data";
import { relativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/services/auth";
import { employees } from "@/lib/data/seed";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const { data: notifications } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useClickOutside(() => setNotifOpen(false));
  const userRef = useClickOutside(() => setUserOpen(false));
  const unread = notifications.filter((n) => !n.read).length;
  const owner = employees[0];

  async function handleLogout() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-6">
      <button onClick={onMenu} className="cursor-pointer rounded-lg p-2 text-ink-2 hover:bg-surface-2 lg:hidden" aria-label="menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 ltr:left-3.5 rtl:right-3.5" />
        <input
          placeholder={t("common.searchEverything")}
          className="h-10 w-full rounded-xl border border-transparent bg-surface-2 ps-10 pe-4 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:bg-surface focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) router.push(`/clients?q=${encodeURIComponent(q)}`);
            }
          }}
        />
      </div>

      <div className="ms-auto flex items-center gap-1">
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-2"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{locale === "ar" ? "EN" : "عربي"}</span>
        </button>

        <button onClick={toggle} className="cursor-pointer rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-2" aria-label="theme">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative cursor-pointer rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-2"
            aria-label={t("notif.title")}
          >
            <Bell className="h-4.5 w-4.5" />
            {unread > 0 ? (
              <span className="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute end-0 top-12 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-pop animate-fade-up">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-ink">{t("notif.title")}</p>
                <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold text-accent hover:text-accent-hover">
                  {t("common.viewAll")}
                </Link>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setNotifOpen(false)}
                      className={cn("block px-4 py-3 transition-colors hover:bg-surface-2", !n.read && "bg-accent/5")}
                    >
                      <p className="flex items-center gap-2 text-xs font-bold text-ink">
                        {!n.read ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">{n.body}</p>
                      <p className="mt-1 text-[10px] text-ink-3">{relativeTime(n.createdAt, locale)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserOpen((v) => !v)} className="ms-1 flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-surface-2">
            <Avatar name={owner.name} />
            <span className="hidden text-start lg:block">
              <span className="block text-xs font-bold text-ink">{owner.name}</span>
              <span className="block text-[10px] text-ink-3">{t("role.owner")}</span>
            </span>
          </button>
          {userOpen ? (
            <div className="absolute end-0 top-12 w-56 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-pop animate-fade-up">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-ink">{owner.name}</p>
                <p className="text-xs text-ink-3" dir="ltr">{owner.email}</p>
              </div>
              <Link href="/settings" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                {t("nav.settings")}
              </Link>
              <button onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger-bg">
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
