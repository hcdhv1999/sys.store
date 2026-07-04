"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, Package, Plus, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCatalog } from "@/hooks/use-data";
import { TENANT_ID } from "@/lib/data/seed";
import type { CatalogItem, CatalogKind } from "@/types";

const columnHelper = createColumnHelper<CatalogItem>();

const itemSchema = z.object({
  name: z.string().min(2),
  kind: z.enum(["product", "service"]),
  category: z.string().min(2),
  sku: z.string().min(2),
  unit: z.string().min(1),
  price: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  vatApplicable: z.boolean(),
  active: z.boolean(),
  description: z.string().optional(),
});
type ItemForm = z.infer<typeof itemSchema>;

export default function CatalogPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useCatalog();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [kindFilter, setKindFilter] = useState<"all" | CatalogKind>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setItems(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const filtered = items.filter(
    (i) => (kindFilter === "all" || i.kind === kindFilter) && (categoryFilter === "all" || i.category === categoryFilter),
  );

  const services = items.filter((i) => i.kind === "service").length;
  const avgMargin = items.length
    ? (items.reduce((s, i) => s + (i.price > 0 ? (i.price - i.cost) / i.price : 0), 0) / items.length) * 100
    : 0;

  function toggleActive(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, active: !i.active } : i)));
    toast(`${t("common.updated")} ✓`, "info");
  }

  const columns = useMemo<ColumnDef<CatalogItem, unknown>[]>(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("common.name"),
          cell: (info) => (
            <span>
              <span className="block max-w-64 truncate font-semibold text-ink">{info.getValue()}</span>
              <span className="block max-w-64 truncate text-xs text-ink-3">{info.row.original.description}</span>
            </span>
          ),
        }),
        columnHelper.accessor("kind", {
          header: t("catalog.kind"),
          cell: (info) => (
            <Badge tone={info.getValue() === "service" ? "info" : "accent"}>
              {t(info.getValue() === "service" ? "catalog.service" : "catalog.product")}
            </Badge>
          ),
        }),
        columnHelper.accessor("category", { header: t("catalog.category"), cell: (info) => <span className="text-ink-2">{info.getValue()}</span> }),
        columnHelper.accessor("sku", {
          header: t("catalog.sku"),
          cell: (info) => <code className="text-xs text-ink-3" dir="ltr">{info.getValue()}</code>,
        }),
        columnHelper.accessor("unit", { header: t("catalog.unit"), cell: (info) => <span className="text-ink-2">{info.getValue()}</span> }),
        columnHelper.accessor("price", {
          header: t("catalog.price"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor((row) => (row.price > 0 ? ((row.price - row.cost) / row.price) * 100 : 0), {
          id: "margin",
          header: t("catalog.margin"),
          cell: (info) => {
            const v = info.getValue() as number;
            return <span className={`tabular-nums ${v >= 50 ? "text-success" : "text-ink-2"}`}>{formatPercent(v, locale, 0)}</span>;
          },
        }),
        columnHelper.accessor("vatApplicable", {
          header: t("common.vat"),
          cell: (info) => (info.getValue() ? <span className="text-xs text-ink-2">15%</span> : <Badge tone="neutral">{t("catalog.vatExempt")}</Badge>),
        }),
        columnHelper.accessor("active", {
          header: t("common.status"),
          cell: (info) => (
            <button
              role="switch"
              aria-checked={info.getValue()}
              aria-label={t("status.active")}
              onClick={(e) => {
                e.stopPropagation();
                toggleActive(info.row.original.id);
              }}
              className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${info.getValue() ? "bg-success" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-all ${info.getValue() ? "ltr:left-4.5 rtl:right-4.5" : "ltr:left-0.5 rtl:right-0.5"}`} />
            </button>
          ),
        }),
      ] as ColumnDef<CatalogItem, unknown>[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues: { kind: "service", vatApplicable: true, active: true } });

  function openCreate() {
    setEditing(null);
    reset({ kind: "service", vatApplicable: true, active: true, name: "", category: "", sku: "", unit: "", description: "" });
    setFormOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    reset({ ...item });
    setFormOpen(true);
  }

  const onSave = handleSubmit((values) => {
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...editing, ...values, description: values.description ?? "" } : i)));
      toast(`${t("common.save")} ✓`);
    } else {
      setItems((prev) => [
        { id: `ci-${Date.now()}`, tenantId: TENANT_ID, ...values, description: values.description ?? "" },
        ...prev,
      ]);
      toast(`${t("catalog.addItem")}: ${values.name} ✓`);
    }
    setFormOpen(false);
  });

  const err = (k: keyof ItemForm) => (errors[k] ? t("common.invalidValue") : undefined);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("catalog.title")}
        subtitle={t("catalog.subtitle")}
        actions={
          <Button variant="accent" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("catalog.addItem")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("catalog.title")} value={formatNumber(items.length, locale)} icon={Boxes}
          hint={`${formatNumber(items.filter((i) => i.active).length, locale)} ${t("status.active")}`} />
        <StatCard label={t("catalog.service")} value={formatNumber(services, locale)} icon={Wrench}
          hint={`${formatNumber(items.length - services, locale)} ${t("catalog.product")}`} />
        <StatCard label={t("catalog.margin")} value={formatPercent(avgMargin, locale, 0)} icon={Package} />
      </div>

      <Card>
        {!hydrated ? (
          <TableSkeleton />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            onRowClick={openEdit}
            toolbar={
              <>
                <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "all" | CatalogKind)} className="w-36">
                  <option value="all">{t("catalog.kind")}: {t("common.all")}</option>
                  <option value="service">{t("catalog.service")}</option>
                  <option value="product">{t("catalog.product")}</option>
                </Select>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40">
                  <option value="all">{t("catalog.category")}: {t("common.all")}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </>
            }
          />
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `${t("common.edit")} — ${editing.name}` : t("catalog.addItem")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onSave} disabled={isSubmitting}>{editing ? t("common.save") : t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t("common.name")} error={err("name")} className="sm:col-span-2">
            <Input {...register("name")} />
          </Field>
          <Field label={t("catalog.kind")}>
            <Select {...register("kind")}>
              <option value="service">{t("catalog.service")}</option>
              <option value="product">{t("catalog.product")}</option>
            </Select>
          </Field>
          <Field label={t("catalog.category")} error={err("category")}>
            <Input placeholder="التصميم / التطوير / اشتراكات…" {...register("category")} />
          </Field>
          <Field label={t("catalog.sku")} error={err("sku")}>
            <Input dir="ltr" placeholder="SRV-XXX-01" {...register("sku")} />
          </Field>
          <Field label={t("catalog.unit")} error={err("unit")}>
            <Input placeholder="مشروع / شهر / ساعة…" {...register("unit")} />
          </Field>
          <Field label={t("catalog.price")} error={err("price")}>
            <Input type="number" min={0} dir="ltr" {...register("price")} />
          </Field>
          <Field label={t("catalog.cost")} error={err("cost")}>
            <Input type="number" min={0} dir="ltr" {...register("cost")} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...register("vatApplicable")} />
            {t("catalog.vatApplicable")}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...register("active")} />
            {t("status.active")}
          </label>
          <Field label={t("common.description")} className="sm:col-span-2">
            <Textarea rows={2} {...register("description")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
