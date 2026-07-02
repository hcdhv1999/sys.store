-- ═══════════════════════════════════════════════════════════════════════
-- HIRF (حِرف) — multi-tenant ERP/CRM schema
-- Every business table carries tenant_id; RLS in 0002 enforces isolation.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────
create type member_role as enum ('owner','admin','manager','member','accountant','viewer');
create type client_status as enum ('active','lead','inactive','archived');
create type project_status as enum ('planning','inProgress','review','completed','onHold');
create type task_status as enum ('todo','inProgress','review','done');
create type priority_level as enum ('low','medium','high','urgent');
create type invoice_status as enum ('draft','sent','paid','partial','overdue');
create type quote_status as enum ('draft','sent','approved','rejected','expired');
create type campaign_platform as enum ('meta','google','tiktok','snapchat','linkedin');
create type campaign_status as enum ('active','paused','completed','draft');
create type store_platform as enum ('salla','zid','shopify','woocommerce');
create type store_status as enum ('live','development','maintenance');
create type attendance_status as enum ('present','remote','onLeave');
create type event_kind as enum ('meeting','deadline','launch','internal');
create type notification_kind as enum ('invoice','task','project','campaign','system');

-- ── Tenancy ──────────────────────────────────────────────────────────────
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_en     text not null default '',
  cr_number   text,
  vat_number  text,
  city        text,
  plan        text not null default 'pro',
  branding    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Workspace membership: links auth.users to a tenant with a role.
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  tenant_id   uuid not null references tenants (id) on delete cascade,
  full_name   text not null,
  full_name_en text,
  email       text not null,
  phone       text,
  role        member_role not null default 'member',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_tenant_idx on profiles (tenant_id);

create table departments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  name        text not null,
  head_id     uuid references profiles (id) on delete set null,
  color       text,
  created_at  timestamptz not null default now()
);
create index departments_tenant_idx on departments (tenant_id);

