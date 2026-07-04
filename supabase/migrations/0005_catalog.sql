-- ═══════════════════════════════════════════════════════════════════════
-- Phase 3 / P1 — Products & Services catalog + freelance company identity.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists catalog_items (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants (id) on delete cascade,
  kind           text not null check (kind in ('product','service')),
  name           text not null,
  category       text,
  sku            text,
  unit           text,
  price          numeric(12,2) not null default 0,
  cost           numeric(12,2) not null default 0,
  vat_applicable boolean not null default true,
  active         boolean not null default true,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists catalog_items_tenant_idx on catalog_items (tenant_id);
create index if not exists catalog_items_kind_idx on catalog_items (tenant_id, kind);
create trigger catalog_items_touch before update on catalog_items
  for each row execute function set_updated_at();

alter table catalog_items enable row level security;
create policy catalog_tenant_select on catalog_items for select using (tenant_id = auth_tenant_id());
create policy catalog_tenant_insert on catalog_items for insert with check (tenant_id = auth_tenant_id() and auth_role() <> 'viewer');
create policy catalog_tenant_update on catalog_items for update using (tenant_id = auth_tenant_id() and auth_role() <> 'viewer') with check (tenant_id = auth_tenant_id());
create policy catalog_tenant_delete on catalog_items for delete using (tenant_id = auth_tenant_id() and auth_role() in ('owner','admin','manager'));

-- Freelance business identity: CR/VAT already nullable; add license + contact.
alter table tenants
  add column if not exists legal_status text not null default 'freelance' check (legal_status in ('freelance','company')),
  add column if not exists freelance_license text,
  add column if not exists mobile text,
  add column if not exists email text;
