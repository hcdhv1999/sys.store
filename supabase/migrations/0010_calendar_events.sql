-- ═══════════════════════════════════════════════════════════════════════
-- Phase 5.5 — Smart Calendar. Additive-only enrichment of the existing
-- `events` table (no new event table, no data loss). RLS and the tenant_id
-- default already apply from 0002/0009. `if not exists` makes this idempotent.
-- ═══════════════════════════════════════════════════════════════════════

alter table events add column if not exists category    text;                                        -- CalendarType (store/design/…)
alter table events add column if not exists project_id  uuid references projects (id)  on delete set null;
alter table events add column if not exists assignee_id uuid references employees (id) on delete set null;
alter table events add column if not exists priority    priority_level;
alter table events add column if not exists status      text not null default 'scheduled';
alter table events add column if not exists reminder    text;                                        -- lead time: onTime/min30/hour1/hour2/day1
alter table events add column if not exists notes       text;

create index if not exists events_project_idx  on events (project_id);
create index if not exists events_assignee_idx on events (assignee_id);
