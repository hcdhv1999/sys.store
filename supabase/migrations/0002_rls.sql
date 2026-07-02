-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security — complete tenant isolation.
-- A user can only ever see rows whose tenant_id matches their profile.
-- ═══════════════════════════════════════════════════════════════════════

-- Helper: the calling user's tenant. SECURITY DEFINER avoids recursive RLS
-- on profiles; STABLE lets the planner cache it per statement.
create or replace function auth_tenant_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from profiles where id = auth.uid()
$$;

create or replace function auth_role()
returns member_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- profiles: users read teammates, edit only themselves; admins manage all.
alter table profiles enable row level security;
create policy profiles_select on profiles for select
  using (tenant_id = auth_tenant_id());
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and tenant_id = auth_tenant_id());
create policy profiles_admin_all on profiles for all
  using (tenant_id = auth_tenant_id() and auth_role() in ('owner','admin'))
  with check (tenant_id = auth_tenant_id());

-- tenants: members read their tenant; only owner/admin update it.
alter table tenants enable row level security;
create policy tenants_select on tenants for select
  using (id = auth_tenant_id());
create policy tenants_update on tenants for update
  using (id = auth_tenant_id() and auth_role() in ('owner','admin'))
  with check (id = auth_tenant_id());

-- Standard tenant-scoped policies for every business table.
do $$
declare t text;
begin
  foreach t in array array[
    'departments','employees','clients','client_contacts','projects',
    'project_members','milestones','tasks','task_comments','invoices',
    'invoice_items','payments','expenses','quotations','quotation_items',
    'campaigns','stores','folders','files','events','event_attendees',
    'notifications','activity_log'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_tenant_select on %I for select using (tenant_id = auth_tenant_id())', t, t);
    execute format(
      'create policy %I_tenant_insert on %I for insert with check (tenant_id = auth_tenant_id() and auth_role() <> ''viewer'')', t, t);
    execute format(
      'create policy %I_tenant_update on %I for update using (tenant_id = auth_tenant_id() and auth_role() <> ''viewer'') with check (tenant_id = auth_tenant_id())', t, t);
    execute format(
      'create policy %I_tenant_delete on %I for delete using (tenant_id = auth_tenant_id() and auth_role() in (''owner'',''admin'',''manager''))', t, t);
  end loop;
end $$;

-- Sensitive tables: reads for admins/owners only.
alter table audit_log enable row level security;
create policy audit_select on audit_log for select
  using (tenant_id = auth_tenant_id() and auth_role() in ('owner','admin'));
create policy audit_insert on audit_log for insert
  with check (tenant_id = auth_tenant_id());

alter table api_keys enable row level security;
create policy api_keys_all on api_keys for all
  using (tenant_id = auth_tenant_id() and auth_role() in ('owner','admin'))
  with check (tenant_id = auth_tenant_id());

-- Finance guard: only finance-capable roles may write invoices/expenses.
create policy invoices_finance_guard on invoices as restrictive for insert
  with check (auth_role() in ('owner','admin','manager','accountant'));
create policy expenses_finance_guard on expenses as restrictive for insert
  with check (auth_role() in ('owner','admin','manager','accountant'));
