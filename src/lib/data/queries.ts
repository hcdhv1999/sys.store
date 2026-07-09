// ── Derived data & lookups over the demo seed ─────────────────────────
// Pure functions; the Supabase repositories in "@/services" expose the
// same shapes so pages don't care which backend is active.

import {
  activity,
  campaigns,
  clients,
  departments,
  employees,
  events,
  expenses,
  files,
  invoices,
  monthlyFinancials,
  projects,
  quotations,
  stores,
  tasks,
} from "./seed";
import type { Campaign, Client, Employee, Invoice, Project, Quotation, Task } from "@/types";

export const VAT_RATE = 0.15;

// Reference "today" for the seeded workspace (the demo dataset is dated
// around this point). With Supabase live this becomes the real clock.
export const TODAY = "2026-07-02";

// ── Task helpers (real derivations, no hardcoded stats) ─────────────────

export const OPEN_TASK_STATUSES = ["todo", "inProgress", "review"] as const;

/** Client of a task: explicit link, else inherited from its project. */
export function taskClientId(task: Pick<Task, "clientId" | "projectId">): string | null {
  if (task.clientId) return task.clientId;
  if (task.projectId) return byId.project(task.projectId)?.clientId ?? null;
  return null;
}

export function isOverdue(task: Pick<Task, "status" | "dueDate">): boolean {
  return task.status !== "done" && task.status !== "cancelled" && task.dueDate < TODAY;
}

/** KPI row values computed from the given task set — never hardcoded. */
export function taskKpis(list: Task[]) {
  return {
    total: list.filter((t) => t.status !== "cancelled").length,
    overdue: list.filter(isOverdue).length,
    dueToday: list.filter((t) => t.dueDate === TODAY && t.status !== "done" && t.status !== "cancelled").length,
    completed: list.filter((t) => t.status === "done").length,
  };
}

/** Per-project task rollup, incl. progress from real completion. */
export function projectTaskStats(projectId: string, list: Task[]) {
  const own = list.filter((t) => t.projectId === projectId && t.status !== "cancelled");
  const completed = own.filter((t) => t.status === "done").length;
  return {
    total: own.length,
    completed,
    overdue: own.filter(isOverdue).length,
    progress: own.length ? Math.round((completed / own.length) * 100) : 0,
  };
}

export function tasksForClient(clientId: string, list: Task[]): Task[] {
  return list.filter((t) => taskClientId(t) === clientId);
}

type LineItems = { items: { qty: number; unitPrice: number; discountPct?: number }[] };

export function lineGross(item: { qty: number; unitPrice: number }): number {
  return item.qty * item.unitPrice;
}

export function lineDiscount(item: { qty: number; unitPrice: number; discountPct?: number }): number {
  return lineGross(item) * ((item.discountPct ?? 0) / 100);
}

export function lineNet(item: { qty: number; unitPrice: number; discountPct?: number }): number {
  return lineGross(item) - lineDiscount(item);
}

/** Full money breakdown for a sales document (quotation or invoice). */
export function docTotals(doc: LineItems) {
  const subtotal = doc.items.reduce((s, i) => s + lineGross(i), 0);
  const discount = doc.items.reduce((s, i) => s + lineDiscount(i), 0);
  const taxable = subtotal - discount;
  const vat = taxable * VAT_RATE;
  return { subtotal, discount, taxable, vat, total: Math.round(taxable + vat) };
}

export function invoiceSubtotal(inv: LineItems): number {
  return docTotals(inv).subtotal;
}

export function invoiceTotal(inv: LineItems): number {
  return docTotals(inv).total;
}

export function invoiceOutstanding(inv: Invoice): number {
  if (inv.status === "paid") return 0;
  return invoiceTotal(inv) - inv.paidAmount;
}

export const byId = {
  client: (id: string): Client | undefined => clients.find((c) => c.id === id),
  employee: (id: string): Employee | undefined => employees.find((e) => e.id === id),
  project: (id: string): Project | undefined => projects.find((p) => p.id === id),
  invoice: (id: string): Invoice | undefined => invoices.find((i) => i.id === id),
  quotation: (id: string): Quotation | undefined => quotations.find((q) => q.id === id),
  campaign: (id: string): Campaign | undefined => campaigns.find((c) => c.id === id),
  store: (id: string) => stores.find((s) => s.id === id),
  department: (id: string) => departments.find((d) => d.id === id),
};

export function clientName(id: string | null): string {
  return (id && byId.client(id)?.name) || "—";
}

export function employeeName(id: string): string {
  return byId.employee(id)?.name ?? "—";
}

