"use client";

// ── Data repositories ──────────────────────────────────────────────────
// Two explicit modes (src/lib/data-mode.ts):
//  PRODUCTION (default) — Supabase is the single source of truth. If the
//    client is not configured, every call throws DataConfigError; there is
//    no silent seed fallback.
//  DEMO (NEXT_PUBLIC_DATA_MODE=demo, development only) — reads and writes
//    go to an in-memory copy of the bundled seed so the product can be
//    explored without a database. Mutations mutate that store, which makes
//    TanStack Query invalidation deliver real cross-page updates.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { DataConfigError, isDemoMode } from "@/lib/data-mode";
import * as seed from "@/lib/data/seed";
import type {
  AppNotification,
  CalendarEvent,
  CatalogItem,
  Campaign,
  Client,
  Employee,
  EventKind,
  Expense,
  FileItem,
  Invoice,
  Priority,
  Project,
  Quotation,
  Store,
  Task,
  TaskComment,
} from "@/types";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v));

/** Production-mode Supabase client — configuration errors are loud. */
function requireSupabase(): SupabaseClient {
  const client = getSupabaseBrowser();
  if (!client) throw new DataConfigError();
  return client;
}

// ── Demo store (explicit demo mode only) ────────────────────────────────
// Mutable copies of the seed; list* return fresh array refs so React Query
// consumers re-render after invalidation.
const demo = {
  clients: [...seed.clients.map((c) => ({ ...c }))],
  projects: [...seed.projects.map((p) => ({ ...p }))],
  tasks: [...seed.tasks.map((t) => ({ ...t }))],
  taskComments: [...seed.taskComments.map((c) => ({ ...c }))],
  attachments: [] as FileItem[],
};

// ── Row mappers ─────────────────────────────────────────────────────────

function mapClient(r: Row): Client {
  return {
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
  };
}

function mapProject(r: Row): Project {
  return {
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
  };
}

function mapTask(r: Row): Task {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    projectId: r.project_id,
    clientId: r.client_id ?? null,
    title: r.title,
    status: r.status,
    priority: r.priority,
    assigneeId: str(r.assignee_id),
    creatorId: str(r.creator_id),
    startDate: str(r.start_date),
    dueDate: str(r.due_date),
    labels: r.labels ?? [],
    estimateH: num(r.estimate_hours),
    spentH: num(r.spent_hours),
    notes: str(r.notes),
    subtasksDone: 0,
    subtasksTotal: 0,
    comments: num(r.task_comments?.[0]?.count),
    attachments: 0,
  };
}

function mapFile(r: Row): FileItem {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    folder: str(r.folder_name),
    type: (r.kind ?? "doc") as FileItem["type"],
    sizeMB: num(r.size_mb),
    ownerId: str(r.owner_id),
    modifiedAt: str(r.updated_at ?? r.created_at),
    versions: num(r.versions) || 1,
    taskId: r.task_id ?? null,
    storagePath: str(r.storage_path),
  };
}

// ── Reads ───────────────────────────────────────────────────────────────

