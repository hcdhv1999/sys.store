"use client";

// Client block for printable documents (quotations & invoices).
// Always: name, mobile, business activity. CR / VAT render only when the
// client actually has them — no empty labels or blank rows.

import { Briefcase, Building2, Phone, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { byId } from "@/lib/data/queries";
import { Avatar } from "@/components/ui/avatar";

export function DocumentClientHeader({ clientId }: { clientId: string }) {
  const { t } = useI18n();
  const client = byId.client(clientId);
  if (!client) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-2 p-3.5">
      <Avatar name={client.name} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{client.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
          {client.phone ? (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-ink-3" />
              <span dir="ltr">{client.phone}</span>
            </span>
          ) : null}
          {client.industry ? (
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-ink-3" />
              {client.industry}
            </span>
          ) : null}
          {client.cr ? (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-ink-3" />
              {t("clients.cr")}: <span dir="ltr">{client.cr}</span>
            </span>
          ) : null}
          {client.vatNumber ? (
            <span className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-ink-3" />
              {t("clients.vatNumber")}: <span dir="ltr">{client.vatNumber}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
