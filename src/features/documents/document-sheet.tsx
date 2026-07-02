"use client";

// Full-screen premium A4 document view shared by quotations and invoices.
// The sheet uses fixed light "paper" colors so it prints identically from
// light or dark mode; everything outside .doc-sheet is hidden when printing.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Building2, Phone, Printer, QrCode, Receipt, Share2, SquarePen, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { byId, lineNet, VAT_RATE } from "@/lib/data/queries";
import { tenant } from "@/lib/data/seed";
import { documentTotals, type SalesDocument } from "./model";
import { shareChannels } from "./sharing";
import type { MessageKey } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

// Fixed paper palette (print-authentic, dark-mode-proof)
const paper = {
  ink: "#1F2B2B",
  sub: "#5D7070",
  faint: "#8FA0A0",
  border: "#E7DFDF",
  primary: "#2E4F4F",
  accent: "#D88935",
  soft: "#FAF5F0",
};

const statusPaper: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "#EEF0F0", fg: "#5D7070" },
  sent: { bg: "#E7EFF8", fg: "#3B6EA5" },
  approved: { bg: "#E3F4EC", fg: "#1E8E5A" },
  paid: { bg: "#E3F4EC", fg: "#1E8E5A" },
  partial: { bg: "#E7EFF8", fg: "#3B6EA5" },
  rejected: { bg: "#FBE7E7", fg: "#D64545" },
  overdue: { bg: "#FBE7E7", fg: "#D64545" },
  expired: { bg: "#FBE7E7", fg: "#D64545" },
};

