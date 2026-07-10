-- ═══════════════════════════════════════════════════════════════════════
-- Phase 5.5 — Smart Calendar. Additive-only enrichment of the existing
-- `events` table. Rewritten to be production-safe against a divergent schema:
-- it makes NO assumption that earlier migrations ran. Every step is guarded,
-- so it never errors and never touches existing data, RLS, or the tenant_id
-- default — it only ADDS nullable columns, two foreign keys (only when the
-- referenced tables exist), and two indexes. Fully idempotent.
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  -- If there is no events table there is nothing to enrich — do nothing.
  if to_regclass('public.events') is null then
    raise notice '0010: public.events not found — skipped (no changes made)';
    return;
  end if;

  -- Set the tenant_id default to current_tenant_id() ONLY when the column has
  -- no default yet (column_default IS NULL) and the helper exists — same fix as
  -- clients. Never overwrites an existing default and never touches existing
  -- rows; inserts that omit tenant_id will then satisfy the RLS WITH CHECK.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events'
      and column_name = 'tenant_id' and column_default is null
  ) and exists (select 1 from pg_proc where proname = 'current_tenant_id') then
    alter table public.events alter column tenant_id set default current_tenant_id();
  end if;

  -- Plain, always-safe columns.
  alter table public.events add column if not exists category text;
  alter table public.events add column if not exists status   text not null default 'scheduled';
  alter table public.events add column if not exists reminder text;
  alter table public.events add column if not exists notes    text;

  -- priority: reuse the priority_level enum if it exists, else fall back to text.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'priority'
  ) then
    if exists (select 1 from pg_type where typname = 'priority_level') then
      alter table public.events add column priority priority_level;
    else
      alter table public.events add column priority text;
    end if;
  end if;

  -- project_id: add the column always; add the FK only if projects exists and
  -- the constraint is not already present.
  alter table public.events add column if not exists project_id uuid;
  if to_regclass('public.projects') is not null and not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'events' and constraint_name = 'events_project_id_fkey'
  ) then
    alter table public.events
      add constraint events_project_id_fkey
      foreign key (project_id) references public.projects (id) on delete set null;
  end if;

  -- assignee_id: same guarded pattern against employees.
  alter table public.events add column if not exists assignee_id uuid;
  if to_regclass('public.employees') is not null and not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'events' and constraint_name = 'events_assignee_id_fkey'
  ) then
    alter table public.events
      add constraint events_assignee_id_fkey
      foreign key (assignee_id) references public.employees (id) on delete set null;
  end if;

  create index if not exists events_project_idx  on public.events (project_id);
  create index if not exists events_assignee_idx on public.events (assignee_id);
end $$;
