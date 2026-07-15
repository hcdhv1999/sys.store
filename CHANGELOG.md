# Changelog

All notable changes per phase. Newest on top. Migrations are additive & idempotent.

## Fix — tenant_id defaults on all business tables (0014)
- Smoke test (real DB, as authenticated user) caught: creating a Project failed with 42501.
- Proven cause: only 5 tables had tenant_id DEFAULT current_tenant_id(); the rest were NULL
  (broad 0009 never applied on live), so the app's project insert stored NULL and failed the
  RLS check. 0014 sets the default on every business table with tenant_id (except profiles).
- Applied and verified live: full CRUD smoke test (client/project/task create+update+delete +
  calendar event) all pass and persist; logs clean.

## Fix — Tenant RLS policies (resolves the 42501 blocker)
- Proven root cause via direct live-DB inspection: 23 business tables had RLS enabled
  but ZERO policies (deny-all); only clients/profiles/tenants had policies — so every
  insert except clients failed with 42501.
- Migration 0013: created tenant-scoped policies (authenticated, tenant_id =
  current_tenant_id()) on all tenant tables, mirroring the working clients policies.
  Applied to the live project and verified (impersonated authenticated insert into
  tasks succeeded; tenant_id auto-filled).

## Phase 5.5 — Smart Calendar & Scheduler
- Connected the calendar to real Supabase data (repository listEvents/createEvent/updateEvent + hooks).
- Week bar, month view (type colors + "+N" overflow), day panel, filters, search, drag-to-reschedule.
- Event-type + smart-color system; unified feed merging events + task due-dates (no duplicate rows).
- Dashboard "Today" widget (schedule / upcoming / late / completed / next meeting / next delivery).
- Calendar decoupled from seed; uses the real clock instead of a hardcoded date.
- Migration 0010: additive enrichment of `events` (category, project_id, assignee_id, priority,
  status, reminder, notes) + events.tenant_id default via current_tenant_id().

## Supabase production connection + data fixes
- env resolver reads NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (falls back to legacy ANON_KEY).
- createClient no longer embeds client_contacts in the insert's RETURNING; surfaces the real error.
- Migration 0008: GRANT privileges to the `authenticated` role (so RLS is reachable).
- Migration 0009: set tenant_id default = current_tenant_id() on business tables (fixes clients 42501).
- Migration 0011: reconcile tasks/files with app columns (client_id/creator_id/start_date/notes,
  files.task_id, 'cancelled' status) — fixes PGRST204.
- Migration 0012: tenant_id/creator defaults on tasks/task_comments/files.

## Phase 5.4.1 — Production data cutover
- Two explicit data modes (production/demo); no silent seed fallback; DataError surface.
- Repository fully Supabase-backed CRUD for clients/projects/tasks/comments/attachments.
- Migration 0007: session-bound defaults + private attachments storage bucket with tenant RLS.

## Phase 5.4 — Tasks & Workflow
- Kanban DnD, list, calendar views; comments; time tracking; cancel/delete.
- Migration 0006: task workflow columns + task_comments + files.task_id.

## Earlier
- Phases 1–5.3 per prior tracking (auth, schema/RLS 0001–0005, dashboard, CRM, projects, finance,
  marketing, stores, quotations, catalog, Cloudflare Edge cutover).
