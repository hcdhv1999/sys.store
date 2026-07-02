"use client";

// ── Data repositories ──────────────────────────────────────────────────
// One async API for every entity. With Supabase configured the functions
// query PostgreSQL (RLS scopes rows to the caller's tenant) and map
// snake_case rows to the domain types; otherwise they resolve instantly
// from the bundled demo seed so the whole product works out of the box.

import { getSupabaseBrowser } from "@/lib/supabase/client";
import * as seed from "@/lib/data/seed";
import type {
  AppNotification,
  Campaign,
  Client,
  Employee,
  Expense,
  Invoice,
  Project,
  Quotation,
  Store,
  Task,
} from "@/types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v));

export async function listClients(): Promise<Client[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.clients;
  const { data, error } = await supabase
    .from("clients")
    .select("*, client_contacts(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    industry: str(r.industry),
    status: r.status,
    city: str(r.city),
    address: str(r.address),
    cr: str(r.cr_number),
    vatNumber: str(r.vat_number),
    website: str(r.website),
    email: str(r.email),
    phone: str(r.phone),
    contacts: (r.client_contacts ?? []).map((c: Row) => ({
      name: c.name,
      title: str(c.title),
      email: str(c.email),
      phone: str(c.phone),
    })),
    tags: r.tags ?? [],
    since: str(r.since),
    notes: str(r.notes),
    lastActivity: str(r.last_activity ?? r.updated_at),
  }));
}

export async function listProjects(): Promise<Project[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.projects;
  const { data, error } = await supabase
    .from("projects")
    .select("*, milestones(*), project_members(employee_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    clientId: str(r.client_id),
    name: r.name,
    service: str(r.service),
    status: r.status,
    priority: r.priority,
    progress: num(r.progress),
    budget: num(r.budget),
    spent: num(r.spent),
    startDate: str(r.start_date),
    deadline: str(r.deadline),
    managerId: str(r.manager_id),
    teamIds: (r.project_members ?? []).map((m: Row) => m.employee_id),
    hoursLogged: num(r.hours_logged),
    milestones: (r.milestones ?? []).map((m: Row) => ({
      id: m.id,
      title: m.title,
      dueDate: str(m.due_date),
      done: Boolean(m.done),
    })),
    description: str(r.description),
  }));
}

export async function listTasks(): Promise<Task[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.tasks;
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_comments(count)")
    .order("position");
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    projectId: r.project_id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    assigneeId: str(r.assignee_id),
    dueDate: str(r.due_date),
    labels: r.labels ?? [],
    estimateH: num(r.estimate_hours),
    spentH: num(r.spent_hours),
    subtasksDone: 0,
    subtasksTotal: 0,
    comments: num(r.task_comments?.[0]?.count),
    attachments: 0,
  }));
}

export async function listInvoices(): Promise<Invoice[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.invoices;
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("issue_date", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    number: r.number,
    clientId: r.client_id,
    projectId: r.project_id,
    status: r.status,
    issueDate: str(r.issue_date),
    dueDate: str(r.due_date),
    items: (r.invoice_items ?? []).map((i: Row) => ({
      description: i.description,
      qty: num(i.qty),
      unitPrice: num(i.unit_price),
    })),
    paidAmount: num(r.paid_amount),
    recurring: Boolean(r.recurring),
  }));
}

export async function listExpenses(): Promise<Expense[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.expenses;
  const { data, error } = await supabase.from("expenses").select("*").order("spent_on", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    category: r.category,
    vendor: str(r.vendor),
    amount: num(r.amount),
    date: str(r.spent_on),
    recurring: Boolean(r.recurring),
  }));
}

export async function listQuotations(): Promise<Quotation[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.quotations;
  const { data, error } = await supabase
    .from("quotations")
    .select("*, quotation_items(*)")
    .order("issue_date", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    number: r.number,
    clientId: r.client_id,
    title: r.title,
    status: r.status,
    issueDate: str(r.issue_date),
    validUntil: str(r.valid_until),
    items: (r.quotation_items ?? []).map((i: Row) => ({
      description: i.description,
      qty: num(i.qty),
      unitPrice: num(i.unit_price),
    })),
  }));
}

export async function listCampaigns(): Promise<Campaign[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.campaigns;
  const { data, error } = await supabase.from("campaigns").select("*").order("start_date", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    clientId: r.client_id,
    name: r.name,
    platform: r.platform,
    objective: str(r.objective),
    status: r.status,
    budget: num(r.budget),
    spend: num(r.spend),
    revenue: num(r.revenue),
    impressions: num(r.impressions),
    clicks: num(r.clicks),
    conversions: num(r.conversions),
    startDate: str(r.start_date),
    endDate: str(r.end_date),
  }));
}

export async function listStores(): Promise<Store[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.stores;
  const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    clientId: r.client_id,
    name: r.name,
    platform: r.platform,
    status: r.status,
    domain: str(r.domain),
    hosting: str(r.hosting),
    launchDate: str(r.launch_date),
    monthlySales: num(r.monthly_sales),
    monthlyOrders: num(r.monthly_orders),
    visitors: num(r.visitors),
    conversionRate: num(r.conversion_rate),
    integrations: r.integrations ?? [],
    pixels: r.pixels ?? [],
    emails: r.emails ?? [],
  }));
}

export async function listEmployees(): Promise<Employee[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.employees;
  const { data, error } = await supabase
    .from("employees")
    .select("*, profiles(full_name, full_name_en, email, phone, role)")
    .order("joined_at");
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: str(r.profiles?.full_name) || r.job_title,
    nameEn: str(r.profiles?.full_name_en),
    email: str(r.profiles?.email),
    phone: str(r.profiles?.phone),
    jobTitle: str(r.job_title),
    departmentId: str(r.department_id),
    role: r.profiles?.role ?? "member",
    joinedAt: str(r.joined_at),
    attendance: r.attendance,
    hoursThisMonth: num(r.hours_month),
    tasksCompleted: 0,
    utilization: num(r.utilization),
  }));
}

export async function listNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return seed.notifications;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    body: str(r.body),
    kind: r.kind,
    createdAt: str(r.created_at),
    read: Boolean(r.read),
    href: str(r.href) || "/dashboard",
  }));
}
