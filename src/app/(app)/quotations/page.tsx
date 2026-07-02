"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeftRight, CheckCircle2, FilePlus2, FileText, Send, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useQuotations } from "@/hooks/use-data";
import { clientName, invoiceTotal, quotesSummary } from "@/lib/data/queries";
import { TENANT_ID } from "@/lib/data/seed";
import { DocumentSheet } from "@/features/documents/document-sheet";
import { fromQuotation, quotationToInvoiceDraft } from "@/features/documents/model";
import { emptyItem, itemsValid, LineItemsEditor } from "@/features/documents/line-items-editor";
import type { InvoiceItem, Quotation, QuoteStatus } from "@/types";

const columnHelper = createColumnHelper<Quotation>();

const quoteSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(3),
  validUntil: z.string().min(8),
  notes: z.string().optional(),
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [editingItems, setEditingItems] = useState<InvoiceItem[] | null>(null);

  useEffect(() => {
    if (!isLoading && !hydrated) {
      setQuotes(fetched);
      setHydrated(true);
    }
  }, [isLoading, hydrated, fetched]);

  const summary = quotesSummary();
  const filtered = statusFilter === "all" ? quotes : quotes.filter((q) => q.status === statusFilter);
  const selected = quotes.find((q) => q.id === selectedId) ?? null;

  function setStatus(id: string, status: QuoteStatus, message: string) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    toast(message);
  }

  function convertToInvoice(quote: Quotation) {
    const dueDate = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
    const draft = quotationToInvoiceDraft(quote, `INV-2026-${String(60 + quotes.length)}`, dueDate);
    toast(`${t("quotes.convertToInvoice")}: ${draft.number} ✓`);
    setSelectedId(null);
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteForm>({ resolver: zodResolver(quoteSchema) });

  const onCreate = handleSubmit((values) => {
    if (!itemsValid(formItems)) {
      toast(t("common.invalidValue"), "error");
      return;
    }
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
        items: formItems,
        notes: values.notes,
      },
      ...prev,
    ]);
    reset();
    setFormItems([emptyItem()]);
    setFormOpen(false);
    toast(`${t("quotes.newQuote")}: ${number} ✓`);
  });

  function saveEditedItems() {
    if (!selected || !editingItems || !itemsValid(editingItems)) {
      toast(t("common.invalidValue"), "error");
      return;
    }
    setQuotes((prev) => prev.map((q) => (q.id === selected.id ? { ...q, items: editingItems } : q)));
    setEditingItems(null);
    toast(`${t("docs.editItems")} ✓`);
  }

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
            onRowClick={(q) => setSelectedId(q.id)}
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

      {/* Premium A4 document view */}
      {selected ? (
        <DocumentSheet
          doc={fromQuotation(selected)}
          onClose={() => setSelectedId(null)}
          onEditItems={() => setEditingItems(selected.items.map((i) => ({ ...i })))}
          actions={
            <>
              {selected.status === "draft" ? (
                <Button variant="outline" size="sm" onClick={() => setStatus(selected.id, "sent", `${t("common.send")} ✓`)}>
                  <Send className="h-4 w-4" />
                  {t("common.send")}
                </Button>
              ) : null}
              {selected.status === "sent" ? (
                <>
                  <Button variant="danger" size="sm" onClick={() => setStatus(selected.id, "rejected", t("status.rejected"))}>
                    <XCircle className="h-4 w-4" />
                    {t("quotes.reject")}
                  </Button>
                  <Button size="sm" onClick={() => setStatus(selected.id, "approved", t("status.approved"))}>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("quotes.approve")}
                  </Button>
                </>
              ) : null}
              {selected.status === "approved" ? (
                <Button size="sm" onClick={() => convertToInvoice(selected)}>
                  <ArrowLeftRight className="h-4 w-4" />
                  {t("quotes.convertToInvoice")}
                </Button>
              ) : null}
            </>
          }
        />
      ) : null}

      {/* Edit items */}
      {selected && editingItems ? (
        <Dialog open onClose={() => setEditingItems(null)} title={`${t("docs.editItems")} — ${selected.number}`} wide
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingItems(null)}>{t("common.cancel")}</Button>
              <Button onClick={saveEditedItems}>{t("common.save")}</Button>
            </>
          }
        >
          <LineItemsEditor items={editingItems} onChange={setEditingItems} />
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
            <LineItemsEditor items={formItems} onChange={setFormItems} />
          </div>
          <Field label={t("common.notes")}>
            <Textarea rows={2} {...register("notes")} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
