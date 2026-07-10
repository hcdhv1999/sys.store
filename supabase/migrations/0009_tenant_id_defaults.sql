-- ═══════════════════════════════════════════════════════════════════════
-- Session-bound tenant_id defaults (correct function name).
--
-- The app never sends tenant_id in an insert — it relies on a column DEFAULT
-- bound to the caller's session, so a browser can never spoof another tenant.
-- Migration 0007 tried to set that default to auth_tenant_id(), which does not
-- exist in this project (the RLS helper here is current_tenant_id()), so 0007
-- failed and the default was never set. Result: inserts store tenant_id = NULL,
-- and `WITH CHECK (tenant_id = current_tenant_id())` evaluates NULL → the row
-- is rejected with "new row violates row-level security policy".
--
-- This sets the default to current_tenant_id() on every business table that
-- actually has a tenant_id column, so the omitted value is filled with the
-- caller's tenant and WITH CHECK passes. Defensive: only existing tables/
-- columns are touched, so it is safe against schema divergence. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'clients','client_contacts','projects','project_members','milestones',
    'tasks','task_comments','files','folders','invoices','invoice_items',
    'payments','expenses','quotations','quotation_items','campaigns','stores',
    'departments','employees','events','event_attendees','notifications',
    'activity_log','catalog_items','document_shares'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'tenant_id'
    ) then
      execute format(
        'alter table public.%I alter column tenant_id set default current_tenant_id()', t);
    end if;
  end loop;
end $$;
