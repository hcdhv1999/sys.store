"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowRight, Building2, Calendar, FileText, Globe, Mail, MapPin, Phone, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DataError } from "@/components/ui/data-error";
import { useClients, useEmployees, useProjects, useTasks } from "@/hooks/use-data";
import { campaignMetrics, clientRollup, invoiceTotal, isOverdue } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

export function ClientDetail({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  // Real tenant records from the query cache (Supabase in production).
  const { data: clients, isLoading, isError, error } = useClients();
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();
  const { data: allTasks } = useTasks();

  if (isError) return <DataError error={error} />;
  if (isLoading) return <div className="animate-fade-up space-y-4"><Skeleton className="h-44" /><Skeleton className="h-72" /></div>;

  const client = clients.find((c) => c.id === id);
  if (!client) notFound();

  const employeeNameFor = (eid: string) => employees.find((e) => e.id === eid)?.name ?? "—";
  const projectNameFor = (pid: string | null) => (pid && projects.find((p) => p.id === pid)?.name) || t("tasks.noProject");
  // A task's client: explicit link, else inherited from its (real) project.
  const clientOfTask = (task: (typeof allTasks)[number]) => task.clientId ?? projects.find((p) => p.id === task.projectId)?.clientId ?? null;
  // Cross-module rollups (invoices/campaigns/stores) are still seed-derived
  // until those modules are cut over; a real tenant client simply has none yet.
  const rollup = clientRollup(client.id);
  const clientTasks = allTasks.filter((tk) => clientOfTask(tk) === client.id);

  return (
    <div className="animate-fade-up">
      <button onClick={() => router.back()} className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" />
        {t("clients.title")}
      </button>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={client.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{client.name}</h1>
              <StatusBadge status={client.status} />
              {client.tags.map((tag) => (
                <Badge key={tag} tone="accent">{tag}</Badge>
              ))}
            </div>
            <p className="mt-1 text-sm text-ink-2">{client.industry}</p>
            {/* Only rows with values render — no empty labels for minimal clients */}
            <div className="mt-3 grid gap-x-8 gap-y-1.5 text-xs text-ink-2 sm:grid-cols-2 lg:grid-cols-3">
              {client.phone ? (
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-3" /><span dir="ltr">{client.phone}</span></span>
              ) : null}
              {client.email ? (
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-3" /><span dir="ltr">{client.email}</span></span>
              ) : null}
              {client.website ? (
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-ink-3" /><span dir="ltr">{client.website}</span></span>
              ) : null}
              {client.address || client.city ? (
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-3" />{client.address || client.city}</span>
              ) : null}
              {client.cr ? (
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-ink-3" />{t("clients.cr")}: <span dir="ltr">{client.cr}</span></span>
              ) : null}
              {client.vatNumber ? (
                <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-ink-3" />{t("clients.vatNumber")}: <span dir="ltr">{client.vatNumber}</span></span>
              ) : null}
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-center sm:text-start">
            <div>
              <p className="text-[10px] font-bold text-ink-3 uppercase">{t("clients.lifetimeValue")}</p>
              <p className="text-lg font-bold text-ink tabular-nums">{formatCurrency(rollup.billed, locale)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink-3 uppercase">{t("clients.outstanding")}</p>
              <p className={`text-lg font-bold tabular-nums ${rollup.outstanding > 0 ? "text-warning" : "text-ink"}`}>
                {formatCurrency(rollup.outstanding, locale)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink-3 uppercase">{t("clients.openProjects")}</p>
              <p className="text-lg font-bold text-ink tabular-nums">{formatNumber(rollup.openProjects, locale)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ink-3 uppercase">{t("clients.since")}</p>
              <p className="text-lg font-bold text-ink tabular-nums">{formatDate(client.since, locale, { month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="mt-5">
        <TabsList>
          <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
          <TabsTrigger value="projects">{t("clients.projectsTab")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("nav.tasks")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("clients.invoices")}</TabsTrigger>
          <TabsTrigger value="campaigns">{t("clients.campaigns")}</TabsTrigger>
          <TabsTrigger value="stores">{t("clients.storesTab")}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title={t("clients.contacts")} />
            <CardBody className="space-y-3">
              {client.contacts.length === 0 ? (
                <EmptyState />
              ) : (
                client.contacts.map((contact) => (
                  <div key={contact.email} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar name={contact.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{contact.name}</p>
                      <p className="text-xs text-ink-3">{contact.title}</p>
                    </div>
                    <div className="hidden text-end text-xs text-ink-2 sm:block">
                      <p dir="ltr">{contact.email}</p>
                      <p dir="ltr" className="mt-0.5">{contact.phone}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="text-xs font-bold text-ink-3 uppercase">{t("common.notes")}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{client.notes}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("common.timeline")} />
            <CardBody>
              {/* Real per-client activity feed lands with the Activity module
                  cutover; no seed events are shown for a production client. */}
              <EmptyState title={t("common.timeline")} />
            </CardBody>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="mt-4 grid gap-4 md:grid-cols-2">
          {rollup.projects.length === 0 ? (
            <Card className="md:col-span-2"><EmptyState /></Card>
          ) : (
            rollup.projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-pop">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{project.name}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-3">{project.service}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-xs font-bold text-ink tabular-nums">{formatNumber(project.progress, locale)}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(project.deadline, locale)}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(project.budget, locale)}</span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        {/* Tasks — real tasks linked to this client (direct or via project) */}
        <TabsContent value="tasks" className="mt-4">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-ink tabular-nums">{formatNumber(clientTasks.filter((tk) => tk.status !== "done" && tk.status !== "cancelled").length, locale)}</p>
              <p className="text-xs text-ink-2">{t("status.active")}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-danger tabular-nums">{formatNumber(clientTasks.filter(isOverdue).length, locale)}</p>
              <p className="text-xs text-ink-2">{t("tasks.overdue")}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-lg font-bold text-success tabular-nums">{formatNumber(clientTasks.filter((tk) => tk.status === "done").length, locale)}</p>
              <p className="text-xs text-ink-2">{t("tasks.completed")}</p>
            </Card>
          </div>
          <Card>
            {clientTasks.length === 0 ? (
              <EmptyState title={t("tasks.noTasks")} hint={t("tasks.noTasksHint")} />
            ) : (
              <ul>
                {clientTasks.map((task) => (
                  <li key={task.id}>
                    <Link href={`/tasks?task=${task.id}`} className="flex items-center gap-3 border-b border-border/60 px-5 py-3 transition-colors last:border-0 hover:bg-surface-2/60">
                      <Avatar name={employeeNameFor(task.assigneeId)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", task.status === "done" ? "text-ink-3 line-through" : "text-ink")}>{task.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-3">{projectNameFor(task.projectId)}</p>
                      </div>
                      <span className={cn("text-[11px] tabular-nums", isOverdue(task) ? "font-semibold text-danger" : "text-ink-3")}>{formatDate(task.dueDate, locale, { day: "numeric", month: "short" })}</span>
                      <StatusBadge status={task.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            {rollup.invoices.length === 0 ? (
              <EmptyState icon={FileText} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                      <th className="px-5 py-3 text-start">{t("finance.invoiceNo")}</th>
                      <th className="px-5 py-3 text-start">{t("finance.issueDate")}</th>
                      <th className="px-5 py-3 text-start">{t("common.dueDate")}</th>
                      <th className="px-5 py-3 text-start">{t("common.total")}</th>
                      <th className="px-5 py-3 text-start">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rollup.invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
                        <td className="px-5 py-3 font-semibold text-ink tabular-nums" dir="ltr">{inv.number}</td>
                        <td className="px-5 py-3 text-ink-2 tabular-nums">{formatDate(inv.issueDate, locale)}</td>
                        <td className="px-5 py-3 text-ink-2 tabular-nums">{formatDate(inv.dueDate, locale)}</td>
                        <td className="px-5 py-3 font-semibold text-ink tabular-nums">{formatCurrency(invoiceTotal(inv), locale)}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="mt-4 grid gap-4 md:grid-cols-2">
          {rollup.campaigns.length === 0 ? (
            <Card className="md:col-span-2"><EmptyState /></Card>
          ) : (
            rollup.campaigns.map((campaign) => {
              const metrics = campaignMetrics(campaign);
              return (
                <Card key={campaign.id} className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{campaign.name}</p>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-surface-2 p-2.5">
                      <p className="text-[10px] font-bold text-ink-3 uppercase">{t("marketing.roas")}</p>
                      <p className="text-sm font-bold text-ink tabular-nums">{formatNumber(metrics.roas, locale, 1)}×</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2.5">
                      <p className="text-[10px] font-bold text-ink-3 uppercase">{t("marketing.adSpend")}</p>
                      <p className="text-sm font-bold text-ink tabular-nums">{formatCurrency(campaign.spend, locale, true)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2.5">
                      <p className="text-[10px] font-bold text-ink-3 uppercase">{t("marketing.conversions")}</p>
                      <p className="text-sm font-bold text-ink tabular-nums">{formatNumber(campaign.conversions, locale)}</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Stores */}
        <TabsContent value="stores" className="mt-4 grid gap-4 md:grid-cols-2">
          {rollup.stores.length === 0 ? (
            <Card className="md:col-span-2"><EmptyState /></Card>
          ) : (
            rollup.stores.map((store) => (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-pop">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{store.name}</p>
                    <StatusBadge status={store.status} />
                  </div>
                  <p className="mt-1 text-xs text-ink-3" dir="ltr">{store.domain}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-2">
                    <span>{t("stores.monthlySales")}</span>
                    <span className="font-bold text-ink tabular-nums">{formatCurrency(store.monthlySales, locale)}</span>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
