"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins, MousePointerClick, Plus, Target, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCampaigns, useClients } from "@/hooks/use-data";
import { campaignMetrics, clientName, marketingSummary, spendByPlatform } from "@/lib/data/queries";
import { TENANT_ID } from "@/lib/data/seed";
import { adPlatformNames as platformNames } from "@/lib/constants";
import { BarsChart } from "@/components/charts";
import type { Campaign, CampaignPlatform } from "@/types";

const columnHelper = createColumnHelper<Campaign>();

const campaignSchema = z.object({
  name: z.string().min(3),
  clientId: z.string().min(1),
  platform: z.enum(["meta", "google", "tiktok", "snapchat", "linkedin"]),
  objective: z.string().min(2),
  budget: z.coerce.number().positive(),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
});
type CampaignForm = z.infer<typeof campaignSchema>;

export default function MarketingPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useCampaigns();
  const { data: clients } = useClients();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | CampaignPlatform>("all");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setCampaigns(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const summary = marketingSummary();
  const platformSpend = spendByPlatform().map((p) => ({
    label: platformNames[p.platform as CampaignPlatform],
    value: p.spend,
  }));

  const filtered = platformFilter === "all" ? campaigns : campaigns.filter((c) => c.platform === platformFilter);

  const columns = useMemo<ColumnDef<Campaign, unknown>[]>(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("common.name"),
          cell: (info) => (
            <span>
              <span className="block max-w-64 truncate font-semibold text-ink">{info.getValue()}</span>
              <span className="block text-xs text-ink-3">{clientName(info.row.original.clientId)}</span>
            </span>
          ),
        }),
        columnHelper.accessor("platform", {
          header: t("marketing.platform"),
          cell: (info) => <Badge tone="info">{platformNames[info.getValue()]}</Badge>,
        }),
        columnHelper.accessor("spend", {
          header: t("marketing.adSpend"),
          cell: (info) => (
            <span className="block w-28">
              <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue(), locale, true)}</span>
              <Progress value={(info.getValue() / info.row.original.budget) * 100} className="mt-1.5" tone="accent" />
            </span>
          ),
        }),
        columnHelper.accessor((row) => campaignMetrics(row).roas, {
          id: "roas",
          header: t("marketing.roas"),
          cell: (info) => {
            const v = info.getValue() as number;
            return <span className={`font-bold tabular-nums ${v >= 3 ? "text-success" : v >= 1 ? "text-ink" : "text-ink-3"}`}>{formatNumber(v, locale, 1)}×</span>;
          },
        }),
        columnHelper.accessor((row) => campaignMetrics(row).cpa, {
          id: "cpa",
          header: t("marketing.cpa"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatCurrency(info.getValue() as number, locale)}</span>,
        }),
        columnHelper.accessor((row) => campaignMetrics(row).ctr, {
          id: "ctr",
          header: t("marketing.ctr"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatPercent(info.getValue() as number, locale)}</span>,
        }),
        columnHelper.accessor("conversions", {
          header: t("marketing.conversions"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatNumber(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("status", { header: t("common.status"), cell: (info) => <StatusBadge status={info.getValue()} /> }),
      ] as ColumnDef<Campaign, unknown>[],
    [t, locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignForm>({ resolver: zodResolver(campaignSchema), defaultValues: { platform: "meta" } });

  const onCreate = handleSubmit((values) => {
    setCampaigns((prev) => [
      {
        id: `cp-${Date.now()}`,
        tenantId: TENANT_ID,
        clientId: values.clientId,
        name: values.name,
        platform: values.platform,
        objective: values.objective,
        status: "draft",
        budget: values.budget,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: values.startDate,
        endDate: values.endDate,
      },
      ...prev,
    ]);
    reset({ platform: "meta" });
    setFormOpen(false);
    toast(`${t("marketing.newCampaign")}: ${values.name} ✓`);
  });

  const err = (k: keyof CampaignForm) => (errors[k] ? t("common.noResultsHint") : undefined);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("marketing.title")}
        subtitle={t("marketing.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("marketing.newCampaign")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("marketing.adSpend")} value={formatCurrency(summary.spend, locale)} icon={Coins}
          hint={`${formatNumber(summary.activeCount, locale)} ${t("status.active")}`} />
        <StatCard label={t("marketing.revenueGenerated")} value={formatCurrency(summary.revenue, locale)} icon={TrendingUp} />
        <StatCard label={t("marketing.roas")} value={`${formatNumber(summary.roas, locale, 1)}×`} icon={Target} />
        <StatCard label={t("marketing.conversions")} value={formatNumber(summary.conversions, locale)} icon={MousePointerClick} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          {!hydrated ? (
            <TableSkeleton />
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              onRowClick={setSelected}
              toolbar={
                <Select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as "all" | CampaignPlatform)} className="w-44">
                  <option value="all">{t("marketing.platform")}: {t("common.all")}</option>
                  {(Object.keys(platformNames) as CampaignPlatform[]).map((p) => (
                    <option key={p} value={p}>{platformNames[p]}</option>
                  ))}
                </Select>
              }
            />
          )}
        </Card>
        <Card className="h-fit">
          <CardHeader title={t("marketing.spendByPlatform")} />
          <CardBody>
            <BarsChart data={platformSpend} series={[{ key: "value", name: t("marketing.adSpend") }]} height={260} />
          </CardBody>
        </Card>
      </div>

      {/* Campaign detail */}
      {selected ? (
        <Dialog open onClose={() => setSelected(null)} title={selected.name} wide>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{platformNames[selected.platform]}</Badge>
            <StatusBadge status={selected.status} />
            <Badge tone="neutral">{selected.objective}</Badge>
            <span className="ms-auto text-xs text-ink-3 tabular-nums">
              {formatDate(selected.startDate, locale)} → {formatDate(selected.endDate, locale)}
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-2">
            {t("common.client")}: <b className="text-ink">{clientName(selected.clientId)}</b>
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-ink-2">
              <span>{t("common.spent")}: <b className="text-ink tabular-nums">{formatCurrency(selected.spend, locale)}</b></span>
              <span>{t("common.budget")}: <b className="text-ink tabular-nums">{formatCurrency(selected.budget, locale)}</b></span>
            </div>
            <Progress value={(selected.spend / selected.budget) * 100} className="mt-2 h-2" tone="accent" />
          </div>
          {(() => {
            const metrics = campaignMetrics(selected);
            const cells = [
              { label: t("marketing.roas"), value: `${formatNumber(metrics.roas, locale, 1)}×` },
              { label: t("marketing.cpa"), value: formatCurrency(metrics.cpa, locale) },
              { label: t("marketing.ctr"), value: formatPercent(metrics.ctr, locale) },
              { label: t("marketing.cpc"), value: formatCurrency(metrics.cpc, locale) },
              { label: t("marketing.cpm"), value: formatCurrency(metrics.cpm, locale) },
              { label: t("marketing.impressions"), value: formatNumber(selected.impressions, locale) },
              { label: t("marketing.clicks"), value: formatNumber(selected.clicks, locale) },
              { label: t("marketing.conversions"), value: formatNumber(selected.conversions, locale) },
              { label: t("marketing.revenueGenerated"), value: formatCurrency(selected.revenue, locale) },
            ];
            return (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {cells.map((cell) => (
                  <div key={cell.label} className="rounded-xl bg-surface-2 p-3 text-center">
                    <p className="text-[10px] font-bold text-ink-3 uppercase">{cell.label}</p>
                    <p className="mt-1 text-sm font-bold text-ink tabular-nums">{cell.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </Dialog>
      ) : null}

      {/* New campaign */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("marketing.newCampaign")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t("common.name")} error={err("name")} className="sm:col-span-2">
            <Input {...register("name")} />
          </Field>
          <Field label={t("common.client")} error={err("clientId")}>
            <Select {...register("clientId")}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("marketing.platform")}>
            <Select {...register("platform")}>
              {(Object.keys(platformNames) as CampaignPlatform[]).map((p) => (
                <option key={p} value={p}>{platformNames[p]}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("marketing.objective")} error={err("objective")}>
            <Input placeholder="تحويلات / مبيعات المتجر / عملاء محتملون…" {...register("objective")} />
          </Field>
          <Field label={t("common.budget")} error={err("budget")}>
            <Input type="number" min={0} dir="ltr" {...register("budget")} />
          </Field>
          <Field label={t("projects.startDate")} error={err("startDate")}>
            <Input type="date" dir="ltr" {...register("startDate")} />
          </Field>
          <Field label={t("projects.deadline")} error={err("endDate")}>
            <Input type="date" dir="ltr" {...register("endDate")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