export function DocumentSheet({
  doc,
  onClose,
  onEditItems,
  actions,
}: {
  doc: SalesDocument;
  onClose: () => void;
  /** open the line-items editor (omit to hide the action) */
  onEditItems?: () => void;
  /** status workflow buttons supplied by the host page */
  actions?: ReactNode;
}) {
  const { t, locale } = useI18n();
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const client = byId.client(doc.clientId);
  const totals = documentTotals(doc);
  const isInvoice = doc.kind === "invoice";
  const kindLabel = t(isInvoice ? "docs.taxInvoice" : "docs.quotation");
  const badge = statusPaper[doc.status] ?? statusPaper.draft;

  useEffect(() => {
    document.body.classList.add("doc-printing");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const onClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => {
      document.body.classList.remove("doc-printing");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  const money = (v: number) => formatCurrency(v, locale);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-[2px]">
      {/* Action bar */}
      <div className="no-print glass sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={onClose} aria-label={t("common.close")} className="cursor-pointer rounded-xl bg-surface p-2 text-ink-2 shadow-soft hover:text-ink">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-ink">
          {kindLabel} <span dir="ltr" className="tabular-nums">{doc.number}</span>
        </p>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {actions}
          {onEditItems ? (
            <Button variant="outline" size="sm" onClick={onEditItems}>
              <SquarePen className="h-4 w-4" />
              {t("docs.editItems")}
            </Button>
          ) : null}
          {/* Share — channels prepared, enabled in Phase 3 */}
          <div className="relative" ref={shareRef}>
            <Button variant="outline" size="sm" onClick={() => setShareOpen((v) => !v)}>
              <Share2 className="h-4 w-4" />
              {t("docs.share")}
            </Button>
            {shareOpen ? (
              <div className="absolute end-0 top-11 w-52 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-pop animate-fade-up">
                {shareChannels.map((channel) => (
                  <button
                    key={channel.id}
                    disabled={!channel.enabled}
                    className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm text-ink-3"
                  >
                    {t(channel.labelKey as MessageKey)}
                    <Badge tone="neutral">{t("docs.comingSoon")}</Badge>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="accent" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t("common.exportPdf")}
          </Button>
        </div>
      </div>

      {/* A4 sheet */}
      <div
        className="doc-sheet mx-auto my-8 flex w-[794px] max-w-[calc(100vw-2rem)] flex-col rounded-sm bg-white p-12 shadow-pop"
        style={{ color: paper.ink, minHeight: 1050 }}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ backgroundColor: paper.primary }}>
              ح
            </span>
            <div>
              <p className="text-lg leading-tight font-bold">{tenant.name}</p>
              <p className="text-xs" style={{ color: paper.sub }}>{tenant.nameEn}</p>
              <p className="mt-1 text-[10px] tabular-nums" style={{ color: paper.faint }}>
                {t("clients.cr")}: <span dir="ltr">{tenant.cr}</span> · {t("clients.vatNumber")}: <span dir="ltr">{tenant.vatNumber}</span>
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-2xl font-bold tracking-tight" style={{ color: paper.primary }}>{kindLabel}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums" dir="ltr" style={{ color: paper.accent }}>{doc.number}</p>
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ backgroundColor: badge.bg, color: badge.fg }}
            >
              {t(`status.${doc.status}` as MessageKey)}
            </span>
          </div>
        </div>

        <div className="mt-6 h-1 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${paper.primary}, ${paper.accent})` }} />

        {/* Meta + client */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: paper.soft }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: paper.faint }}>{t("common.client")}</p>
            {client ? (
              <>
                <p className="mt-1 text-sm font-bold">{client.name}</p>
                <div className="mt-1.5 space-y-1 text-xs" style={{ color: paper.sub }}>
                  {client.phone ? (
                    <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /><span dir="ltr">{client.phone}</span></p>
                  ) : null}
                  {client.industry ? (
                    <p className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" />{client.industry}</p>
                  ) : null}
                  {client.cr ? (
                    <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />{t("clients.cr")}: <span dir="ltr">{client.cr}</span></p>
                  ) : null}
                  {client.vatNumber ? (
                    <p className="flex items-center gap-1.5"><Receipt className="h-3 w-3" />{t("clients.vatNumber")}: <span dir="ltr">{client.vatNumber}</span></p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-2 rounded-xl border p-4 text-xs" style={{ borderColor: paper.border }}>
            <p className="flex justify-between">
              <span style={{ color: paper.sub }}>{t("finance.issueDate")}</span>
              <b className="tabular-nums">{formatDate(doc.issueDate, locale)}</b>
            </p>
            <p className="flex justify-between">
              <span style={{ color: paper.sub }}>{t(isInvoice ? "common.dueDate" : "quotes.validUntil")}</span>
              <b className="tabular-nums">{formatDate(doc.secondaryDate, locale)}</b>
            </p>
            {doc.title ? (
              <p className="flex justify-between gap-3">
                <span style={{ color: paper.sub }}>{t("common.description")}</span>
                <b className="text-end">{doc.title}</b>
              </p>
            ) : null}
          </div>
        </div>

        {/* Items */}
        <table className="mt-6 w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: paper.primary, color: "#fff" }}>
              <th className="rounded-s-lg px-3 py-2.5 text-start font-bold">{t("docs.service")}</th>
              <th className="px-3 py-2.5 text-start font-bold">{t("common.description")}</th>
              <th className="px-2 py-2.5 text-center font-bold">{t("finance.qty")}</th>
              <th className="px-2 py-2.5 text-end font-bold">{t("finance.unitPrice")}</th>
              <th className="px-2 py-2.5 text-end font-bold">{t("docs.discount")}</th>
              <th className="px-2 py-2.5 text-end font-bold">{t("common.vat")}</th>
              <th className="rounded-e-lg px-3 py-2.5 text-end font-bold">{t("common.total")}</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => {
              const net = lineNet(item);
              return (
                <tr key={i} className="doc-row" style={{ borderBottom: `1px solid ${paper.border}` }}>
                  <td className="px-3 py-2.5 font-semibold">{item.service?.trim() || item.description}</td>
                  <td className="px-3 py-2.5" style={{ color: paper.sub }}>{item.service?.trim() ? item.description : ""}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{formatNumber(item.qty, locale)}</td>
                  <td className="px-2 py-2.5 text-end tabular-nums">{money(item.unitPrice)}</td>
                  <td className="px-2 py-2.5 text-end tabular-nums" style={{ color: item.discountPct ? "#D64545" : paper.faint }}>
                    {item.discountPct ? `${formatNumber(item.discountPct, locale)}%` : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-end tabular-nums" style={{ color: paper.sub }}>{money(net * VAT_RATE)}</td>
                  <td className="px-3 py-2.5 text-end font-bold tabular-nums">{money(net * (1 + VAT_RATE))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="doc-block mt-5 flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <p className="flex justify-between" style={{ color: paper.sub }}>
              <span>{t("common.subtotal")}</span>
              <span className="tabular-nums">{money(totals.subtotal)}</span>
            </p>
            {totals.discount > 0 ? (
              <>
                <p className="flex justify-between" style={{ color: "#D64545" }}>
                  <span>{t("docs.discount")}</span>
                  <span className="tabular-nums">−{money(totals.discount)}</span>
                </p>
                <p className="flex justify-between" style={{ color: paper.sub }}>
                  <span>{t("docs.taxable")}</span>
                  <span className="tabular-nums">{money(totals.taxable)}</span>
                </p>
              </>
            ) : null}
            <p className="flex justify-between" style={{ color: paper.sub }}>
              <span>{t("common.vat")}</span>
              <span className="tabular-nums">{money(totals.vat)}</span>
            </p>
            {isInvoice && doc.paidAmount > 0 ? (
              <p className="flex justify-between" style={{ color: "#1E8E5A" }}>
                <span>{t("clients.payments")}</span>
                <span className="tabular-nums">−{money(doc.paidAmount)}</span>
              </p>
            ) : null}
            <p
              className="flex justify-between rounded-lg px-3 py-2 text-sm font-bold"
              style={{ backgroundColor: paper.primary, color: "#fff" }}
            >
              <span>{t("docs.grandTotal")}</span>
              <span className="tabular-nums">{money(isInvoice ? Math.max(0, totals.total - doc.paidAmount) : totals.total)}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="doc-block mt-auto pt-8">
          {doc.notes ? (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase" style={{ color: paper.faint }}>{t("common.notes")}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: paper.sub }}>{doc.notes}</p>
            </div>
          ) : null}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase" style={{ color: paper.faint }}>{t("docs.terms")}</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: paper.sub }}>{doc.terms?.trim() || t("docs.defaultTerms")}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-4" style={{ borderColor: paper.border }}>
              <QrCode className="h-10 w-10" style={{ color: paper.faint }} />
              <p className="text-[9px]" style={{ color: paper.faint }}>{t("docs.qrHint")}</p>
            </div>
            <div className="flex flex-col justify-end rounded-xl border border-dashed p-4" style={{ borderColor: paper.border }}>
              <div className="mb-1 border-b" style={{ borderColor: paper.border }} />
              <p className="text-center text-[9px]" style={{ color: paper.faint }}>{t("docs.signature")}</p>
            </div>
            <div className="flex flex-col justify-end rounded-xl border border-dashed p-4" style={{ borderColor: paper.border }}>
              <div className="mb-1 border-b" style={{ borderColor: paper.border }} />
              <p className="text-center text-[9px]" style={{ color: paper.faint }}>{t("docs.stamp")}</p>
            </div>
          </div>
          <p className="mt-5 text-center text-[9px]" style={{ color: paper.faint }}>
            {t("docs.issuedBy")} {tenant.name} · {tenant.nameEn} — hirf.sa
          </p>
        </div>
      </div>
      <div className={cn("no-print h-8")} />
    </div>,
    document.body,
  );
}
