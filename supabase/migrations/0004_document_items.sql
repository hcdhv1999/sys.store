-- ═══════════════════════════════════════════════════════════════════════
-- Phase 2 — professional sales documents.
-- Additive only: existing rows keep working (service defaults to the
-- description at render time; discount defaults to 0).
-- ═══════════════════════════════════════════════════════════════════════

alter table invoice_items
  add column if not exists service text,
  add column if not exists discount_pct numeric(5,2) not null default 0
    check (discount_pct >= 0 and discount_pct <= 100);

alter table quotation_items
  add column if not exists service text,
  add column if not exists discount_pct numeric(5,2) not null default 0
    check (discount_pct >= 0 and discount_pct <= 100);

alter table invoices
  add column if not exists notes text,
  add column if not exists terms text;

alter table quotations
  add column if not exists notes text,
  add column if not exists terms text;

-- Share tokens for Phase 3 (public link / WhatsApp / email / e-signature).
-- Created now so the sharing architecture has a stable target; unused rows
-- cost nothing.
create table if not exists document_shares (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants (id) on delete cascade,
  doc_kind    text not null check (doc_kind in ('quotation','invoice')),
  doc_id      uuid not null,
  token       text not null unique,
  channel     text not null check (channel in ('whatsapp','email','publicLink','eSignature')),
  expires_at  timestamptz,
  signed_at   timestamptz,
  signer_name text,
  created_at  timestamptz not null default now()
);
create index if not exists document_shares_tenant_idx on document_shares (tenant_id);
create index if not exists document_shares_doc_idx on document_shares (doc_kind, doc_id);

alter table document_shares enable row level security;
create policy document_shares_tenant_select on document_shares for select
  using (tenant_id = auth_tenant_id());
create policy document_shares_tenant_insert on document_shares for insert
  with check (tenant_id = auth_tenant_id() and auth_role() <> 'viewer');
create policy document_shares_tenant_delete on document_shares for delete
  using (tenant_id = auth_tenant_id() and auth_role() in ('owner','admin','manager'));
