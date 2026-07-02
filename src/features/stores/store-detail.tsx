"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowRight, AtSign, Globe, Plug, Radar, Rocket, Server, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { byId, clientName } from "@/lib/data/queries";
import { storePlatformNames } from "@/lib/constants";

export function StoreDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const store = byId.store(id);
  if (!store) notFound();

  return (
    <div className="animate-fade-up">
      <button onClick={() => router.back()} className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" />
        {t("stores.title")}
      </button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{store.name}</h1>
              <Badge tone="info">{storePlatformNames[store.platform]}</Badge>
              <StatusBadge status={store.status} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              <Link href={`/clients/${store.clientId}`} className="font-semibold text-accent hover:text-accent-hover">
                {clientName(store.clientId)}
              </Link>
            </p>
          </div>
          <a
            href={`https://${store.domain}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent"
            dir="ltr"
          >
            <Globe className="h-4 w-4" />
            {store.domain}
          </a>
        </div>

        <div className="mt-5 grid gap-x-8 gap-y-2 text-xs text-ink-2 sm:grid-cols-3">
          <span className="flex items-center gap-1.5"><Server className="h-3.5 w-3.5 text-ink-3" />{t("stores.hosting")}: <b className="text-ink">{store.hosting}</b></span>
          <span className="flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5 text-ink-3" />{t("stores.launchDate")}: <b className="text-ink tabular-nums">{formatDate(store.launchDate, locale)}</b></span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-ink-3" />{t("stores.visitors")} ({t("common.thisMonth")}): <b className="text-ink tabular-nums">{formatNumber(store.visitors, locale)}</b></span>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("stores.monthlySales")} value={formatCurrency(store.monthlySales, locale)} icon={TrendingUp} />
        <StatCard label={t("stores.orders")} value={formatNumber(store.monthlyOrders, locale)} icon={ShoppingCart} />
        <StatCard label={t("stores.conversionRate")} value={formatPercent(store.conversionRate, locale)} icon={Radar} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title={t("stores.integrations")} />
          <CardBody className="flex flex-wrap gap-2">
            {store.integrations.length === 0 ? (
              <p className="text-xs text-ink-3">—</p>
            ) : (
              store.integrations.map((integration) => (
                <span key={integration} className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-ink">
                  <Plug className="h-3.5 w-3.5 text-accent" />
                  {integration}
                </span>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("stores.pixels")} subtitle={t("stores.analytics")} />
          <CardBody className="flex flex-wrap gap-2">
            {store.pixels.map((pixel) => (
              <span key={pixel} className="flex items-center gap-1.5 rounded-xl bg-success-bg px-3 py-2 text-xs font-semibold text-success" dir="ltr">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {pixel}
              </span>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("stores.emails")} />
          <CardBody className="space-y-2">
            {store.emails.map((email) => (
              <p key={email} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-ink" dir="ltr">
                <AtSign className="h-3.5 w-3.5 text-accent" />
                {email}
              </p>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