export async function listClients(): Promise<Client[]> {
  if (isDemoMode()) return [...demo.clients];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*, client_contacts(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(mapClient);
}

export async function listProjects(): Promise<Project[]> {
  if (isDemoMode()) return [...demo.projects];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*, milestones(*), project_members(employee_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(mapProject);
}

export async function listTasks(): Promise<Task[]> {
  if (isDemoMode()) return [...demo.tasks];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_comments(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(mapTask);
}

// ── Calendar events (Phase 5.5) ─────────────────────────────────────────

function mapEvent(r: Row): CalendarEvent {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    kind: r.kind,
    date: str(r.starts_on),
    time: (r.starts_at ? String(r.starts_at).slice(0, 5) : "") || "",
    durationMin: num(r.duration_min),
    attendeeIds: [],
    relatedClientId: r.client_id ?? null,
    type: str(r.category) || undefined,
    projectId: r.project_id ?? null,
    assigneeId: r.assignee_id ?? null,
    priority: r.priority ?? undefined,
    status: str(r.status) || undefined,
    reminder: str(r.reminder) || undefined,
    notes: str(r.notes) || undefined,
  };
}

export type EventInput = {
  title: string;
  kind: EventKind;
  type?: string;
  date: string;
  time: string;
  durationMin: number;
  clientId?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
  priority?: Priority;
  reminder?: string;
  notes?: string;
};

export async function listEvents(): Promise<CalendarEvent[]> {
  if (isDemoMode()) return [...seed.events];
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_on", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(mapEvent);
}

export async function createEvent(input: EventInput): Promise<CalendarEvent> {
  if (isDemoMode()) {
    const row: CalendarEvent = {
      id: `ev-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      title: input.title,
      kind: input.kind,
      date: input.date,
      time: input.time,
      durationMin: input.durationMin,
      attendeeIds: input.assigneeId ? [input.assigneeId] : [],
      relatedClientId: input.clientId ?? null,
      type: input.type,
      projectId: input.projectId ?? null,
      assigneeId: input.assigneeId ?? null,
      priority: input.priority,
      status: "scheduled",
      reminder: input.reminder,
      notes: input.notes,
    };
    seed.events.push(row);
    return row;
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      kind: input.kind,
      category: input.type ?? null,
      starts_on: input.date,
      starts_at: input.time || null,
      duration_min: input.durationMin,
      client_id: input.clientId || null,
      project_id: input.projectId || null,
      assignee_id: input.assigneeId || null,
      priority: input.priority ?? null,
      reminder: input.reminder ?? null,
      notes: input.notes ?? null,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapEvent(data as Row);
}

export async function updateEvent(id: string, patch: Partial<EventInput>): Promise<void> {
  if (isDemoMode()) {
    const ev = seed.events.find((e) => e.id === id);
    if (ev) {
      if (patch.date) ev.date = patch.date;
      if (patch.time) ev.time = patch.time;
      if (patch.title) ev.title = patch.title;
    }
    return;
  }
  const supabase = requireSupabase();
  const payload: Row = {};
  if (patch.date) payload.starts_on = patch.date;
  if (patch.time !== undefined) payload.starts_at = patch.time || null;
  if (patch.title) payload.title = patch.title;
  if (patch.type) payload.category = patch.type;
  if (patch.priority) payload.priority = patch.priority;
  if (patch.reminder !== undefined) payload.reminder = patch.reminder;
  const { error } = await supabase.from("events").update(payload).eq("id", id);
  if (error) throw error;
}

export async function listInvoices(): Promise<Invoice[]> {
  if (isDemoMode()) return seed.invoices;
  const supabase = requireSupabase();
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
      service: str(i.service),
      description: i.description,
      qty: num(i.qty),
      unitPrice: num(i.unit_price),
      discountPct: num(i.discount_pct),
    })),
    paidAmount: num(r.paid_amount),
    recurring: Boolean(r.recurring),
    notes: str(r.notes),
    terms: str(r.terms),
  }));
}

export async function listExpenses(): Promise<Expense[]> {
  if (isDemoMode()) return seed.expenses;
  const supabase = requireSupabase();
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
  if (isDemoMode()) return seed.quotations;
  const supabase = requireSupabase();
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
      service: str(i.service),
      description: i.description,
      qty: num(i.qty),
      unitPrice: num(i.unit_price),
      discountPct: num(i.discount_pct),
    })),
    notes: str(r.notes),
    terms: str(r.terms),
  }));
}

export async function listCampaigns(): Promise<Campaign[]> {
  if (isDemoMode()) return seed.campaigns;
  const supabase = requireSupabase();
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
  if (isDemoMode()) return seed.stores;
  const supabase = requireSupabase();
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
  if (isDemoMode()) return seed.employees;
  const supabase = requireSupabase();
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
  if (isDemoMode()) return seed.notifications;
  const supabase = requireSupabase();
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

export async function listCatalog(): Promise<CatalogItem[]> {
  if (isDemoMode()) return seed.catalog;
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("catalog_items").select("*").order("name");
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    kind: r.kind,
    name: r.name,
    category: str(r.category),
    sku: str(r.sku),
    unit: str(r.unit),
    price: num(r.price),
    cost: num(r.cost),
    vatApplicable: Boolean(r.vat_applicable),
    active: Boolean(r.active),
    description: str(r.description),
  }));
}

// ── Client mutations ────────────────────────────────────────────────────
// Every production mutation writes to Supabase and returns the real row.
// tenant_id / creator ids come from DB defaults bound to the session
// (migration 0007), so RLS-scoped inserts need no client-side tenant value.

export type ClientInput = Pick<
  Client,
  "name" | "industry" | "status" | "city" | "address" | "cr" | "vatNumber" | "website" | "email" | "phone" | "notes"
> & { contactName?: string };

export async function createClient(input: ClientInput): Promise<Client> {
  if (isDemoMode()) {
    const row: Client = {
      id: `cl-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      contacts: input.contactName ? [{ name: input.contactName, title: "", email: input.email, phone: input.phone }] : [],
      tags: [],
      since: new Date().toISOString().slice(0, 10),
      lastActivity: new Date().toISOString(),
      ...input,
    };
    demo.clients.unshift(row);
    return row;
  }
  const supabase = requireSupabase();
  // Return only the inserted client row. We deliberately do NOT embed
  // client_contacts(*) here: a brand-new client has no contacts, and embedding
  // a second table in the INSERT ... RETURNING couples the whole insert to
  // client_contacts read permission — a failure there rolls back the client.
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      industry: input.industry,
      status: input.status,
      city: input.city,
      address: input.address,
      cr_number: input.cr || null,
      vat_number: input.vatNumber || null,
      website: input.website,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
    })
    .select("*")
    .single();
  if (error) throw error;
  const client = mapClient(data as Row);
  // Optional first contact — inserted separately so a contact-table issue can
  // never roll back a successfully created client.
  if (input.contactName) {
    const { error: contactError } = await supabase
      .from("client_contacts")
      .insert({ client_id: client.id, name: input.contactName, email: input.email, phone: input.phone });
    if (!contactError) client.contacts = [{ name: input.contactName, title: "", email: input.email, phone: input.phone }];
  }
  return client;
}

