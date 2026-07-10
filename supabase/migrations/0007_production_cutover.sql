-- ═══════════════════════════════════════════════════════════════════════
-- Phase 5.4.1 — production data cutover.
-- 1) Session-bound defaults so client inserts never carry tenant ids.
-- 2) Private "attachments" storage bucket with tenant-scoped RLS.
-- Additive only; no history rewritten.
-- ═══════════════════════════════════════════════════════════════════════

-- Inserts from the browser rely on these defaults + RLS with-check; the
-- client never supplies tenant_id/creator ids itself.
alter table clients        alter column tenant_id set default auth_tenant_id();
alter table client_contacts alter column tenant_id set default auth_tenant_id();
alter table projects       alter column tenant_id set default auth_tenant_id();
alter table milestones     alter column tenant_id set default auth_tenant_id();
alter table tasks          alter column tenant_id set default auth_tenant_id();
alter table task_comments  alter column tenant_id set default auth_tenant_id();
alter table files          alter column tenant_id set default auth_tenant_id();
alter table invoices       alter column tenant_id set default auth_tenant_id();
alter table invoice_items  alter column tenant_id set default auth_tenant_id();
alter table expenses       alter column tenant_id set default auth_tenant_id();
alter table quotations     alter column tenant_id set default auth_tenant_id();
alter table quotation_items alter column tenant_id set default auth_tenant_id();
alter table campaigns      alter column tenant_id set default auth_tenant_id();
alter table stores         alter column tenant_id set default auth_tenant_id();
alter table catalog_items  alter column tenant_id set default auth_tenant_id();
alter table events         alter column tenant_id set default auth_tenant_id();
alter table notifications  alter column tenant_id set default auth_tenant_id();
alter table activity_log   alter column tenant_id set default auth_tenant_id();

alter table tasks         alter column creator_id set default auth.uid();
alter table task_comments alter column author_id  set default auth.uid();
alter table files         alter column owner_id   set default auth.uid();
alter table activity_log  alter column actor_id   set default auth.uid();

-- ── Task attachments bucket (private) ────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments', 'attachments', false,
  10485760, -- 10 MB, enforced server-side as well as in the client
  array[
    'application/pdf','image/png','image/jpeg','image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip','text/plain'
  ]
)
on conflict (id) do nothing;

-- Tenant isolation for storage objects: a member may touch an object only
-- when its path points at a task that belongs to their tenant
-- (paths are always tasks/<task_id>/<uuid>-<name>).
create or replace function attachment_task_tenant(object_name text)
returns uuid
language sql stable security definer set search_path = public as $$
  select t.tenant_id from tasks t
  where t.id::text = split_part(object_name, '/', 2)
$$;

drop policy if exists attachments_select on storage.objects;
drop policy if exists attachments_insert on storage.objects;
drop policy if exists attachments_delete on storage.objects;

create policy attachments_select on storage.objects for select
  using (bucket_id = 'attachments' and attachment_task_tenant(name) = auth_tenant_id());
create policy attachments_insert on storage.objects for insert
  with check (bucket_id = 'attachments' and attachment_task_tenant(name) = auth_tenant_id() and auth_role() <> 'viewer');
create policy attachments_delete on storage.objects for delete
  using (bucket_id = 'attachments' and attachment_task_tenant(name) = auth_tenant_id() and auth_role() <> 'viewer');