create table employees (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants (id) on delete cascade,
  profile_id    uuid references profiles (id) on delete set null,
  department_id uuid references departments (id) on delete set null,
  job_title     text not null default '',
  joined_at     date,
  attendance    attendance_status not null default 'present',
  hours_month   numeric(6,1) not null default 0,
  utilization   smallint not null default 0 check (utilization between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index employees_tenant_idx on employees (tenant_id);
create index employees_department_idx on employees (department_id);

-- ── CRM ──────────────────────────────────────────────────────────────────
create table clients (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  name         text not null,
  industry     text,
  status       client_status not null default 'lead',
  city         text,
  address      text,
  cr_number    text,
  vat_number   text,
  website      text,
  email        text,
  phone        text,
  tags         text[] not null default '{}',
  notes        text,
  since        date not null default current_date,
  last_activity timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index clients_tenant_idx on clients (tenant_id);
create index clients_status_idx on clients (tenant_id, status);

create table client_contacts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  client_id   uuid not null references clients (id) on delete cascade,
  name        text not null,
  title       text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);
create index client_contacts_client_idx on client_contacts (client_id);
create index client_contacts_tenant_idx on client_contacts (tenant_id);

-- ── Projects & tasks ─────────────────────────────────────────────────────
create table projects (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  client_id   uuid references clients (id) on delete set null,
  manager_id  uuid references employees (id) on delete set null,
  name        text not null,
  service     text,
  description text,
  status      project_status not null default 'planning',
  priority    priority_level not null default 'medium',
  progress    smallint not null default 0 check (progress between 0 and 100),
  budget      numeric(12,2) not null default 0,
  spent       numeric(12,2) not null default 0,
  hours_logged numeric(8,1) not null default 0,
  start_date  date,
  deadline    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_tenant_idx on projects (tenant_id);
create index projects_client_idx on projects (client_id);
create index projects_status_idx on projects (tenant_id, status);

create table project_members (
  project_id  uuid not null references projects (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  tenant_id   uuid not null references tenants (id) on delete cascade,
  primary key (project_id, employee_id)
);
create index project_members_tenant_idx on project_members (tenant_id);

create table milestones (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  project_id  uuid not null references projects (id) on delete cascade,
  title       text not null,
  due_date    date,
  done        boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index milestones_project_idx on milestones (project_id);
create index milestones_tenant_idx on milestones (tenant_id);

create table tasks (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants (id) on delete cascade,
  project_id     uuid references projects (id) on delete cascade,
  assignee_id    uuid references employees (id) on delete set null,
  title          text not null,
  status         task_status not null default 'todo',
  priority       priority_level not null default 'medium',
  due_date       date,
  labels         text[] not null default '{}',
  estimate_hours numeric(6,1) not null default 0,
  spent_hours    numeric(6,1) not null default 0,
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index tasks_tenant_idx on tasks (tenant_id);
create index tasks_project_idx on tasks (project_id);
create index tasks_assignee_idx on tasks (assignee_id);
create index tasks_status_idx on tasks (tenant_id, status);

create table task_comments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  task_id     uuid not null references tasks (id) on delete cascade,
  author_id   uuid references profiles (id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index task_comments_task_idx on task_comments (task_id);
create index task_comments_tenant_idx on task_comments (tenant_id);

-- ── Finance ──────────────────────────────────────────────────────────────
create table invoices (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  client_id   uuid not null references clients (id) on delete restrict,
  project_id  uuid references projects (id) on delete set null,
  number      text not null,
  status      invoice_status not null default 'draft',
  issue_date  date not null default current_date,
  due_date    date,
  vat_rate    numeric(4,2) not null default 0.15,
  paid_amount numeric(12,2) not null default 0,
  recurring   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, number)
);
create index invoices_tenant_idx on invoices (tenant_id);
create index invoices_client_idx on invoices (client_id);
create index invoices_status_idx on invoices (tenant_id, status);

create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  invoice_id  uuid not null references invoices (id) on delete cascade,
  description text not null,
  qty         numeric(10,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  position    int not null default 0
);
create index invoice_items_invoice_idx on invoice_items (invoice_id);
create index invoice_items_tenant_idx on invoice_items (tenant_id);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  invoice_id  uuid not null references invoices (id) on delete cascade,
  amount      numeric(12,2) not null,
  method      text,
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index payments_invoice_idx on payments (invoice_id);
create index payments_tenant_idx on payments (tenant_id);

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  title       text not null,
  category    text not null,
  vendor      text,
  amount      numeric(12,2) not null,
  spent_on    date not null default current_date,
  recurring   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index expenses_tenant_idx on expenses (tenant_id);
create index expenses_category_idx on expenses (tenant_id, category);

create table quotations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  client_id   uuid not null references clients (id) on delete restrict,
  number      text not null,
  title       text not null,
  status      quote_status not null default 'draft',
  issue_date  date not null default current_date,
  valid_until date,
  converted_project_id uuid references projects (id) on delete set null,
  converted_invoice_id uuid references invoices (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, number)
);
create index quotations_tenant_idx on quotations (tenant_id);
create index quotations_client_idx on quotations (client_id);

create table quotation_items (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  quotation_id uuid not null references quotations (id) on delete cascade,
  description  text not null,
  qty          numeric(10,2) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  position     int not null default 0
);
create index quotation_items_quote_idx on quotation_items (quotation_id);
create index quotation_items_tenant_idx on quotation_items (tenant_id);

-- ── Marketing ────────────────────────────────────────────────────────────
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  client_id   uuid not null references clients (id) on delete cascade,
  name        text not null,
  platform    campaign_platform not null,
  objective   text,
  status      campaign_status not null default 'draft',
  budget      numeric(12,2) not null default 0,
  spend       numeric(12,2) not null default 0,
  revenue     numeric(12,2) not null default 0,
  impressions bigint not null default 0,
  clicks      bigint not null default 0,
  conversions int not null default 0,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index campaigns_tenant_idx on campaigns (tenant_id);
create index campaigns_client_idx on campaigns (client_id);
create index campaigns_status_idx on campaigns (tenant_id, status);

-- ── Stores ───────────────────────────────────────────────────────────────
create table stores (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants (id) on delete cascade,
  client_id       uuid not null references clients (id) on delete cascade,
  name            text not null,
  platform        store_platform not null,
  status          store_status not null default 'development',
  domain          text,
  hosting         text,
  launch_date     date,
  monthly_sales   numeric(12,2) not null default 0,
  monthly_orders  int not null default 0,
  visitors        int not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  integrations    text[] not null default '{}',
  pixels          text[] not null default '{}',
  emails          text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index stores_tenant_idx on stores (tenant_id);
create index stores_client_idx on stores (client_id);

-- ── Files (metadata; binaries live in Supabase Storage) ─────────────────
create table folders (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (tenant_id, name)
);
create index folders_tenant_idx on folders (tenant_id);

create table files (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  folder_id   uuid references folders (id) on delete set null,
  owner_id    uuid references profiles (id) on delete set null,
  name        text not null,
  kind        text not null default 'doc',
  size_mb     numeric(10,2) not null default 0,
  storage_path text,
  versions    int not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index files_tenant_idx on files (tenant_id);
create index files_folder_idx on files (folder_id);

-- ── Calendar, notifications, activity ────────────────────────────────────
create table events (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  client_id    uuid references clients (id) on delete set null,
  title        text not null,
  kind         event_kind not null default 'meeting',
  starts_on    date not null,
  starts_at    time,
  duration_min int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index events_tenant_idx on events (tenant_id);
create index events_date_idx on events (tenant_id, starts_on);

create table event_attendees (
  event_id    uuid not null references events (id) on delete cascade,
  employee_id uuid not null references employees (id) on delete cascade,
  tenant_id   uuid not null references tenants (id) on delete cascade,
  primary key (event_id, employee_id)
);
create index event_attendees_tenant_idx on event_attendees (tenant_id);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  user_id     uuid references profiles (id) on delete cascade,
  title       text not null,
  body        text not null default '',
  kind        notification_kind not null default 'system',
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read);
create index notifications_tenant_idx on notifications (tenant_id);

create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  actor_id    uuid references profiles (id) on delete set null,
  action      text not null,
  target      text not null,
  href        text,
  created_at  timestamptz not null default now()
);
create index activity_log_tenant_idx on activity_log (tenant_id, created_at desc);

create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  actor       text not null,
  event       text not null,
  ip          inet,
  created_at  timestamptz not null default now()
);
create index audit_log_tenant_idx on audit_log (tenant_id, created_at desc);

create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  name        text not null,
  -- Only a hash is stored; the plaintext key is shown once at creation.
  key_hash    text not null,
  prefix      text not null,
  last_used_at timestamptz,
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index api_keys_tenant_idx on api_keys (tenant_id);

-- ── updated_at maintenance ───────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'tenants','profiles','employees','clients','projects','tasks','invoices',
    'expenses','quotations','campaigns','stores','files','events'
  ] loop
    execute format(
      'create trigger %I_touch before update on %I for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;
