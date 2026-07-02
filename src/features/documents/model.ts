// ── Unified sales-document model ───────────────────────────────────────
// Quotations and invoices share one printable/showable shape so the sheet,
// the PDF, sharing channels and the quotation→invoice conversion all work
// off a single abstraction. The underlying DB rows stay untouched.

import type { Invoice, InvoiceItem, Quotation } from "@/types";
import { docTotals } from "@/lib/data/queries";

export type DocumentKind = "quotation" | "invoice";

export interface SalesDocument {
  kind: DocumentKind;
  id: string;
  number: string;
  clientId: string;
  title?: string;
  status: string;
  issueDate: string;
  /** due date for invoices, expiry date for quotations */
  secondaryDate: string;
  items: InvoiceItem[];
  paidAmount: number;
  notes?: string;
  terms?: string;
}

export function fromQuotation(q: Quotation): SalesDocument {
  return {
    kind: "quotation",
    id: q.id,
    number: q.number,
    clientId: q.clientId,
    title: q.title,
    status: q.status,
    issueDate: q.issueDate,
    secondaryDate: q.validUntil,
    items: q.items,
    paidAmount: 0,
    notes: q.notes,
    terms: q.terms,
  };
}

export function fromInvoice(inv: Invoice): SalesDocument {
  return {
    kind: "invoice",
    id: inv.id,
    number: inv.number,
    clientId: inv.clientId,
    status: inv.status,
    issueDate: inv.issueDate,
    secondaryDate: inv.dueDate,
    items: inv.items,
    paidAmount: inv.paidAmount,
    notes: inv.notes,
    terms: inv.terms,
  };
}

export function documentTotals(doc: Pick<SalesDocument, "items">) {
  return docTotals(doc);
}

/**
 * Build the invoice payload for an approved quotation. The caller assigns
 * the invoice number and persists it — keeping this pure lets the same
 * conversion run against local state today and Supabase later.
 */
export function quotationToInvoiceDraft(q: Quotation, number: string, dueDate: string): Invoice {
  return {
    id: `inv-${Date.now()}`,
    tenantId: q.tenantId,
    number,
    clientId: q.clientId,
    projectId: null,
    status: "draft",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate,
    items: q.items.map((item) => ({ ...item })),
    paidAmount: 0,
    recurring: false,
    notes: q.notes,
    terms: q.terms,
  };
}
