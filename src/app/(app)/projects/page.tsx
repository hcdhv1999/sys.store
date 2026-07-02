"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Calendar, Clock, LayoutGrid, List, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { AvatarGroup } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useClients, useEmployees, useProjects } from "@/hooks/use-data";
import { clientName, employeeName } from "@/lib/data/queries";
import { ProjectFormDialog } from "@/features/projects/project-form";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

export default function ProjectsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useProjects();
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();
  const [created, setCreated] = useState<Project[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const projects = useMemo(() => [...created, ...fetched], [created, fetched]);
  const filtered = projects.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (query === "" || p.name.includes(query) || clientName(p.clientId).includes(query)),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("projects.title")}
        subtitle={t("projects.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("projects.addProject")}
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="w-56" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | ProjectStatus)} className="w-44">
          <option value="all">{t("common.all")}</option>
          {(["planning", "inProgress", "review", "completed", "onHold"] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </Select>
        <div className="ms-auto flex items-center gap-1 rounded-xl bg-surface-2 p-1">
          <button
            onClick={() => setView("grid")}
            aria-label={t("projects.board")}
            className={cn("cursor-pointer rounded-lg p-1.5 transition-colors", view === "grid" ? "bg-surface text-ink shadow-soft" : "text-ink-3")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label={t("projects.list")}
            className={cn("cursor-pointer rounded-lg p-1.5 transition-colors", view === "list" ? "bg-surface text-ink shadow-soft" : "text-ink-3")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Briefcase} /></Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const done = project.milestones.filter((m) => m.done).length;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-pop">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={project.status} />
                    <PriorityBadge priority={project.priority} />
                  </div>
                  <h3 className="mt-3 font-bold text-ink">{project.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-3">{clientName(project.clientId)} · {project.service}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-xs font-bold text-ink tabular-nums">{formatNumber(project.progress, locale)}%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-3">
                    {formatNumber(done, locale)}/{formatNumber(project.milestones.length, locale)} {t("projects.milestones")}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <AvatarGroup names={project.teamIds.map(employeeName)} />
                    <span className="flex items-center gap-1 text-xs text-ink-2 tabular-nums">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.deadline, locale, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  <th className="px-5 py-3 text-start">{t("common.project")}</th>
                  <th className="px-5 py-3 text-start">{t("common.client")}</th>
                  <th className="px-5 py-3 text-start">{t("common.progress")}</th>
                  <th className="px-5 py-3 text-start">{t("common.budget")}</th>
                  <th className="px-5 py-3 text-start">{t("projects.deadline")}</th>
                  <th className="px-5 py-3 text-start">{t("projects.manager")}</th>
                  <th className="px-5 py-3 text-start">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <Link href={`/projects/${project.id}`} className="font-semibold text-ink hover:text-accent">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-2">{clientName(project.clientId)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <Progress value={project.progress} className="w-20" />
                        <span className="text-xs tabular-nums">{formatNumber(project.progress, locale)}%</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink tabular-nums">{formatCurrency(project.budget, locale)}</td>
                    <td className="px-5 py-3 text-ink-2 tabular-nums">{formatDate(project.deadline, locale)}</td>
                    <td className="px-5 py-3 text-ink-2">{employeeName(project.managerId)}</td>
                    <td className="px-5 py-3"><StatusBadge status={project.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Hours summary strip */}
      <Card className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-3 p-5">
        <span className="flex items-center gap-2 text-sm text-ink-2">
          <Clock className="h-4 w-4 text-accent" />
          {t("projects.hoursLogged")}:
          <b className="text-ink tabular-nums">{formatNumber(projects.reduce((s, p) => s + p.hoursLogged, 0), locale)}</b>
        </span>
        <span className="text-sm text-ink-2">
          {t("common.budget")}: <b className="text-ink tabular-nums">{formatCurrency(projects.reduce((s, p) => s + p.budget, 0), locale)}</b>
        </span>
        <span className="text-sm text-ink-2">
          {t("common.spent")}: <b className="text-ink tabular-nums">{formatCurrency(projects.reduce((s, p) => s + p.spent, 0), locale)}</b>
        </span>
      </Card>

      <ProjectFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        clients={clients}
        employees={employees}
        onCreate={(project) => {
          setCreated((prev) => [project, ...prev]);
          toast(`${t("projects.addProject")}: ${project.name} ✓`);
        }}
      />
    </div>
  );
}
