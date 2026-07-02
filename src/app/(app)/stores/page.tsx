"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Plus, ShoppingCart, Store as StoreIcon, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useStores } from "@/hooks/use-data";
import { clientName } from "@/lib/data/queries";
import { storePlatformNames } from "@/lib/constants";
import { TENANT_ID } from "@/lib/data/seed";
import type { Store, StorePlatform } from "@/types";

const storeSchema = z.object({
  name: z.string().min(2),
  clientId: z.string().min(1),
  platform: z.enum(["salla", "zid", "shopify", "woocommerce"]),
  domain: z.string().min(4),
  hosting: z.string().min(2),
  launchDate: z.string().min(8),
});
type StoreForm = z.infer<typeof storeSchema>;

export default function StoresPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useStores();
  const { data: clients } = useClients();
  const [created, setCreated] = useState<Store[]>([]);
  const [platformFilter, setPlatformFilter] = useState<"all" | StorePlatform>("all");
  const [formOpen, setFormOpen] = useState(false);

  const stores = useMemo(() => [...created, ...fetched], [created, fetched]);
  const filtered = platformFilter === "all" ? stores : stores.filter((s) => s.platform === platformFilter);

  const liveStores = stores.filter((s) => s.status === "live");
  const totalSales = stores.reduce((sum, s) => sum + s.monthlySales, 0);
  const totalOrders = stores.reduce((sum, s) => sum + s.monthlyOrders, 0);
  const avgConversion = liveStores.length
    ? liveStores.reduce((sum, s) => sum + s.conversionRate, 0) / liveStores.length
    : 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoreForm>({ resolver: zodResolver(storeSchema), defaultValues: { platform: "salla" } });

  const onCreate = handleSubmit((values) => {
    setCreated((prev) => [
      {
        id: `st-${Date.now()}`,
        tenantId: TENANT_ID,
        clientId: values.clientId,
        name: values.name,
        platform: values.platform,
        status: "development",
        domain: values.domain,
        hosting: values.hosting,
        launchDate: values.launchDate,
        monthlySales: 0,
        monthlyOrders: 0,
        visitors: 0,
        conversionRate: 0,
        integrations: [],
        pixels: [],
        emails: [],
      },
      ...prev,
    ]);
    reset({ platform: "salla" });
    setFormOpen(false);
    toast(`${t("stores.addStore")}: ${values.name} ✓`);
  });

  const err = (k: keyof StoreForm) => (errors[k] ? t("common.noResultsHint") : undefined);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("stores.title")}
        subtitle={t("stores.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("stores.addStore")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("stores.title")} value={formatNumber(stores.length, locale)} icon={StoreIcon}
          hint={`${formatNumber(liveStores.length, locale)} ${t("status.live")}`} />
        <StatCard label={t("stores.monthlySales")} value={formatCurrency(totalSales, locale)} icon={TrendingUp} />
        <StatCard label={t("stores.orders")} value={formatNumber(totalOrders, locale)} icon={ShoppingCart} />
        <StatCard label={t("stores.conversionRate")} value={formatPercent(avgConversion, locale)} icon={Globe} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${platformFilter === "all" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
        >
          {t("common.all")}
        </button>
        {(Object.keys(storePlatformNames) as StorePlatform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${platformFilter === p ? "bg-primary text-primary-foreground" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
          >
            {storePlatformNames[p]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={StoreIcon} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="info">{storePlatformNames[store.platform]}</Badge>
                  <StatusBadge status={store.status} />
                </div>
                <h3 className="mt-3 font-bold text-ink">{store.name}</h3>
                <p className="mt-0.5 text-xs text-ink-3">{clientName(store.clientId)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-accent" dir="ltr">
                  <Globe className="h-3.5 w-3.5" />
                  {store.domain}
                </p>
                <div className="mt-auto grid grid-cols-3 gap-2 pt-4 text-center">
                  <div className="rounded-xl bg-surface-2 p-2">
                    <p className="text-[9px] font-bold text-ink-3 uppercase">{t("stores.monthlySales")}</p>
                    <p className="mt-0.5 text-xs font-bold text-ink tabular-nums">{formatCurrency(store.monthlySales, locale, true)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-2">
                    <p className="text-[9px] font-bold text-ink-3 uppercase">{t("stores.orders")}</p>
                    <p className="mt-0.5 text-xs font-bold text-ink tabular-nums">{formatNumber(store.monthlyOrders, locale)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-2">
                    <p className="text-[9px] font-bold text-ink-3 uppercase">{t("stores.conversionRate")}</p>
                    <p className="mt-0.5 text-xs font-bold text-ink tabular-nums">{formatPercent(store.conversionRate, locale)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("stores.addStore")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t("common.name")} error={err("name")}>
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
              {(Object.keys(storePlatformNames) as StorePlatform[]).map((p) => (
                <option key={p} value={p}>{storePlatformNames[p]}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("stores.domain")} error={err("domain")}>
            <Input dir="ltr" placeholder="store.example.sa" {...register("domain")} />
          </Field>
          <Field label={t("stores.hosting")} error={err("hosting")}>
            <Input placeholder="سلة كلاود / Hostinger VPS…" {...register("hosting")} />
          </Field>
          <Field label={t("stores.launchDate")} error={err("launchDate")}>
            <Input type="date" dir="ltr" {...register("launchDate")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
