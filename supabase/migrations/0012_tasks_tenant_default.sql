-- ═══════════════════════════════════════════════════════════════════════
-- Session-bound defaults for tasks and its workflow tables (task_comments,
-- files). Same fix as clients: the app never sends tenant_id, so the RLS
-- INSERT policy `WITH CHECK (tenant_id = current_tenant_id())` requires the
-- column to default to current_tenant_id(); otherwise the row gets NULL and
-- the insert fails with 42501 (RLS violation).
--
-- Each ALTER runs ONLY when the column's default is currently NULL (never
-- overwrites an existing default) and only when the helper function exists.
-- creator_id / author_id / owner_id default to auth.uid() for data quality
-- (they are nullable, so this is not required for RLS — added guarded anyway).
-- Additive, idempotent, no existing data / RLS / constraints touched.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  has_tenant_fn boolean := exists (select 1 from pg_proc where proname = 'current_tenant_id');
  has_auth_uid  boolean := exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  );
begin
  -- ── tasks ──────────────────────────────────────────────────────────────
  if to_regclass('public.tasks') is not null then
    if has_tenant_fn and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tasks'
        and column_name = 'tenant_id' and column_default is null
    ) then
      alter table public.tasks alter column tenant_id set default current_tenant_id();
    end if;

    if has_auth_uid and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tasks'
        and column_name = 'creator_id' and column_default is null
    ) then
      alter table public.tasks alter column creator_id set default auth.uid();
    end if;
  end if;

  -- ── task_comments ──────────────────────────────────────────────────────
  if to_regclass('public.task_comments') is not null then
    if has_tenant_fn and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'task_comments'
        and column_name = 'tenant_id' and column_default is null
    ) then
      alter table public.task_comments alter column tenant_id set default current_tenant_id();
    end if;

    if has_auth_uid and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'task_comments'
        and column_name = 'author_id' and column_default is null
    ) then
      alter table public.task_comments alter column author_id set default auth.uid();
    end if;
  end if;

  -- ── files (task attachments) ───────────────────────────────────────────
  if to_regclass('public.files') is not null then
    if has_tenant_fn and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'files'
        and column_name = 'tenant_id' and column_default is null
    ) then
      alter table public.files alter column tenant_id set default current_tenant_id();
    end if;

    if has_auth_uid and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'files'
        and column_name = 'owner_id' and column_default is null
    ) then
      alter table public.files alter column owner_id set default auth.uid();
    end if;
  end if;
end $$;
