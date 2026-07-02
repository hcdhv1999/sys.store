"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, Circle, Clock, MessageSquare, Paperclip, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { byId, clientName, employeeName } from "@/lib/data/queries";
import { tasks as allTasks } from "@/lib/data/seed";
import { cn } from "@/lib/utils";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const router = useRouter();
  const project = byId.project(id);
  // Local optimistic milestone toggling (persisted via Supabase in production)
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>({});
  if (!project) notFound();

  const projectTasks = allTasks.filter((task) => task.projectId === project.id);
  const isDone = (mId: string, fallback: boolean) => doneOverrides[mId] ?? fallback;
  const doneCount = project.milestones.filter((m) => isDone(m.id, m.done)).length;

  return (
    <div className="animate-fade-up">
      <button onClick={() => router.back()} className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink">
        <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" />
        {t("projects.title")}
      </button>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              <Link href={`/clients/${project.clientId}`} className="font-semibold text-accent hover:text-accent-hover">
                {clientName(project.clientId)}
              </Link>{" "}
              · {project.service}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{project.description}</p>
          </div>
          <div className="w-full max-w-56">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-2">{t("common.progress")}</span>
              <span className="font-bold text-ink tabular-nums">{formatNumber(project.progress, locale)}%</span>
            </div>
            <Progress value={project.progress} className="mt-2 h-2" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Wallet, label: t("common.budget"), value: `${formatCurrency(project.spent, locale)} / ${formatCurrency(project.budget, locale)}` },
            { icon: Clock, label: t("projects.hoursLogged"), value: formatNumber(project.hoursLogged, locale) },
            { icon: Calendar, label: t("projects.startDate"), value: formatDate(project.startDate, locale) },
            { icon: Calendar, label: t("projects.deadline"), value: formatDate(project.deadline, locale) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3.5">
              <item.icon className="h-4.5 w-4.5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-ink-3 uppercase">{item.label}</p>
                <p className="truncate text-sm font-semibold text-ink tabular-nums">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Milestones */}
        <Card>
          <CardHeader
            title={t("projects.milestones")}
            subtitle={`${formatNumber(doneCount, locale)}/${formatNumber(project.milestones.length, locale)} ${t("projects.completedTasks")}`}
          />
          <CardBody className="space-y-1.5 p-3">
            {project.milestones.length === 0 ? (
              <EmptyState />
            ) : (
              project.milestones.map((m) => {
                const done = isDone(m.id, m.done);
                return (
                  <button
                    key={m.id}
                    onClick={() => setDoneOverrides((prev) => ({ ...prev, [m.id]: !done }))}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-start transition-colors hover:bg-surface-2"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-ink-3" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", done ? "text-ink-3 line-through" : "text-ink")}>{m.title}</span>
                      <span className="block text-[11px] text-ink-3 tabular-nums">{formatDate(m.dueDate, locale)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </CardBody>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("projects.tasks")}
            action={
              <Link href="/tasks" className="text-xs font-semibold text-accent hover:text-accent-hover">
                {t("common.viewAll")}
              </Link>
            }
          />
          <CardBody className="p-0 pt-3">
            {projectTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <ul>
                {projectTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0">
                    <Avatar name={employeeName(task.assigneeId)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", task.status === "done" ? "text-ink-3 line-through" : "text-ink")}>
                        {task.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-3 tabular-nums">
                        <span>{formatDate(task.dueDate, locale, { day: "numeric", month: "short" })}</span>
                        {task.comments > 0 ? (
                          <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{formatNumber(task.comments, locale)}</span>
                        ) : null}
                        {task.attachments > 0 ? (
                          <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{formatNumber(task.attachments, locale)}</span>
                        ) : null}
                      </p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Team */}
      <Card className="mt-4">
        <CardHeader title={t("projects.team")} />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {project.teamIds.map((memberId) => {
            const member = byId.employee(memberId);
            if (!member) return null;
            return (
              <div key={memberId} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Avatar name={member.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {member.name}
                    {memberId === project.managerId ? <span className="ms-1.5 text-[10px] font-bold text-accent">★ {t("projects.manager")}</span> : null}
                  </p>
                  <p className="truncate text-xs text-ink-3">{member.jobTitle}</p>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
