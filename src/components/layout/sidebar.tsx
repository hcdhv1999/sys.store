"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Package,
  Briefcase,
  Calendar,
  CheckSquare,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShoppingBag,
  Store,
  Users,
  UsersRound,
  Wallet,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";
import { BrandMark } from "./brand-mark";

const sections: { heading: MessageKey; items: { href: string; label: MessageKey; icon: typeof LayoutDashboard }[] }[] = [
  {
    heading: "nav.workspace",
    items: [
      { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "nav.clients", icon: Users },
      { href: "/projects", label: "nav.projects", icon: Briefcase },
      { href: "/tasks", label: "nav.tasks", icon: CheckSquare },
      { href: "/calendar", label: "nav.calendar", icon: Calendar },
    ],
  },
  {
    heading: "nav.management",
    items: [
      { href: "/team", label: "nav.team", icon: UsersRound },
      { href: "/quotations", label: "nav.quotations", icon: FileText },
      { href: "/catalog", label: "nav.catalog", icon: Package },
      { href: "/finance", label: "nav.finance", icon: Wallet },
      { href: "/marketing", label: "nav.marketing", icon: Megaphone },
      { href: "/stores", label: "nav.stores", icon: Store },
      { href: "/files", label: "nav.files", icon: FolderOpen },
      { href: "/reports", label: "nav.reports", icon: BarChart3 },
      { href: "/settings", label: "nav.settings", icon: Settings },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      {/* Mobile overlay */}
      {open ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200",
          // off-canvas below lg only; max-lg keeps RTL/LTR variants from overriding desktop
          open ? "translate-x-0" : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" onClick={onClose}>
            <BrandMark />
          </Link>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-sidebar-foreground hover:bg-white/10 lg:hidden" aria-label="close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/50 uppercase">
                {t(section.heading)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-[var(--sidebar-active)] text-white"
                            : "text-sidebar-foreground hover:bg-white/6 hover:text-white",
                        )}
                      >
                        <item.icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-accent" : "opacity-70 group-hover:opacity-100")} />
                        {t(item.label)}
                        {active ? <span className="ms-auto h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/8 px-5 py-4">
          <p className="flex items-center gap-2 text-[11px] text-sidebar-foreground/60">
            <ShoppingBag className="h-3.5 w-3.5" />
            HIRF Pro · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
