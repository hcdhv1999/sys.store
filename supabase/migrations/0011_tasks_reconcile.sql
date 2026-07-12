-- ═══════════════════════════════════════════════════════════════════════
-- Reconcile tasks/files with the app (the Phase 5.4 workflow columns).
--
-- The app inserts/reads tasks.client_id / creator_id / start_date / notes and
-- files.task_id — all defined by 0006. On a schema where 0006 never ran, those
-- columns are missing and PostgREST returns PGRST204 ("Could not find the
-- 'client_id' column"). This migration adds exactly those, guarded so it is
-- production-safe on any schema: it never errors, never touches existing data,
-- RLS, or defaults. It is NOT a rename (no customer_id exists anywhere) — the
-- columns were simply never created on the live database.
-- Additive + idempotent.
-- ═══════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.tasks') is not null then
    -- Missing workflow columns (nullable; existing rows keep working).
    alter table public.tasks add column if not exists client_id  uuid;
    alter table public.tasks add column if not exists creator_id uuid;
    alter table public.tasks add column if not exists start_date date;
    alter table public.tasks add column if not exists notes      text;

    -- Foreign keys only when the referenced table exists and the FK is absent.
    if to_regclass('public.clients') is not null and not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public' and table_name = 'tasks' and constraint_name = 'tasks_client_id_fkey'
    ) then
      alter table public.tasks
        add constraint tasks_client_id_fkey foreign key (client_id) references public.clients (id) on delete set null;
    end if;

    if to_regclass('public.profiles') is not null and not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public' and table_name = 'tasks' and constraint_name = 'tasks_creator_id_fkey'
    ) then
      alter table public.tasks
        add constraint tasks_creator_id_fkey foreign key (creator_id) references public.profiles (id) on delete set null;
    end if;

    create index if not exists tasks_client_idx on public.tasks (client_id);
  end if;

  -- Task attachments link (files.task_id) — same guarded pattern.
  if to_regclass('public.files') is not null then
    alter table public.files add column if not exists task_id uuid;
    if to_regclass('public.tasks') is not null and not exists (
      select 1 from information_schema.table_constraints
      where table_schema = 'public' and table_name = 'files' and constraint_name = 'files_task_id_fkey'
    ) then
      alter table public.files
        add constraint files_task_id_fkey foreign key (task_id) references public.tasks (id) on delete set null;
    end if;
    create index if not exists files_task_idx on public.files (task_id);
  end if;
end $$;

-- New terminal task status used by cancel/delete. Added separately and guarded
-- on the enum's existence; ADD VALUE IF NOT EXISTS is idempotent.
do $$
begin
  if exists (select 1 from pg_type where typname = 'task_status') then
    execute 'alter type task_status add value if not exists ''cancelled''';
  end if;
end $$;

-- Nudge PostgREST to reload its schema cache so the new columns are visible
-- immediately (clears the PGRST204 without waiting for the periodic reload).
notify pgrst, 'reload schema';
