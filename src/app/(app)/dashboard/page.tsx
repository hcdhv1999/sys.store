"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CheckSquare,
  FilePlus2,
  FileWarning,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber, relativeTime } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendAreaChart, BarsChart, DonutChart } from "@/components/charts";
import {
  clientName,
  dashboardKpis,
  employeeName,
  invoiceTotal,
  recentActivity,
  upcomingEvents,
} from "@/lib/data/queries";
import { monthlyFinancials, revenueByService, employees } from "@/lib/data/seed";
import { useInvoices, useTasks } from "@/hooks/use-data";

const quickActions = [
  { href: "/clients", labelKey: "dashboard.newClient", icon: UserPlus },
  { href: "/projects", labelKey: "dashboard.newProject", icon: Briefcase },
  { href: "/finance", labelKey: "dashboard.newInvoice", icon: Receipt },
  { href: "/quotations", labelKey: "dashboard.newQuotation", icon: FilePlus2 },
] as const;

const eventIcons = { meeting: Video, deadline: FileWarning, launch: ArrowUpRight, internal: Users };

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const kpis = dashboardKpis();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const monthLabel = (m: string) =>
    new Date(m + "-01").toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { month: "short" });

  const trendData = monthlyFinancials.map((m) => ({
    label: monthLabel(m.month),
    revenue: m.revenue,
    expenses: m.expenses,
  }));

  const taskLoad = (["todo", "inProgress", "review", "done"] as const).map((s) => ({
    label: t(`status.${s}`),
    value: tasks.filter((task) => task.status === s).length,
  }));

  const recentInvoices = [...invoices]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .slice(0, 5);

  const deadlines = tasks
    .filter((task) => task.status !== "done" && task.dueDate >= "2026-07-02")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const owner = employees[0];

  return (
    <div className="animate-fade-up">
      {/* Greeting + quick actions */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-2">{t("dashboard.welcomeBack")} 👋</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">{owner.name}</h1>
          <p className="mt-1 text-sm text-ink-2">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.href + a.labelKey}
              href={a.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink-2 shadow-soft transition-all hover:border-accent hover:text-accent"
            >
              <a.icon className="h-4 w-4" />
              {t(a.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dashboard.revenue")} value={formatCurrency(kpis.revenue, locale)} icon={Wallet} delta={kpis.revenueDelta} />
        <StatCard label={t("dashboard.expenses")} value={formatCurrency(kpis.expenses, locale)} icon={Receipt} delta={kpis.expensesDelta} deltaInverted />
        <StatCard label={t("dashboard.profit")} value={formatCurrency(kpis.profit, locale)} icon={TrendingUp} delta={kpis.profitDelta} />
        <StatCard
          label={t("dashboard.unpaidInvoices")}
          value={formatCurrency(kpis.unpaidTotal, locale)}
          icon={FileWarning}
          hint={`${formatNumber(kpis.unpaidCount, locale)} ${t("clients.invoices")}`}
        />
      </div>

      {/* Secondary counters */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: t("dashboard.activeProjects"), value: kpis.activeProjects, icon: Briefcase, href: "/projects" },
          { label: t("dashboard.activeClients"), value: kpis.activeClients, icon: Users, href: "/clients" },
          { label: t("dashboard.openTasks"), value: kpis.openTasks, icon: CheckSquare, href: "/tasks" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-pop">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-bold text-ink tabular-nums">{formatNumber(item.value, locale)}</p>
                <p className="text-xs text-ink-2">{item.label}</p>
              </div>
              <ArrowUpRight className="ms-auto h-4 w-4 text-ink-3 rtl:rotate-270" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t("dashboard.revenueVsExpenses")} subtitle={`${monthLabel("2025-07")} — ${monthLabel("2026-06")} 2026`} />
          <CardBody>
            <TrendAreaChart
              data={trendData}
              series={[
                { key: "revenue", name: t("dashboard.revenue") },
                { key: "expenses", name: t("dashboard.expenses") },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("dashboard.revenueByService")} />
          <CardBody>
            <DonutChart data={revenueByService} height={200} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Upcoming meetings & deadlines */}
        <Card>
          <CardHeader
            title={t("dashboard.upcomingMeetings")}
            action={
              <Link href="/calendar" className="text-xs font-semibold text-accent hover:text-accent-hover">
                {t("common.viewAll")}
              </Link>
            }
          />
          <CardBody className="space-y-1 p-3">
            {upcomingEvents(5).map((ev) => {
              const Icon = eventIcons[ev.kind];
              return (
                <div key={ev.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary dark:bg-primary/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{ev.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3 tabular-nums">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(ev.date, locale, { day: "numeric", month: "short" })} · {ev.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Task load */}
        <Card>
          <CardHeader title={t("dashboard.taskLoad")} />
          <CardBody>
            {tasksLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <BarsChart data={taskLoad} series={[{ key: "value", name: t("nav.tasks") }]} height={210} currency={false} />
            )}
            <div className="mt-3 space-y-2">
              {deadlines.slice(0, 3).map((task) => (
                <Link key={task.id} href="/tasks" className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-2">
                  <span className="truncate text-ink-2">{task.title}</span>
                  <span className="shrink-0 font-semibold text-warning tabular-nums">{formatDate(task.dueDate, locale, { day: "numeric", month: "short" })}</span>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title={t("dashboard.recentActivity")} />
          <CardBody className="p-3">
            <ul className="space-y-1">
              {recentActivity(6).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2">
                    <Avatar name={employeeName(item.actorId)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed text-ink-2">
                        <span className="font-bold text-ink">{employeeName(item.actorId)}</span> {item.action}{" "}
                        <span className="font-semibold text-ink">{item.target}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-3">{relativeTime(item.at, locale)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Recent invoices */}
      <Card className="mt-4">
        <CardHeader
          title={t("dashboard.recentInvoices")}
          action={
            <Link href="/finance" className="text-xs font-semibold text-accent hover:text-accent-hover">
              {t("common.viewAll")}
            </Link>
          }
        />
        <CardBody className="p-0 pt-4">
          {invoicesLoading ? (
            <div className="space-y-2 p-5 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                    <th className="px-5 py-2.5 text-start">{t("finance.invoiceNo")}</th>
                    <th className="px-5 py-2.5 text-start">{t("common.client")}</th>
                    <th className="px-5 py-2.5 text-start">{t("common.total")}</th>
                    <th className="px-5 py-2.5 text-start">{t("common.dueDate")}</th>
                    <th className="px-5 py-2.5 text-start">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/60">
                      <td className="px-5 py-3 font-semibold text-ink tabular-nums" dir="ltr">{inv.number}</td>
                      <td className="px-5 py-3 text-ink-2">{clientName(inv.clientId)}</td>
                      <td className="px-5 py-3 font-semibold text-ink tabular-nums">{formatCurrency(invoiceTotal(inv), locale)}</td>
                      <td className="px-5 py-3 text-ink-2 tabular-nums">{formatDate(inv.dueDate, locale)}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
