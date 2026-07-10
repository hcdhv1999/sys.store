// ── HIRF domain model ──────────────────────────────────────────────────
// Every entity carries tenant_id so the demo layer mirrors the multi-tenant
// Supabase schema in /supabase/migrations one-to-one.

export type ClientStatus = "active" | "lead" | "inactive" | "archived";
export type ProjectStatus = "planning" | "inProgress" | "review" | "completed" | "onHold";
// Board statuses map to the spec's New / In Progress / Review / Completed;
// "cancelled" is a terminal state kept off the default board.
export type TaskStatus = "todo" | "inProgress" | "review" | "done" | "cancelled";
export type Priority = "low" | "medium" | "high" | "urgent";
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type CampaignStatus = "active" | "paused" | "completed" | "draft";
export type CampaignPlatform = "meta" | "google" | "tiktok" | "snapchat" | "linkedin";
export type StorePlatform = "salla" | "zid" | "shopify" | "woocommerce";
export type StoreStatus = "live" | "development" | "maintenance";
export type AttendanceStatus = "present" | "remote" | "onLeave";
export type Role = "owner" | "admin" | "manager" | "member" | "accountant" | "viewer";
export type EventKind = "meeting" | "deadline" | "launch" | "internal";

export interface Tenant {
  id: string;
  name: string;
  nameEn: string;
  legalStatus: "freelance" | "company";
  /** وثيقة العمل الحر — primary registration for freelance businesses */
  freelanceLicense: string;
  mobile: string;
  email: string;
  /** optional — freelance businesses may not have these yet */
  cr: string;
  vatNumber: string;
  city: string;
  plan: "pro";
}

export type CatalogKind = "product" | "service";

export interface CatalogItem {
  id: string;
  tenantId: string;
  kind: CatalogKind;
  name: string;
  category: string;
  sku: string;
  unit: string;
  price: number;
  cost: number;
  vatApplicable: boolean;
  active: boolean;
  description: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string;
  role: Role;
  joinedAt: string;
  attendance: AttendanceStatus;
  hoursThisMonth: number;
  tasksCompleted: number;
  utilization: number; // 0..100
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  headId: string;
  color: string; // chart var reference, e.g. "var(--chart-1)"
}

export interface Contact {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  industry: string;
  status: ClientStatus;
  city: string;
  address: string;
  cr: string;
  vatNumber: string;
  website: string;
  email: string;
  phone: string;
  contacts: Contact[];
  tags: string[];
  since: string;
  notes: string;
  lastActivity: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
}

export interface Project {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  service: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number; // 0..100
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  managerId: string;
  teamIds: string[];
  hoursLogged: number;
  milestones: Milestone[];
  description: string;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string | null;
  /** direct client link; when null it is derived from the task's project */
  clientId?: string | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string;
  /** who created the task */
  creatorId?: string;
  startDate?: string;
  dueDate: string;
  labels: string[];
  estimateH: number;
  spentH: number;
  notes?: string;
  subtasksDone: number;
  subtasksTotal: number;
  comments: number;
  attachments: number;
}

export interface TaskComment {
  id: string;
  tenantId: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface InvoiceItem {
  /** short service name shown in the items table (optional for legacy rows) */
  service?: string;
  description: string;
  qty: number;
  unitPrice: number;
  /** per-line discount in percent (0–100); absent = 0 */
  discountPct?: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  clientId: string;
  projectId: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  paidAmount: number;
  recurring: boolean;
  notes?: string;
  terms?: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export interface Quotation {
  id: string;
  tenantId: string;
  number: string;
  clientId: string;
  title: string;
  status: QuoteStatus;
  issueDate: string;
  validUntil: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  platform: CampaignPlatform;
  objective: string;
  status: CampaignStatus;
  budget: number;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export interface Store {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  platform: StorePlatform;
  status: StoreStatus;
  domain: string;
  hosting: string;
  launchDate: string;
  monthlySales: number;
  monthlyOrders: number;
  visitors: number;
  conversionRate: number;
  integrations: string[];
  pixels: string[];
  emails: string[];
}

export interface FileItem {
  id: string;
  tenantId: string;
  name: string;
  folder: string;
  type: "pdf" | "image" | "doc" | "sheet" | "video" | "design";
  sizeMB: number;
  ownerId: string;
  modifiedAt: string;
  versions: number;
  /** set when the file is a task attachment */
  taskId?: string | null;
  /** storage object path (production) or object URL (demo) */
  storagePath?: string;
}

export interface CalendarEvent {
  id: string;
  tenantId: string;
  title: string;
  kind: EventKind;
  date: string; // ISO date
  time: string; // HH:mm
  durationMin: number;
  attendeeIds: string[];
  relatedClientId: string | null;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  kind: "invoice" | "task" | "project" | "campaign" | "system";
  createdAt: string;
  read: boolean;
  href: string;
}

export interface ActivityItem {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  target: string;
  href: string;
  at: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  event: string;
  ip: string;
  at: string;
}

export interface MonthPoint {
  month: string; // "2026-01"
  revenue: number;
  expenses: number;
}
