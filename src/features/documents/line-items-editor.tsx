"use client";

// Controlled editor for document line items — add, edit and remove rows
// with a live money summary. Used by the quotation and invoice forms and
// by the "edit items" action on existing documents.

import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { docTotals } from "@/lib/data/queries";
import type { InvoiceItem } from "@/types";

export function emptyItem(): InvoiceItem {
  return { service: "", description: "", qty: 1, unitPrice: 0, discountPct: 0 };
}

export function itemsValid(items: InvoiceItem[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (i) =>
        (i.service ?? "").trim().length + i.description.trim().length >= 2 &&
        i.qty > 0 &&
        i.unitPrice > 0 &&
        (i.discountPct ?? 0) >= 0 &&
        (i.discountPct ?? 0) <= 100,
    )
  );
}

export function LineItemsEditor({ items, onChange }: { items: InvoiceItem[]; onChange: (items: InvoiceItem[]) => void }) {
  const { t, locale } = useI18n();
  const totals = docTotals({ items });

  function update(index: number, patch: Partial<InvoiceItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div>
      {/* column headings */}
      <div className="mb-1.5 hidden grid-cols-[1fr_1.4fr_64px_100px_72px_36px] gap-2 px-0.5 text-[10px] font-bold text-ink-3 uppercase sm:grid">
        <span>{t("docs.service")}</span>
        <span>{t("common.description")}</span>
        <span>{t("finance.qty")}</span>
        <span>{t("finance.unitPrice")}</span>
        <span>{t("docs.discount")} %</span>
        <span />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-border p-2 sm:grid-cols-[1fr_1.4fr_64px_100px_72px_36px] sm:border-0 sm:p-0">
            <Input value={item.service ?? ""} placeholder={t("docs.service")} onChange={(e) => update(i, { service: e.target.value })} />
            <Input value={item.description} placeholder={t("common.description")} onChange={(e) => update(i, { description: e.target.value })} />
            <Input
              type="number" min={1} dir="ltr" value={item.qty || ""} aria-label={t("finance.qty")}
              onChange={(e) => update(i, { qty: Number(e.target.value) })}
            />
            <Input
              type="number" min={0} dir="ltr" value={item.unitPrice || ""} aria-label={t("finance.unitPrice")}
              onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
            />
            <Input
              type="number" min={0} max={100} dir="ltr" value={item.discountPct || ""} placeholder="0" aria-label={t("docs.discount")}
              onChange={(e) => update(i, { discountPct: Number(e.target.value) })}
            />
            <Button
              variant="ghost" size="icon" type="button" aria-label={t("common.delete")}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" type="button" onClick={() => onChange([...items, emptyItem()])}>
          <Plus className="h-3.5 w-3.5" />
          {t("docs.addItem")}
        </Button>
        <p className="text-xs text-ink-2">
          {t("common.subtotal")}: <b className="tabular-nums">{formatCurrency(totals.subtotal, locale)}</b>
          {totals.discount > 0 ? (
            <>
              {" · "}{t("docs.discount")}: <b className="text-danger tabular-nums">−{formatCurrency(totals.discount, locale)}</b>
            </>
          ) : null}
          {" · "}{t("docs.grandTotal")}: <b className="text-accent tabular-nums">{formatCurrency(totals.total, locale)}</b>
        </p>
      </div>
    </div>
  );
}
