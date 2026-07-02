"use client";

import { useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarsChart, DonutChart, RankBarChart, TrendAreaChart } from "@/components/charts";
import {
  campaignMetrics,
  clientName,
  clientRollup,
  invoiceOutstanding,
  invoiceTotal,
} from "@/lib/data/queries";
import {
  campaigns,
  clients,
  employees,
  invoices,
  monthlyFinancials,
  revenueByService,
} from "@/lib/data/seed";
import { downloadCsv } from "@/lib/export";
import { useToast } from "@/components/ui/toast";

type Range = "quarter" | "half" | "year";

export default function ReportsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [range, setRange] = useState<Range>("year");

  const months = range === "quarter" ? 3 : range === "half" ? 6 : 12;
  const series = monthlyFinancials.slice(-months);

  const monthLabel = (m: string) =>
    new Date(m + "-01").toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { month: "short" });

  const financialData = series.map((m) => ({
    label: monthLabel(m.month),
    revenue: m.revenue,
    expenses: m.expenses,
    profit: m.revenue - m.expenses,
  }));

  const topClients = clients
    .map((c) => ({ label: c.name, value: clientRollup(c.id).billed }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const productivity = employees.map((e) => ({ label: e.name.split(" ")[0], value: e.tasksCompleted }));

  const roasByCampaign = campaigns
    .filter((c) => c.spend > 0 && c.revenue > 0)
    .map((c) => ({ label: c.name.length > 24 ? c.name.slice(0, 24) + "…" : c.name, value: campaignMetrics(c).roas }))
    .sort((a, b) => b.value - a.value);

  const openInvoices = invoices.filter((i) => invoiceOutstanding(i) > 0);

  function exportFinancial() {
    downloadCsv(
      "hirf-financial-report",
      [t("reports.month"), t("dashboard.revenue"), t("dashboard.expenses"), t("dashboard.profit")],
      series.map((m) => [m.month, m.revenue, m.expenses, m.revenue - m.expenses]),
    );
    toast(`${t("common.exportExcel")} ✓`);
  }

  function exportInvoices() {
    downloadCsv(
      "hirf-invoice-aging",
      [t("finance.invoiceNo"), t("common.client"), t("common.total"), t("clients.outstanding"), t("common.dueDate"), t("common.status")],
      openInvoices.map((inv) => [inv.number, clientName(inv.clientId), invoiceTotal(inv), invoiceOutstanding(inv), inv.dueDate, t(`status.${inv.status}`)]),
    );
    toast(`${t("common.exportExcel")} ✓`);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        actions={
          <>
            <Select value={range} onChange={(e) => setRange(e.target.value as Range)} className="w-36 no-print">
              <option value="quarter">{t("reports.quarter")}</option>
              <option value="half">6 {locale === "ar" ? "أشهر" : "months"}</option>
              <option value="year">{t("reports.year")}</option>
            </Select>
            <Button variant="outline" onClick={() => window.print()} className="no-print">
              <Printer className="h-4 w-4" />
              {t("common.exportPdf")}
            </Button>
          </>
        }
      />

      <Tabs defaultValue="financial">
        <TabsList className="no-print">
          <TabsTrigger value="financial">{t("reports.financial")}</TabsTrigger>
          <TabsTrigger value="clients">{t("reports.clientsReport")}</TabsTrigger>
          <TabsTrigger value="team">{t("reports.teamReport")}</TabsTrigger>
          <TabsTrigger value="marketing">{t("reports.marketingReport")}</TabsTrigger>
        </TabsList>

        {/* Financial */}
        <TabsContent value="financial" className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title={t("reports.revenueByMonth")}
                action={
                  <Button variant="ghost" size="sm" onClick={exportFinancial}>
                    <FileDown className="h-4 w-4" />
                    {t("common.exportExcel")}
                  </Button>
                }
              />
              <CardBody>
                <BarsChart
                  data={financialData}
                  series={[
                    { key: "revenue", name: t("dashboard.revenue") },
                    { key: "expenses", name: t("dashboard.expenses") },
                  ]}
                  height={260}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("reports.profitTrend")} />
              <CardBody>
                <TrendAreaChart data={financialData} series={[{ key: "profit", name: t("dashboard.profit") }]} height={260} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader title={t("dashboard.revenueByService")} />
              <CardBody>
                <DonutChart data={revenueByService} height={180} />
              </CardBody>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader
                title={t("reports.invoiceAging")}
                action={
                  <Button variant="ghost" size="sm" onClick={exportInvoices}>
                    <FileDown className="h-4 w-4" />
                    {t("common.exportExcel")}
                  </Button>
                }
              />
              <CardBody className="p-0 pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-bold text-ink-3 uppercase">
                        <th className="px-5 py-2.5 text-start">{t("finance.invoiceNo")}</th>
                        <th className="px-5 py-2.5 text-start">{t("common.client")}</th>
                        <th className="px-5 py-2.5 text-start">{t("clients.outstanding")}</th>
                        <th className="px-5 py-2.5 text-start">{t("common.dueDate")}</th>
                        <th className="px-5 py-2.5 text-start">{t("common.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/60 last:border-0">
                          <td className="px-5 py-2.5 font-semibold text-ink tabular-nums" dir="ltr">{inv.number}</td>
                          <td className="px-5 py-2.5 text-ink-2">{clientName(inv.clientId)}</td>
                          <td className="px-5 py-2.5 font-semibold text-warning tabular-nums">{formatCurrency(invoiceOutstanding(inv), locale)}</td>
                          <td className="px-5 py-2.5 text-ink-2 tabular-nums">{inv.dueDate}</td>
                          <td className="px-5 py-2.5"><StatusBadge status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="clients" className="mt-4 grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title={t("reports.topClients")} />
            <CardBody>
              <RankBarChart data={topClients} height={280} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("clients.title")} />
            <CardBody className="p-0 pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold text-ink-3 uppercase">
                    <th className="px-5 py-2.5 text-start">{t("common.client")}</th>
                    <th className="px-5 py-2.5 text-start">{t("clients.totalBilled")}</th>
                    <th className="px-5 py-2.5 text-start">{t("clients.openProjects")}</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const rollup = clientRollup(client.id);
                    return (
                      <tr key={client.id} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-2.5 font-semibold text-ink">{client.name}</td>
                        <td className="px-5 py-2.5 text-ink-2 tabular-nums">{formatCurrency(rollup.billed, locale)}</td>
                        <td className="px-5 py-2.5 text-ink-2 tabular-nums">{formatNumber(rollup.openProjects, locale)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-4 grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title={t("reports.teamProductivity")} subtitle={t("common.thisMonth")} />
            <CardBody>
              <BarsChart data={productivity} series={[{ key: "value", name: t("team.tasksCompleted") }]} height={260} currency={false} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("team.utilization")} />
            <CardBody className="space-y-4">
              {employees.map((e) => (
                <div key={e.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{e.name}</span>
                    <span className="font-bold text-ink-2 tabular-nums">{formatPercent(e.utilization, locale, 0)}</span>
                  </div>
                  <Progress value={e.utilization} className="mt-1.5" />
                </div>
              ))}
            </CardBody>
          </Card>
        </TabsContent>

        {/* Marketing */}
        <TabsContent value="marketing" className="mt-4">
          <Card>
            <CardHeader title={t("reports.campaignRoas")} />
            <CardBody>
              <RankBarChart data={roasByCampaign} height={300} currency={false} />
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
