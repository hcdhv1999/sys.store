// ── Document delivery channels ─────────────────────────────────────────
// Architecture for Phase 3: each channel knows how to *prepare* a payload
// for a document today (pure, testable), while `enabled: false` keeps the
// send action off until the backend pieces (public links, e-signature)
// ship. The UI renders the registry generically, so enabling a channel
// later is a one-line change.

import type { MessageKey } from "@/lib/i18n/en";
import type { SalesDocument } from "./model";
import { documentTotals } from "./model";
import { clientName } from "@/lib/data/queries";

export interface SharePayload {
  /** deep link the recipient will open (public share route, Phase 3) */
  url: string;
  subject: string;
  body: string;
}

export interface ShareChannel {
  id: "whatsapp" | "email" | "publicLink" | "eSignature";
  labelKey: MessageKey;
  enabled: boolean;
  prepare: (doc: SalesDocument, locale: "ar" | "en") => SharePayload;
}

function publicUrl(doc: SalesDocument): string {
  // Public documents will be served from /share/<kind>/<id> once the
  // Supabase-backed share tokens land (Phase 3).
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.hirf.sa";
  return `${base}/share/${doc.kind}/${doc.id}`;
}

function summaryLine(doc: SalesDocument, locale: "ar" | "en"): string {
  const total = documentTotals(doc).total.toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US");
  const kindLabel = doc.kind === "quotation" ? (locale === "ar" ? "عرض سعر" : "Quotation") : locale === "ar" ? "فاتورة" : "Invoice";
  return locale === "ar"
    ? `${kindLabel} ${doc.number} — ${clientName(doc.clientId)} — الإجمالي ${total} ر.س`
    : `${kindLabel} ${doc.number} — ${clientName(doc.clientId)} — total SAR ${total}`;
}

export const shareChannels: ShareChannel[] = [
  {
    id: "whatsapp",
    labelKey: "docs.shareWhatsApp",
    enabled: false,
    prepare: (doc, locale) => ({
      url: publicUrl(doc),
      subject: summaryLine(doc, locale),
      body: `${summaryLine(doc, locale)}\n${publicUrl(doc)}`,
    }),
  },
  {
    id: "email",
    labelKey: "docs.shareEmail",
    enabled: false,
    prepare: (doc, locale) => ({
      url: publicUrl(doc),
      subject: summaryLine(doc, locale),
      body: `${summaryLine(doc, locale)}\n\n${publicUrl(doc)}`,
    }),
  },
  {
    id: "publicLink",
    labelKey: "docs.shareLink",
    enabled: false,
    prepare: (doc, locale) => ({ url: publicUrl(doc), subject: summaryLine(doc, locale), body: publicUrl(doc) }),
  },
  {
    id: "eSignature",
    labelKey: "docs.eSignature",
    enabled: false,
    prepare: (doc, locale) => ({ url: `${publicUrl(doc)}?sign=1`, subject: summaryLine(doc, locale), body: publicUrl(doc) }),
  },
];
