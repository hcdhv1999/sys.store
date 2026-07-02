"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity, UserPlus, Users, UsersRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useEmployees } from "@/hooks/use-data";
import { byId, employeeName, teamSummary } from "@/lib/data/queries";
import { departments, TENANT_ID } from "@/lib/data/seed";
import { BarsChart } from "@/components/charts";
import type { Employee } from "@/types";
import type { MessageKey } from "@/lib/i18n/en";

const columnHelper = createColumnHelper<Employee>();

const employeeSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(7),
  jobTitle: z.string().min(2),
  departmentId: z.string().min(1),
  role: z.enum(["admin", "manager", "member", "accountant", "viewer"]),
});
type EmployeeForm = z.infer<typeof employeeSchema>;

export default function TeamPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: fetched, isLoading } = useEmployees();
  const [created, setCreated] = useState<Employee[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const employees = useMemo(() => [...created, ...fetched], [created, fetched]);
  const summary = teamSummary();

  const productivity = employees.map((e) => ({ label: e.name.split(" ")[0], value: e.tasksCompleted }));

  const columns = useMemo<ColumnDef<Employee, unknown>[]>(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("common.name"),
          cell: (info) => (
            <span className="flex items-center gap-3">
              <Avatar name={info.getValue()} />
              <span>
                <span className="block font-semibold text-ink">{info.getValue()}</span>
                <span className="block text-xs text-ink-3">{info.row.original.jobTitle}</span>
              </span>
            </span>
          ),
        }),
        columnHelper.accessor((row) => byId.department(row.departmentId)?.name ?? "—", {
          id: "department",
          header: t("common.department"),
          cell: (info) => <span className="text-ink-2">{info.getValue() as string}</span>,
        }),
        columnHelper.accessor("role", {
          header: t("common.role"),
          cell: (info) => <Badge tone="info">{t(`role.${info.getValue()}` as MessageKey)}</Badge>,
        }),
        columnHelper.accessor("attendance", {
          header: t("team.attendance"),
          cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor("utilization", {
          header: t("team.utilization"),
          cell: (info) => (
            <span className="flex items-center gap-2">
              <Progress value={info.getValue()} className="w-20" />
              <span className="text-xs font-semibold tabular-nums">{formatNumber(info.getValue(), locale)}%</span>
            </span>
          ),
        }),
        columnHelper.accessor("hoursThisMonth", {
          header: t("team.hoursThisMonth"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatNumber(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("tasksCompleted", {
          header: t("team.tasksCompleted"),
          cell: (info) => <span className="font-semibold text-ink tabular-nums">{formatNumber(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("joinedAt", {
          header: t("team.joinedAt"),
          cell: (info) => <span className="text-ink-3 tabular-nums">{formatDate(info.getValue(), locale, { month: "short", year: "numeric" })}</span>,
        }),
      ] as ColumnDef<Employee, unknown>[],
    [t, locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema), defaultValues: { role: "member" } });

  const onCreate = handleSubmit((values) => {
    setCreated((prev) => [
      {
        id: `e-${Date.now()}`,
        tenantId: TENANT_ID,
        name: values.name,
        nameEn: "",
        email: values.email,
        phone: values.phone,
        jobTitle: values.jobTitle,
        departmentId: values.departmentId,
        role: values.role,
        joinedAt: new Date().toISOString().slice(0, 10),
        attendance: "present",
        hoursThisMonth: 0,
        tasksCompleted: 0,
        utilization: 0,
      },
      ...prev,
    ]);
    reset({ role: "member" });
    setFormOpen(false);
    toast(`${t("team.addEmployee")}: ${values.name} ✓`);
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("team.title")}
        subtitle={t("team.subtitle")}
        actions={
          <Button variant="accent" onClick={() => setFormOpen(true)}>
            <UserPlus className="h-4 w-4" />
            {t("team.addEmployee")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("team.employees")} value={formatNumber(employees.length, locale)} icon={UsersRound} />
        <StatCard
          label={t("team.present")}
          value={formatNumber(summary.present, locale)}
          icon={Users}
          hint={`${formatNumber(summary.remote, locale)} ${t("team.remote")} · ${formatNumber(summary.onLeave, locale)} ${t("team.onLeave")}`}
        />
        <StatCard label={t("team.utilization")} value={`${formatNumber(summary.avgUtilization, locale)}%`} icon={Activity} />
        <StatCard label={t("team.departments")} value={formatNumber(departments.length, locale)} icon={Users} />
      </div>

      {/* Departments */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {departments.map((dept) => {
          const members = employees.filter((e) => e.departmentId === dept.id);
          return (
            <Card key={dept.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                <p className="text-sm font-bold text-ink">{dept.name}</p>
              </div>
              <p className="mt-1 text-xs text-ink-3">
                {formatNumber(members.length, locale)} {members.length === 1 ? t("common.member") : t("common.members")}
              </p>
              <p className="mt-2 text-xs text-ink-2">
                {t("team.headOf")}: <b className="text-ink">{employeeName(dept.headId)}</b>
              </p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          {isLoading ? <TableSkeleton /> : <DataTable data={employees} columns={columns} pageSize={8} />}
        </Card>
        <Card className="h-fit">
          <CardHeader title={t("reports.teamProductivity")} subtitle={t("common.thisMonth")} />
          <CardBody>
            <BarsChart data={productivity} series={[{ key: "value", name: t("team.tasksCompleted") }]} height={260} currency={false} />
          </CardBody>
        </Card>
      </div>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={t("team.addEmployee")} wide
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onCreate} disabled={isSubmitting}>{t("common.create")}</Button>
          </>
        }
      >
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t("common.name")} error={errors.name && t("common.noResultsHint")} className="sm:col-span-2">
            <Input {...register("name")} />
          </Field>
          <Field label={t("common.email")} error={errors.email && t("common.noResultsHint")}>
            <Input type="email" dir="ltr" {...register("email")} />
          </Field>
          <Field label={t("common.phone")} error={errors.phone && t("common.noResultsHint")}>
            <Input dir="ltr" {...register("phone")} />
          </Field>
          <Field label={t("team.jobTitle")} error={errors.jobTitle && t("common.noResultsHint")}>
            <Input {...register("jobTitle")} />
          </Field>
          <Field label={t("common.department")} error={errors.departmentId && t("common.noResultsHint")}>
            <Select {...register("departmentId")}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t("common.role")} className="sm:col-span-2">
            <Select {...register("role")}>
              {(["admin", "manager", "member", "accountant", "viewer"] as const).map((role) => (
                <option key={role} value={role}>{t(`role.${role}`)}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
