-- ═══════════════════════════════════════════════════════════════════════
-- ROOT CAUSE FIX (proven on the live DB via direct inspection):
-- RLS was ENABLED on 23 business tables but they had ZERO policies, while only
-- clients/profiles/tenants had policies. In PostgreSQL, RLS-enabled + no policy
-- = deny all, so every insert EXCEPT clients failed with 42501
-- ("new row violates row-level security policy"). That is why creating a client
-- worked but creating a task/project/event/etc. did not.
--
-- This creates the SAME tenant-scoped policies clients already has
-- (role: authenticated, predicate: tenant_id = current_tenant_id()) on every
-- business table that has a tenant_id column. Idempotent (drop-if-exists),
-- additive, no data touched, RLS/tenant isolation preserved.
--
-- Verified live: an impersonated `authenticated` insert into tasks succeeded and
-- tenant_id was auto-filled from the column default.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'activity_log','api_keys','audit_log','campaigns','departments','employees',
    'event_attendees','events','expenses','files','folders','invoice_items','invoices',
    'milestones','notifications','payments','project_members','projects','quotation_items',
    'quotations','stores','task_comments','tasks'
  ] loop
    -- only touch tables that exist and have a tenant_id column
    if to_regclass('public.'||t) is not null and exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=t and column_name='tenant_id'
    ) then
      execute format('drop policy if exists %I_select_tenant on public.%I', t, t);
      execute format('drop policy if exists %I_insert_tenant on public.%I', t, t);
      execute format('drop policy if exists %I_update_tenant on public.%I', t, t);
      execute format('drop policy if exists %I_delete_tenant on public.%I', t, t);
      execute format('create policy %I_select_tenant on public.%I for select to authenticated using (tenant_id = current_tenant_id())', t, t);
      execute format('create policy %I_insert_tenant on public.%I for insert to authenticated with check (tenant_id = current_tenant_id())', t, t);
      execute format('create policy %I_update_tenant on public.%I for update to authenticated using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id())', t, t);
      execute format('create policy %I_delete_tenant on public.%I for delete to authenticated using (tenant_id = current_tenant_id())', t, t);
    end if;
  end loop;
end $$;
