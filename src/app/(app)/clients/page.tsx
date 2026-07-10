"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Building2, UserCheck, UserPlus, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataError } from "@/components/ui/data-error";
import { useToast } from "@/components/ui/toast";
import { useClients } from "@/hooks/use-data";
import { useCreateClient } from "@/hooks/use-mutations";
import { clientRollup } from "@/lib/data/queries";
import { ClientFormDialog } from "@/features/clients/client-form";
import type { Client, ClientStatus } from "@/types";

const columnHelper = createColumnHelper<Client>();

export default function ClientsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { data: clients, isLoading, isError, error } = useClients();
  const createClient = useCreateClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = statusFilter === "all" ? clients : clients.filter((c) => c.status === statusFilter);

  const activeCount = clients.filter((c) => c.status === "active").length;
  const leadCount = clients.filter((c) => c.status === "lead").length;
  const totalOutstanding = clients.reduce((s, c) => s + clientRollup(c.id).outstanding, 0);

  const columns = useMemo<ColumnDef<Client, unknown>[]>(
    () =>
      [
      columnHelper.accessor("name", {
        header: t("clients.company"),
        cell: (info) => (
          <span className="flex items-center gap-3">
            <Avatar name={info.getValue()} />
            <span>
              <span className="block font-semibold text-ink">{info.getValue()}</span>
              <span className="block text-xs text-ink-3">{info.row.original.industry}</span>
            </span>
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.contacts[0]?.name ?? row.email, {
        id: "contact",
        header: t("clients.contactPerson"),
        cell: (info) => (
          <span>
            <span className="block text-ink-2">{info.row.original.contacts[0]?.name ?? "—"}</span>
            <span className="block text-xs text-ink-3" dir="ltr">{info.row.original.phone}</span>
          </span>
        ),
      }),
      columnHelper.accessor("city", { header: t("common.city"), cell: (info) => <span className="text-ink-2">{info.getValue()}</span> }),
      columnHelper.accessor((row) => clientRollup(row.id).billed, {
        id: "billed",
        header: t("clients.totalBilled"),
        cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatCurrency(info.getValue() as number, locale)}</span>,
      }),
      columnHelper.accessor((row) => clientRollup(row.id).outstanding, {
        id: "outstanding",
        header: t("clients.outstanding"),
        cell: (info) => {
          const v = info.getValue() as number;
          return <span className={v > 0 ? "font-semibold text-warning tabular-nums" : "text-ink-3 tabular-nums"}>{formatCurrency(v, locale)}</span>;
        },
      }),
      columnHelper.accessor("tags", {
        header: t("common.tags"),
        enableSorting: false,
        cell: (info) => (
          <span className="flex gap-1">
            {(info.getValue() as string[]).slice(0, 2).map((tag) => (
              <Badge key={tag} tone="neutral">{tag}</Badge>
            ))}
          </span>
        ),
      }),
        columnHelper.accessor("status", { header: t("common.status"), cell: (info) => <StatusBadge status={info.getValue()} /> }),
      ] as ColumnDef<Client, unknown>[],
    [t, locale],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("clients.title")}
        subtitle={t("clients.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t("clients.addClient")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("nav.clients")} value={formatNumber(clients.length, locale)} icon={Users} />
        <StatCard label={t("status.active")} value={formatNumber(activeCount, locale)} icon={UserCheck} hint={`${formatNumber(leadCount, locale)} ${t("status.lead")}`} />
        <StatCard label={t("clients.outstanding")} value={formatCurrency(totalOutstanding, locale)} icon={Building2} />
      </div>

      {isError ? <DataError error={error} /> : (
      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            onRowClick={(client) => router.push(`/clients/${client.id}`)}
            toolbar={
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | ClientStatus)}
                className="w-40"
                aria-label={t("common.filter")}
              >
                <option value="all">{t("common.all")}</option>
                <option value="active">{t("status.active")}</option>
                <option value="lead">{t("status.lead")}</option>
                <option value="inactive">{t("status.inactive")}</option>
              </Select>
            }
          />
        )}
      </Card>
      )}

      <ClientFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        submitting={createClient.isPending}
        onCreate={(input) => {
          createClient.mutate(input, {
            onSuccess: (client) => {
              toast(`${t("clients.addClient")}: ${client.name} ✓`);
              setFormOpen(false);
            },
            onError: () => toast(t("data.saveFailed"), "error"),
          });
        }}
      />
    </div>
  );
}
