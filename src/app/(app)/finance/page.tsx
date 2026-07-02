"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlarmClock, BadgeCheck, Banknote, Landmark, Plus, ReceiptText, Repeat, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useExpenses, useInvoices } from "@/hooks/use-data";
import {
  clientName,
  expensesByCategory,
  financeSummary,
  invoiceOutstanding,
  invoiceTotal,
} from "@/lib/data/queries";
import { monthlyFinancials, TENANT_ID } from "@/lib/data/seed";
import { DonutChart, TrendAreaChart } from "@/components/charts";
import { DocumentSheet } from "@/features/documents/document-sheet";
import { fromInvoice } from "@/features/documents/model";
import { emptyItem, itemsValid, LineItemsEditor } from "@/features/documents/line-items-editor";
import type { Expense, Invoice, InvoiceItem, InvoiceStatus } from "@/types";

const invoiceColumnHelper = createColumnHelper<Invoice>();
const expenseColumnHelper = createColumnHelper<Expense>();

const invoiceSchema = z.object({
  clientId: z.string().min(1),
  dueDate: z.string().min(8),
  recurring: z.boolean(),
  notes: z.string().optional(),
});
type InvoiceForm = z.infer<typeof invoiceSchema>;

const expenseSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  vendor: z.string().min(2),
  amount: z.coerce.number().positive(),
  date: z.string().min(8),
  recurring: z.boolean(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

export default function FinancePage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetchedInvoices, isLoading: invoicesLoading } = useInvoices();
  const { data: fetchedExpenses, isLoading: expensesLoading } = useExpenses();
  const { data: clients } = useClients();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | InvoiceStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [editingItems, setEditingItems] = useState<InvoiceItem[] | null>(null);

  useEffect(() => {
    if (!invoicesLoading && !expensesLoading && !hydrated) {
      setInvoices(fetchedInvoices);
      setExpenses(fetchedExpenses);
      setHydrated(true);
    }
  }, [invoicesLoading, expensesLoading, hydrated, fetchedInvoices, fetchedExpenses]);

  const summary = financeSummary();
  const monthLabel = (m: string) =>
    new Date(m + "-01").toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { month: "short" });
  const cashflow = monthlyFinancials.map((m) => ({
    label: monthLabel(m.month),
    net: m.revenue - m.expenses,
  }));

  const filteredInvoices = invoiceFilter === "all" ? invoices : invoices.filter((i) => i.status === invoiceFilter);
  const selected = invoices.find((i) => i.id === selectedId) ?? null;

  function markPaid(id: string) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" as const, paidAmount: invoiceTotal(inv) } : inv)),
    );
    toast(`${t("finance.markPaid")} ✓`);
  }

  const invoiceColumns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () =>
      [
        invoiceColumnHelper.accessor("number", {
          header: t("finance.invoiceNo"),
          cell: (info) => (
            <span className="flex items-center gap-2 font-semibold text-ink tabular-nums" dir="ltr">
              {info.getValue()}
              {info.row.original.recurring ? <Repeat className="h-3.5 w-3.5 text-info" aria-label={t("finance.recurring")} /> : null}
            </span>
          ),
        }),
        invoiceColumnHelper.accessor((row) => clientName(row.clientId), {
          id: "client",
          header: t("common.client"),
          cell: (info) => <span className="text-ink-2">{info.getValue() as string}</span>,
        }),
        invoiceColumnHelper.accessor((row) => invoiceTotal(row), {
          id: "total",
          header: t("common.total"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue() as number, locale)}</span>,
        }),
        invoiceColumnHelper.accessor((row) => invoiceOutstanding(row), {
          id: "outstanding",
          header: t("clients.outstanding"),
          cell: (info) => {
            const v = info.getValue() as number;
            return <span className={v > 0 ? "font-semibold text-warning tabular-nums" : "text-ink-3 tabular-nums"}>{formatCurrency(v, locale)}</span>;
          },
        }),
        invoiceColumnHelper.accessor("dueDate", {
          header: t("common.dueDate"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
        invoiceColumnHelper.accessor("status", { header: t("common.status"), cell: (info) => <StatusBadge status={info.getValue()} /> }),
      ] as ColumnDef<Invoice, unknown>[],
    [t, locale],
  );

  const expenseColumns = useMemo<ColumnDef<Expense, unknown>[]>(
    () =>
      [
        expenseColumnHelper.accessor("title", {
          header: t("common.name"),
          cell: (info) => (
            <span className="flex items-center gap-2 font-semibold text-ink">
              {info.getValue()}
              {info.row.original.recurring ? <Repeat className="h-3.5 w-3.5 text-info" /> : null}
            </span>
          ),
        }),
        expenseColumnHelper.accessor("category", {
          header: t("finance.category"),
          cell: (info) => <Badge tone="neutral">{info.getValue()}</Badge>,
        }),
        expenseColumnHelper.accessor("vendor", { header: t("finance.vendor"), cell: (info) => <span className="text-ink-2">{info.getValue()}</span> }),
        expenseColumnHelper.accessor("amount", {
          header: t("common.amount"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue(), locale)}</span>,
        }),
        expenseColumnHelper.accessor("date", {
          header: t("common.date"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
      ] as ColumnDef<Expense, unknown>[],
    [t, locale],
  );

  // Invoice form
  const invoiceForm = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { recurring: false },
  });

  const onCreateInvoice = invoiceForm.handleSubmit((values) => {
    if (!itemsValid(formItems)) {
      toast(t("common.invalidValue"), "error");
      return;
    }
    const number = `INV-2026-${String(54 + invoices.length + 1 - 12).padStart(3, "0")}`;
    setInvoices((prev) => [
      {
        id: `inv-${Date.now()}`,
        tenantId: TENANT_ID,
        number,
        clientId: values.clientId,
        projectId: null,
        status: "draft",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: values.dueDate,
        items: formItems,
        paidAmount: 0,
        recurring: values.recurring,
        notes: values.notes,
      },
      ...prev,
    ]);
    invoiceForm.reset({ recurring: false });
    setFormItems([emptyItem()]);
    setInvoiceFormOpen(false);
    toast(`${t("finance.newInvoice")}: ${number} ✓`);
  });

  function saveEditedItems() {
    if (!selected || !editingItems || !itemsValid(editingItems)) {
      toast(t("common.invalidValue"), "error");
      return;
    }
    setInvoices((prev) => prev.map((inv) => (inv.id === selected.id ? { ...inv, items: editingItems } : inv)));
    setEditingItems(null);
    toast(`${t("docs.editItems")} ✓`);
  }

  // Expense form
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { recurring: false, date: "2026-07-02" },
  });
  const onCreateExpense = expenseForm.handleSubmit((values) => {
    setExpenses((prev) => [
      { id: `ex-${Date.now()}`, tenantId: TENANT_ID, ...values },
      ...prev,
    ]);
    expenseForm.reset({ recurring: false, date: "2026-07-02" });
    setExpenseFormOpen(false);
    toast(`${t("finance.newExpense")} ✓`);
  });

  const errI = (k: "clientId" | "dueDate") => (invoiceForm.formState.errors[k] ? t("common.invalidValue") : undefined);
  const errE = (k: keyof ExpenseForm) => (expenseForm.formState.errors[k] ? t("common.invalidValue") : undefined);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("finance.title")}
        subtitle={t("finance.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => setExpenseFormOpen(true)}>
              <ReceiptText className="h-4 w-4" />
              {t("finance.newExpense")}
            </Button>
            <Button variant="accent" onClick={() => setInvoiceFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("finance.newInvoice")}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("finance.collectedThisMonth")} value={formatCurrency(summary.paidThisMonth, locale)} icon={BadgeCheck} />
        <StatCard label={t("finance.outstandingTotal")} value={formatCurrency(summary.outstanding, locale)} icon={Wallet} />
        <StatCard label={t("finance.overdueTotal")} value={formatCurrency(summary.overdue, locale)} icon={AlarmClock} />
        <StatCard label={t("finance.vatDue")} value={formatCurrency(summary.vatDue, locale)} icon={Landmark} />
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">{t("finance.invoices")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("finance.expenses")}</TabsTrigger>
          <TabsTrigger value="cashflow">{t("finance.cashflow")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            {!hydrated ? (
              <TableSkeleton />
            ) : (
              <DataTable
                data={filteredInvoices}
                columns={invoiceColumns}
                onRowClick={(inv) => setSelectedId(inv.id)}
                toolbar={
                  <Select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value as "all" | InvoiceStatus)} className="w-44">
                    <option value="all">{t("common.all")}</option>
                    {(["draft", "sent", "paid", "partial", "overdue"] as const).map((s) => (
                      <option key={s} value={s}>{t(`status.${s}`)}</option>
                    ))}
                  </Select>
                }
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            {!hydrated ? <TableSkeleton /> : <DataTable data={expenses} columns={expenseColumns} />}
          </Card>
          <Card className="h-fit">
            <CardHeader title={t("finance.expensesByCategory")} subtitle={t("common.thisMonth")} />
            <CardBody>
              <DonutChart data={expensesByCategory().slice(0, 5)} height={190} />
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="mt-4">
          <Card>
            <CardHeader title={t("finance.cashflow")} subtitle={`${monthLabel("2025-07")} — ${monthLabel("2026-06")} 2026`} />
            <CardBody>
              <TrendAreaChart data={cashflow} series={[{ key: "net", name: t("dashboard.profit") }]} height={320} />
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Premium A4 invoice view */}
      {selected ? (
        <DocumentSheet
          doc={fromInvoice(selected)}
          onClose={() => setSelectedId(null)}
          onEditItems={selected.status !== "paid" ? () => setEditingItems(selected.items.map((i) => ({ ...i }))) : undefined}
          actions={
            selected.status !== "paid" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => toast(`${t("finance.sendReminder")} ✓`, "info")}>
                  <Banknote className="h-4 w-4" />
                  {t("finance.sendReminder")}
                </Button>
                <Button size="sm" onClick={() => markPaid(selected.id)}>
                  <BadgeCheck className="h-4 w-4" />
                  {t("finance.markPaid")}
                </Button>
              </>
            ) : null
          }
        />
      ) : null}

      {/* Edit invoice items */}
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

      {/* New invoice */}
      <Dialog open={invoiceFormOpen} onClose={() => setInvoiceFormOpen(false)} title={t("finance.newInvoice")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setInvoiceFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreateInvoice} disabled={invoiceForm.formState.isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreateInvoice} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("common.client")} error={errI("clientId")}>
              <Select {...invoiceForm.register("clientId")}>
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.dueDate")} error={errI("dueDate")}>
              <Input type="date" dir="ltr" {...invoiceForm.register("dueDate")} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...invoiceForm.register("recurring")} />
            {t("finance.recurring")}
          </label>
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-2">{t("finance.items")}</p>
            <LineItemsEditor items={formItems} onChange={setFormItems} />
          </div>
          <Field label={t("common.notes")}>
            <Input {...invoiceForm.register("notes")} />
          </Field>
        </form>
      </Dialog>

      {/* New expense */}
      <Dialog open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} title={t("finance.newExpense")}
        footer={
          <>
            <Button variant="outline" onClick={() => setExpenseFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreateExpense} disabled={expenseForm.formState.isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreateExpense} className="space-y-4" noValidate>
          <Field label={t("common.name")} error={errE("title")}>
            <Input {...expenseForm.register("title")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("finance.category")} error={errE("category")}>
              <Input placeholder="رواتب / برمجيات / إيجار…" {...expenseForm.register("category")} />
            </Field>
            <Field label={t("finance.vendor")} error={errE("vendor")}>
              <Input {...expenseForm.register("vendor")} />
            </Field>
            <Field label={t("common.amount")} error={errE("amount")}>
              <Input type="number" min={0} dir="ltr" {...expenseForm.register("amount")} />
            </Field>
            <Field label={t("common.date")} error={errE("date")}>
              <Input type="date" dir="ltr" {...expenseForm.register("date")} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...expenseForm.register("recurring")} />
            {t("finance.recurring")}
          </label>
        </form>
      </Dialog>
    </div>
  );
}