export async function updateClient(id: string, patch: Partial<ClientInput>): Promise<void> {
  if (isDemoMode()) {
    demo.clients = demo.clients.map((c) => (c.id === id ? { ...c, ...patch } : c));
    return;
  }
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("clients")
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.industry !== undefined && { industry: patch.industry }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.city !== undefined && { city: patch.city }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.cr !== undefined && { cr_number: patch.cr || null }),
      ...(patch.vatNumber !== undefined && { vat_number: patch.vatNumber || null }),
      ...(patch.website !== undefined && { website: patch.website }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.phone !== undefined && { phone: patch.phone }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function archiveClient(id: string): Promise<void> {
  return updateClient(id, { status: "archived" });
}

// ── Project mutations ───────────────────────────────────────────────────

export type ProjectInput = Pick<
  Project,
  "name" | "clientId" | "service" | "priority" | "budget" | "startDate" | "deadline" | "managerId" | "description"
>;

export async function createProject(input: ProjectInput): Promise<Project> {
  if (isDemoMode()) {
    const row: Project = {
      id: `pr-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      status: "planning",
      progress: 0,
      spent: 0,
      teamIds: input.managerId ? [input.managerId] : [],
      hoursLogged: 0,
      milestones: [],
      ...input,
    };
    demo.projects.unshift(row);
    return row;
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      client_id: input.clientId || null,
      service: input.service,
      priority: input.priority,
      budget: input.budget,
      start_date: input.startDate || null,
      deadline: input.deadline || null,
      manager_id: input.managerId || null,
      description: input.description,
      status: "planning",
    })
    .select("*, milestones(*), project_members(employee_id)")
    .single();
  if (error) throw error;
  return mapProject(data as Row);
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  if (isDemoMode()) {
    demo.projects = demo.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
    return;
  }
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("projects")
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.progress !== undefined && { progress: patch.progress }),
      ...(patch.budget !== undefined && { budget: patch.budget }),
      ...(patch.deadline !== undefined && { deadline: patch.deadline }),
      ...(patch.description !== undefined && { description: patch.description }),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  if (isDemoMode()) {
    demo.projects = demo.projects.filter((p) => p.id !== id);
    demo.tasks = demo.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t));
    return;
  }
  const supabase = requireSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ── Task mutations ──────────────────────────────────────────────────────

export type TaskInput = Pick<
  Task,
  "title" | "status" | "priority" | "projectId" | "clientId" | "assigneeId" | "startDate" | "dueDate" | "labels" | "notes"
>;

export async function createTask(input: TaskInput): Promise<Task> {
  if (isDemoMode()) {
    const row: Task = {
      id: `tk-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      creatorId: "e-1",
      estimateH: 0,
      spentH: 0,
      subtasksDone: 0,
      subtasksTotal: 0,
      comments: 0,
      attachments: 0,
      ...input,
    };
    demo.tasks.unshift(row);
    return row;
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      status: input.status,
      priority: input.priority,
      project_id: input.projectId || null,
      client_id: input.clientId || null,
      assignee_id: input.assigneeId || null,
      start_date: input.startDate || null,
      due_date: input.dueDate || null,
      labels: input.labels,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTask(data as Row);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  if (isDemoMode()) {
    demo.tasks = demo.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    return;
  }
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("tasks")
    .update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.projectId !== undefined && { project_id: patch.projectId }),
      ...(patch.clientId !== undefined && { client_id: patch.clientId }),
      ...(patch.assigneeId !== undefined && { assignee_id: patch.assigneeId || null }),
      ...(patch.startDate !== undefined && { start_date: patch.startDate || null }),
      ...(patch.dueDate !== undefined && { due_date: patch.dueDate }),
      ...(patch.estimateH !== undefined && { estimate_hours: patch.estimateH }),
      ...(patch.spentH !== undefined && { spent_hours: patch.spentH }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
    })
    .eq("id", id);
  if (error) throw error;
}

