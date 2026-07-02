"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftRight, CheckCircle2, FilePlus2, FileText, Plus, Printer, Send, Trash2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useQuotations } from "@/hooks/use-data";
import { clientName, invoiceSubtotal, invoiceTotal, quotesSummary, VAT_RATE } from "@/lib/data/queries";
import { TENANT_ID } from "@/lib/data/seed";
import type { Quotation, QuoteStatus } from "@/types";

const columnHelper = createColumnHelper<Quotation>();

const quoteSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(3),
  validUntil: z.string().min(8),
  items: z.array(
    z.object({
      description: z.string().min(2),
      qty: z.coerce.number().positive(),
      unitPrice: z.coerce.number().positive(),
    }),
  ).min(1),
});
type QuoteForm = z.infer<typeof quoteSchema>;

export default function QuotationsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useQuotations();
  const { data: clients } = useClients();

  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | QuoteStatus>("all");
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setQuotes(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const summary = quotesSummary();
  const filtered = statusFilter === "all" ? quotes : quotes.filter((q) => q.status === statusFilter);

  function setStatus(id: string, status: QuoteStatus, message: string) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    toast(message);
  }

  const columns = useMemo<ColumnDef<Quotation, unknown>[]>(
    () =>
      [
        columnHelper.accessor("number", {
          header: t("quotes.quoteNo"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums" dir="ltr">{info.getValue()}</span>,
        }),
        columnHelper.accessor("title", {
          header: t("common.name"),
          cell: (info) => (
            <span>
              <span className="block max-w-64 truncate font-semibold text-ink">{info.getValue()}</span>
              <span className="block text-xs text-ink-3">{clientName(info.row.original.clientId)}</span>
            </span>
          ),
        }),
        columnHelper.accessor((row) => invoiceTotal(row), {
          id: "total",
          header: t("common.total"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue() as number, locale)}</span>,
        }),
        columnHelper.accessor("issueDate", {
          header: t("finance.issueDate"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("validUntil", {
          header: t("quotes.validUntil"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("status", { header: t("common.status"), cell: (info) => <StatusBadge status={info.getValue()} /> }),
      ] as ColumnDef<Quotation, unknown>[],
    [t, locale],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { items: [{ description: "", qty: 1, unitPrice: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onCreate = handleSubmit((values) => {
    const number = `QT-2026-${String(20 + quotes.length + 1).padStart(3, "0")}`;
    setQuotes((prev) => [
      {
        id: `q-${Date.now()}`,
        tenantId: TENANT_ID,
        number,
        clientId: values.clientId,
        title: values.title,
        status: "draft",
        issueDate: new Date().toISOString().slice(0, 10),
        validUntil: values.validUntil,
        items: values.items,
      },
      ...prev,
    ]);
    reset({ items: [{ description: "", qty: 1, unitPrice: 0 }] });
    setFormOpen(false);
    toast(`${t("quotes.newQuote")}: ${number} ✓`);
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("quotes.title")}
        subtitle={t("quotes.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <FilePlus2 className="h-4 w-4" />
            {t("quotes.newQuote")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("quotes.pipelineValue")} value={formatCurrency(summary.pipeline, locale)} icon={FileText}
          hint={`${formatNumber(summary.openCount, locale)} ${t("quotes.title")}`} />
        <StatCard label={t("quotes.acceptanceRate")} value={formatPercent(summary.acceptanceRate, locale, 0)} icon={CheckCircle2} />
        <StatCard label={t("status.approved")} value={formatCurrency(summary.approvedValue, locale)} icon={ArrowLeftRight} />
      </div>

      <Card>
        {!hydrated ? (
          <TableSkeleton />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            onRowClick={setSelected}
            toolbar={
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | QuoteStatus)} className="w-44">
                <option value="all">{t("common.all")}</option>
                {(["draft", "sent", "approved", "rejected", "expired"] as const).map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </Select>
            }
          />
        )}
      </Card>

      {/* Quote detail */}
      {selected ? (
        <Dialog open onClose={() => setSelected(null)} title={`${selected.number} — ${clientName(selected.clientId)}`} wide
          footer={
            <>
              {selected.status === "draft" ? (
                <Button variant="outline" onClick={() => setStatus(selected.id, "sent", `${t("common.send")} ✓`)}>
                  <Send className="h-4 w-4" />
                  {t("common.send")}
                </Button>
              ) : null}
              {selected.status === "sent" ? (
                <>
                  <Button variant="danger" onClick={() => setStatus(selected.id, "rejected", t("status.rejected"))}>
                    <XCircle className="h-4 w-4" />
                    {t("quotes.reject")}
                  </Button>
                  <Button onClick={() => setStatus(selected.id, "approved", t("status.approved"))}>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("quotes.approve")}
                  </Button>
                </>
              ) : null}
              {selected.status === "approved" ? (
                <>
                  <Button variant="outline" onClick={() => { toast(`${t("quotes.convertToProject")} ✓`); setSelected(null); }}>
                    {t("quotes.convertToProject")}
                  </Button>
                  <Button onClick={() => { toast(`${t("quotes.convertToInvoice")} ✓`); setSelected(null); }}>
                    {t("quotes.convertToInvoice")}
                  </Button>
                </>
              ) : null}
              <Button variant="ghost" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                {t("common.exportPdf")}
              </Button>
            </>
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-ink">{selected.title}</p>
              <p className="mt-0.5 text-xs text-ink-3 tabular-nums">
                {formatDate(selected.issueDate, locale)} → {formatDate(selected.validUntil, locale)}
              </p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold text-ink-3 uppercase">
                <th className="py-2 text-start">{t("common.description")}</th>
                <th className="py-2 text-center">{t("finance.qty")}</th>
                <th className="py-2 text-end">{t("finance.unitPrice")}</th>
                <th className="py-2 text-end">{t("common.total")}</th>
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2.5 text-ink">{item.description}</td>
                  <td className="py-2.5 text-center text-ink-2 tabular-nums">{formatNumber(item.qty, locale)}</td>
                  <td className="py-2.5 text-end text-ink-2 tabular-nums">{formatCurrency(item.unitPrice, locale)}</td>
                  <td className="py-2.5 text-end font-semibold text-ink tabular-nums">{formatCurrency(item.qty * item.unitPrice, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ms-auto w-56 space-y-1.5 text-sm">
            <p className="flex justify-between text-ink-2">
              <span>{t("common.subtotal")}</span>
              <span className="tabular-nums">{formatCurrency(invoiceSubtotal(selected), locale)}</span>
            </p>
            <p className="flex justify-between text-ink-2">
              <span>{t("common.vat")}</span>
              <span className="tabular-nums">{formatCurrency(Math.round(invoiceSubtotal(selected) * VAT_RATE), locale)}</span>
            </p>
            <p className="flex justify-between border-t border-border pt-2 font-bold text-ink">
              <span>{t("common.total")}</span>
              <span className="tabular-nums">{formatCurrency(invoiceTotal(selected), locale)}</span>
            </p>
          </div>
        </Dialog>
      ) : null}

      {/* New quotation */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("quotes.newQuote")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("common.client")} error={errors.clientId && t("common.invalidValue")}>
              <Select {...register("clientId")}>
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("quotes.validUntil")} error={errors.validUntil && t("common.invalidValue")}>
              <Input type="date" dir="ltr" {...register("validUntil")} />
            </Field>
          </div>
          <Field label={t("common.name")} error={errors.title && t("common.invalidValue")}>
            <Input {...register("title")} />
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink-2">{t("finance.items")}</p>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input placeholder={t("common.description")} className="flex-1" {...register(`items.${i}.description`)} />
                  <Input type="number" min={1} placeholder={t("finance.qty")} className="w-20" dir="ltr" {...register(`items.${i}.qty`)} />
                  <Input type="number" min={0} placeholder={t("finance.unitPrice")} className="w-28" dir="ltr" {...register(`items.${i}.unitPrice`)} />
                  <Button variant="ghost" size="icon" type="button" onClick={() => remove(i)} disabled={fields.length === 1} aria-label={t("common.delete")}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.items ? <p className="mt-1 text-xs text-danger">{t("common.invalidValue")}</p> : null}
            <Button variant="outline" size="sm" type="button" className="mt-2" onClick={() => append({ description: "", qty: 1, unitPrice: 0 })}>
              <Plus className="h-3.5 w-3.5" />
              {t("common.add")}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
