-- ═══════════════════════════════════════════════════════════════════════
-- Root cause (proven on the live DB during the smoke test): only 5 tables had
-- tenant_id DEFAULT current_tenant_id() (clients, events, files, task_comments,
-- tasks — the ones from migrations actually applied to live); ALL other business
-- tables had a NULL default because the broad 0009 was never applied on live.
-- The app omits tenant_id on insert and relies on the default, so inserts into
-- projects / invoices / quotations / campaigns / stores / milestones / etc. stored
-- NULL and were rejected by the RLS INSERT policy (42501).
--
-- This sets the default on every business table that has a tenant_id column and no
-- default yet. Excludes profiles (its tenant is set at signup, and current_tenant_id()
-- reads FROM profiles, so defaulting it would be circular). Guarded, additive,
-- idempotent — once a default is set, the loop skips that table on re-runs.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare r record;
begin
  if not exists (select 1 from pg_proc where proname = 'current_tenant_id') then
    raise notice '0014: current_tenant_id() missing — skipped';
    return;
  end if;
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'tenant_id'
      and column_default is null
      and table_name <> 'profiles'
  loop
    execute format('alter table public.%I alter column tenant_id set default current_tenant_id()', r.table_name);
  end loop;
end $$;