export function projectName(id: string | null): string {
  return (id && byId.project(id)?.name) || "—";
}

// ── Dashboard KPIs ─────────────────────────────────────────────────────

export function dashboardKpis() {
  const current = monthlyFinancials[monthlyFinancials.length - 1];
  const previous = monthlyFinancials[monthlyFinancials.length - 2];
  const pct = (now: number, before: number) => ((now - before) / before) * 100;

  const unpaid = invoices.filter((i) => i.status === "sent" || i.status === "overdue" || i.status === "partial");

  return {
    revenue: current.revenue,
    revenueDelta: pct(current.revenue, previous.revenue),
    expenses: current.expenses,
    expensesDelta: pct(current.expenses, previous.expenses),
    profit: current.revenue - current.expenses,
    profitDelta: pct(current.revenue - current.expenses, previous.revenue - previous.expenses),
    activeProjects: projects.filter((p) => p.status === "inProgress" || p.status === "review").length,
    activeClients: clients.filter((c) => c.status === "active").length,
    openTasks: tasks.filter((t) => t.status !== "done").length,
    unpaidCount: unpaid.length,
    unpaidTotal: unpaid.reduce((sum, i) => sum + invoiceOutstanding(i), 0),
  };
}

export function financeSummary() {
  const paidThisMonth = invoices
    .filter((i) => i.status === "paid" && i.issueDate.startsWith("2026-06"))
    .reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceOutstanding(i), 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + invoiceOutstanding(i), 0);
  const q2Revenue = monthlyFinancials.slice(-3).reduce((s, m) => s + m.revenue, 0);
  return { paidThisMonth, outstanding, overdue, vatDue: Math.round(q2Revenue * VAT_RATE) };
}

export function expensesByCategory() {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

// ── Marketing metrics ──────────────────────────────────────────────────

export function campaignMetrics(c: Campaign) {
  return {
    roas: c.spend > 0 ? c.revenue / c.spend : 0,
    cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
    cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
  };
}

export function marketingSummary() {
  const active = campaigns.filter((c) => c.status === "active");
  const spend = campaigns.reduce((s, c) => s + c.spend, 0);
  const revenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  return { activeCount: active.length, spend, revenue, conversions, roas: spend > 0 ? revenue / spend : 0 };
}

export function spendByPlatform() {
  const map = new Map<string, number>();
  for (const c of campaigns) map.set(c.platform, (map.get(c.platform) ?? 0) + c.spend);
  return [...map.entries()].map(([platform, spend]) => ({ platform, spend })).sort((a, b) => b.spend - a.spend);
}

// ── Client rollups ─────────────────────────────────────────────────────

export function clientRollup(clientId: string) {
  const clientInvoices = invoices.filter((i) => i.clientId === clientId);
  const billed = clientInvoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const outstanding = clientInvoices.reduce((s, i) => s + invoiceOutstanding(i), 0);
  return {
    invoices: clientInvoices,
    projects: projects.filter((p) => p.clientId === clientId),
    campaigns: campaigns.filter((c) => c.clientId === clientId),
    stores: stores.filter((s) => s.clientId === clientId),
    quotations: quotations.filter((q) => q.clientId === clientId),
    billed,
    outstanding,
    openProjects: projects.filter((p) => p.clientId === clientId && p.status !== "completed").length,
  };
}

// ── Quotations ─────────────────────────────────────────────────────────

export function quotesSummary() {
  const decided = quotations.filter((q) => q.status === "approved" || q.status === "rejected");
  const approved = quotations.filter((q) => q.status === "approved");
  const open = quotations.filter((q) => q.status === "sent" || q.status === "draft");
  return {
    acceptanceRate: decided.length ? (approved.length / decided.length) * 100 : 0,
    pipeline: open.reduce((s, q) => s + invoiceTotal(q), 0),
    openCount: open.length,
    approvedValue: approved.reduce((s, q) => s + invoiceTotal(q), 0),
  };
}

// ── Misc ───────────────────────────────────────────────────────────────

export function upcomingEvents(limit = 5) {
  return events
    .filter((e) => e.date >= "2026-07-02")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, limit);
}

export function recentActivity(limit = 8) {
  return [...activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function storageUsedMB(): number {
  return files.reduce((s, f) => s + f.sizeMB, 0);
}

export function teamSummary() {
  return {
    total: employees.length,
    present: employees.filter((e) => e.attendance === "present").length,
    remote: employees.filter((e) => e.attendance === "remote").length,
    onLeave: employees.filter((e) => e.attendance === "onLeave").length,
    avgUtilization: Math.round(employees.reduce((s, e) => s + e.utilization, 0) / employees.length),
  };
}
