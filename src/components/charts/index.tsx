"use client";

// Recharts wrappers themed for HIRF. Chart canvases render LTR (numeric axes)
// while labels/tooltips stay localized — standard practice for RTL dashboards.

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatNumber } from "@/lib/format";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency?: boolean;
}) {
  const { locale } = useI18n();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-pop" dir={locale === "ar" ? "rtl" : "ltr"}>
      {label ? <p className="mb-1 font-bold text-ink">{label}</p> : null}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-1.5 py-0.5 text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-semibold text-ink tabular-nums">
            {typeof entry.value === "number"
              ? currency
                ? formatCurrency(entry.value, locale, true)
                : formatNumber(entry.value, locale)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-4 px-1">
      {items.map((item) => (
        <span key={item.name} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

/** Two-series area trend (e.g. revenue vs expenses). */
export function TrendAreaChart({
  data,
  series,
  height = 280,
  currency = true,
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string }[];
  height?: number;
  currency?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <div>
      {series.length > 1 ? (
        <ChartLegend items={series.map((s, i) => ({ name: s.name, color: CHART_COLORS[i] }))} />
      ) : null}
      <div dir="ltr" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[i]} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) => formatNumber(v / 1000, locale) + (locale === "ar" ? " ألف" : "k")}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: "var(--border)" }} />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Vertical bars with rounded data-ends. */
export function BarsChart({
  data,
  series,
  height = 280,
  currency = true,
}: {
  data: Record<string, string | number>[];
  series: { key: string; name: string }[];
  height?: number;
  currency?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <div>
      {series.length > 1 ? (
        <ChartLegend items={series.map((s, i) => ({ name: s.name, color: CHART_COLORS[i] }))} />
      ) : null}
      <div dir="ltr" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) =>
                currency ? formatNumber(v / 1000, locale) + (locale === "ar" ? " ألف" : "k") : formatNumber(v, locale)
              }
            />
            <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "var(--surface-2)" }} />
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Horizontal ranking bars — one color (magnitude, not identity). */
export function RankBarChart({
  data,
  height = 280,
  currency = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  currency?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              currency ? formatNumber(v / 1000, locale) + (locale === "ar" ? " ألف" : "k") : formatNumber(v, locale)
            }
          />
          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={130} />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="value" name="" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with legend; identity colors in fixed order + 2px surface gaps. */
export function DonutChart({
  data,
  height = 240,
  currency = true,
}: {
  data: { name: string; value: number }[];
  height?: number;
  currency?: boolean;
}) {
  const { locale } = useI18n();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div dir="ltr" style={{ height, width: height }} className="shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="var(--surface)"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 w-full flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-ink-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-semibold text-ink tabular-nums">
              {formatNumber((d.value / total) * 100, locale, 0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