// ── Task comments ───────────────────────────────────────────────────────

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  if (isDemoMode()) return demo.taskComments.filter((c) => c.taskId === taskId);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at");
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    taskId: r.task_id,
    authorId: str(r.author_id),
    body: r.body,
    createdAt: str(r.created_at),
  }));
}

export async function addTaskComment(taskId: string, body: string): Promise<TaskComment> {
  if (isDemoMode()) {
    const row: TaskComment = {
      id: `tc-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      taskId,
      authorId: "e-1",
      body,
      createdAt: new Date().toISOString(),
    };
    demo.taskComments.push(row);
    return row;
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, body })
    .select()
    .single();
  if (error) throw error;
  const r = data as Row;
  return { id: r.id, tenantId: r.tenant_id, taskId: r.task_id, authorId: str(r.author_id), body: r.body, createdAt: str(r.created_at) };
}

// ── Task attachments (Supabase Storage, bucket "attachments") ───────────

export const ATTACHMENT_MAX_MB = 10;
export const ATTACHMENT_TYPES: Record<string, FileItem["type"]> = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "application/vnd.ms-excel": "sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sheet",
  "application/zip": "doc",
  "text/plain": "doc",
};

export class AttachmentValidationError extends Error {
  readonly name = "AttachmentValidationError";
}

function validateAttachment(file: File): FileItem["type"] {
  if (file.size > ATTACHMENT_MAX_MB * 1024 * 1024) {
    throw new AttachmentValidationError(`File exceeds ${ATTACHMENT_MAX_MB} MB`);
  }
  const kind = ATTACHMENT_TYPES[file.type];
  if (!kind) throw new AttachmentValidationError(`File type not allowed: ${file.type || "unknown"}`);
  return kind;
}

/** Storage object path: safe, unguessable, scoped under the task. */
function attachmentPath(taskId: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-؀-ۿ]/g, "_").slice(-80);
  return `tasks/${taskId}/${crypto.randomUUID()}-${safe}`;
}

export async function listTaskAttachments(taskId: string): Promise<FileItem[]> {
  if (isDemoMode()) return demo.attachments.filter((f) => f.taskId === taskId);
  const supabase = requireSupabase();
  const { data, error } = await supabase.from("files").select("*").eq("task_id", taskId).order("created_at");
  if (error) throw error;
  return (data as Row[]).map(mapFile);
}

export async function uploadTaskAttachment(taskId: string, file: File): Promise<FileItem> {
  const kind = validateAttachment(file);
  if (isDemoMode()) {
    const row: FileItem = {
      id: `att-${Date.now()}`,
      tenantId: seed.TENANT_ID,
      name: file.name,
      folder: "",
      type: kind,
      sizeMB: file.size / (1024 * 1024),
      ownerId: "e-1",
      modifiedAt: new Date().toISOString(),
      versions: 1,
      taskId,
      storagePath: URL.createObjectURL(file), // demo-only: local object URL
    };
    demo.attachments.push(row);
    return row;
  }
  const supabase = requireSupabase();
  const path = attachmentPath(taskId, file.name);
  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from("files")
    .insert({
      name: file.name,
      kind,
      size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
      storage_path: path,
      task_id: taskId,
    })
    .select()
    .single();
  if (error) {
    // keep storage consistent with metadata
    await supabase.storage.from("attachments").remove([path]);
    throw error;
  }
  return mapFile(data as Row);
}

export async function attachmentUrl(item: FileItem): Promise<string> {
  if (isDemoMode()) return item.storagePath ?? "#";
  const supabase = requireSupabase();
  const { data, error } = await supabase.storage.from("attachments").createSignedUrl(item.storagePath ?? "", 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteTaskAttachment(item: FileItem): Promise<void> {
  if (isDemoMode()) {
    demo.attachments = demo.attachments.filter((f) => f.id !== item.id);
    return;
  }
  const supabase = requireSupabase();
  if (item.storagePath) {
    const { error: storageError } = await supabase.storage.from("attachments").remove([item.storagePath]);
    if (storageError) throw storageError;
  }
  const { error } = await supabase.from("files").delete().eq("id", item.id);
  if (error) throw error;
}
