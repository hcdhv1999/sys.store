-- ═══════════════════════════════════════════════════════════════════════
-- Phase 5.4 — Tasks & Workflow.
-- Additive: existing task rows keep working (new columns are nullable,
-- the enum only gains a value).
-- ═══════════════════════════════════════════════════════════════════════

-- New terminal status kept off the default board.
alter type task_status add value if not exists 'cancelled';

alter table tasks
  add column if not exists client_id  uuid references clients (id) on delete set null,
  add column if not exists creator_id uuid references profiles (id) on delete set null,
  add column if not exists start_date date,
  add column if not exists notes      text;

create index if not exists tasks_client_idx on tasks (client_id);

-- Attachments: link files to a task (metadata only; binaries live in the
-- Storage `files` bucket wired in a later phase). Nullable, no behaviour
-- change to existing file rows.
alter table files
  add column if not exists task_id uuid references tasks (id) on delete set null;
create index if not exists files_task_idx on files (task_id);
