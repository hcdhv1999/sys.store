# Hirf Workspace — Full Handoff Brief (A–Z)

> Give this file to Claude Code inside VS Code as the first message
> (e.g. "Read HANDOFF.md and CLAUDE.md, then start Phase 1 inspection").
> It is self-contained — it does not depend on any chat history.

You are the **Technical Lead** for **Hirf Workspace (نظام حِرف)**, an Arabic-first,
multi-tenant ERP/CRM. Read this, then follow `CLAUDE.md`. Do **not** change / commit /
push / migrate until the human approves after the inspection phase.

---

## 1. What the system is
- **Stack:** Next.js 15 (App Router, Edge runtime) · React 19 · TypeScript · Tailwind v4 ·
  Supabase (PostgreSQL + RLS, multi-tenant) · Cloudflare Pages (`npx @cloudflare/next-on-pages@1`).
- Arabic-first **RTL** + English **LTR** + **dark mode**.
- **Repo:** `hcdhv1999/sys.store`, branch `main`, latest commit `dfd2194`.
- **Two data modes** (`src/lib/data-mode.ts`):
  - **PRODUCTION** (default): Supabase is the single source of truth. No seed/mock/in-memory fallback.
  - **DEMO** (dev only): `NEXT_PUBLIC_DATA_MODE=demo`, in-memory copy of the seed.
  - Missing/broken config → a clear `DataConfigError`, never a silent fallback.

## 2. Architecture (key files)
- `src/services/repository.ts` — the data layer: every `list*` / `create*` / `update*`. In demo it
  uses an in-memory seed store; in production it calls Supabase. **Inserts never send `tenant_id` /
  `creator_id`** — they rely on DB column **defaults** bound to the session (secure multi-tenant pattern).
- `src/services/auth.ts` — Supabase email/password auth + session cookie.
- `src/lib/supabase/` — `client.ts`, `server.ts`, `env.ts`. `env.ts` resolves the public key:
  reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` first, falls back to legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `src/lib/data-mode.ts` — `getDataMode()`, `isDemoMode()`, `DataConfigError`.
- `src/hooks/use-data.ts` — TanStack Query read hooks (`useClients`, `useProjects`, `useTasks`,
  `useEvents`, …). `src/hooks/use-mutations.ts` — optimistic write hooks (rollback + invalidation).
- `src/lib/data/` — `seed.ts` (demo dataset) + `queries.ts` (pure derivations). **DEMO ONLY.**
- `src/lib/i18n/` — `en.ts` + `ar.ts` message maps.
- `src/components/ui/` — design system (Card, Button, DataTable, Dialog, badges, `DataError`, …).
- **App routes** (`src/app/(app)/`): calendar, catalog, clients, dashboard, files, finance,
  marketing, notifications, projects, quotations, reports, settings, stores, tasks, team.
- **Calendar (Phase 5.5):** `src/lib/calendar/event-types.ts` (8 types + smart colors),
  `src/features/calendar/use-calendar-items.ts` (merges real events + task due-dates, **no duplicate
  rows**), `src/features/dashboard/today-widget.tsx`, `src/app/(app)/calendar/page.tsx`.
- **Docs at root:** `CLAUDE.md`, `LOCAL_DEV.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`,
  `PRODUCTION_DATA_SETUP.md`, this `HANDOFF.md`.

## 3. Database migrations (`supabase/migrations/`)
| File | Purpose |
| --- | --- |
| `0001_schema.sql` | Core multi-tenant schema (tenants, profiles, clients, projects, tasks, invoices, quotations, campaigns, stores, files, events, …). Every business table has `tenant_id`. Enums incl. `task_status`, `priority_level`. |
| `0002_rls.sql` | RLS + the repo's helpers `auth_tenant_id()` / `auth_role()` + per-table policies. |
| `0003_seed.sql` | Demo dataset (do NOT run on a real tenant). |
| `0004_document_items.sql` | Quotation/invoice line items + `document_shares`. |
| `0005_catalog.sql` | Products & services catalog. |
| `0006_tasks_workflow.sql` | `tasks.client_id/creator_id/start_date/notes`, `task_comments`, `files.task_id`, `'cancelled'` task_status. |
| `0007_production_cutover.sql` | Session-bound defaults + private `attachments` storage bucket + storage RLS. |
| `0008_api_grants.sql` | GRANT privileges to the `authenticated` role (so RLS is reachable). |
| `0009_tenant_id_defaults.sql` | `tenant_id DEFAULT current_tenant_id()` on business tables. |
| `0010_calendar_events.sql` | Additive columns on `events` (category, project_id, assignee_id, priority, status, reminder, notes) + `events.tenant_id` default. Guarded/idempotent. |
| `0011_tasks_reconcile.sql` | Guarded add of `tasks.client_id/creator_id/start_date/notes` + `files.task_id` + `'cancelled'` enum + `NOTIFY pgrst`. Fixes PGRST204. |
| `0012_tasks_tenant_default.sql` | `tenant_id` default (`current_tenant_id`) + creator/author/owner defaults (`auth.uid`) on tasks/task_comments/files. Guarded/idempotent. |

## 4. ⚠️ CRITICAL: the LIVE DB diverges from the repo
The live Supabase project was built differently from these migrations:
- The live RLS helper is **`current_tenant_id()`** — NOT the repo's `auth_tenant_id()`.
- The live DB has a function **`rls_auto_enable()`** — policies may be auto-generated, not from `0002`.
- Migration **`0006` was never applied on live** (its columns were missing → `0011` reconciles them).

**Therefore: always verify against the live DB.** Migrations `0008–0012` were written to be
**guarded / idempotent / production-safe** for this reason. It is **UNKNOWN which of `0008–0012`
are actually applied on live** — the inspection phase must determine this.

## 5. History of fixes already made
- Connected the app to Supabase via the publishable key (`env.ts`).
- **Client creation:** removed the `client_contacts` embed from the insert `RETURNING`; surface the real error.
- Fixed **clients 42501** by giving `clients.tenant_id` a `current_tenant_id()` default (`0009`).
- Fixed **task PGRST204 "client_id not found"** by adding the missing `0006` columns (`0011`).
- Added `tasks.tenant_id` default (`0012`) to try to fix the tasks 42501 — **still failing (see §6).**

## 6. CURRENT BLOCKER — start here
Creating a **task** still fails with: `42501 new row violates row-level security policy for "tasks"`.
`createTask()` sends: `title, status, priority, project_id, client_id, assignee_id, start_date,
due_date, labels, notes` — it does **NOT** send `tenant_id` (relies on the DB default).
`0012` set the `tenant_id` default, yet it still fails → the FALSE condition is a **different conjunct**
in the tasks INSERT `WITH CHECK`. **The root cause has NOT been proven on the live DB yet.**

## 7. YOUR TASK — PHASE 1: INSPECTION ONLY (then stop)
Do not change/commit/push/migrate. Produce ONE report, then wait for approval:
1. **Git:** `git status`, `git remote -v`, `git log --oneline main..origin/main` and `origin/main..main`.
   Explain any divergence (local may be "ahead"). Do NOT pull/push.
2. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Confirm Supabase connection (supabase CLI linked, or psql).
4. Run `npm install`, `npx tsc --noEmit`, `npm run build` — report results.
5. Compare repo migrations vs the LIVE DB: which of `0001–0012` are applied, which missing, any
   manually-created objects (`current_tenant_id`, `rls_auto_enable`), and the exact `tasks` schema.
6. For the tasks 42501 — gather read-only proof (prove, don't guess):
   ```sql
   -- (a) the real INSERT policy on tasks
   select polname, polpermissive,
     (select array_agg(rolname) from pg_roles where oid=any(polroles)) roles,
     pg_get_expr(polwithcheck,polrelid) with_check
   from pg_policy where polrelid='public.tasks'::regclass;

   -- (b) tasks column defaults
   select column_name, column_default, is_nullable
   from information_schema.columns
   where table_schema='public' and table_name='tasks'
     and column_name in ('tenant_id','creator_id');

   -- (c) impersonated reproduction (rolls back, writes nothing)
   begin;
   select set_config('request.jwt.claims',
     json_build_object('sub','<AUTH_UID>','role','authenticated')::text, true);
   set local role authenticated;
   select auth.uid(), current_tenant_id();
   insert into public.tasks(title,status,priority) values('probe','todo','medium');
   rollback;
   ```
   Then state **exactly which sub-expression in `with_check` evaluates FALSE and why.**

## 8. PHASE 2 (only after the report is approved)
Apply the **smallest correct fix** for the proven root cause as a guarded, additive, idempotent
migration **with a short report** of why. Then `npx tsc --noEmit`, `npm run build`, regression,
verify a task persists after refresh + re-login. **Commit only. Do NOT push until approved.**

## 9. Rules (also in CLAUDE.md)
- Never `git push`/merge to `main` without approval. Never create a migration until the cause is
  proven from the live DB. Every migration additive + idempotent + a report.
- Before changing any DB object, inspect it and explain why. Never modify on assumptions.
- Production = Supabase single source of truth; no seed/mock in production.
- Never put a service-role key in a `NEXT_PUBLIC_*` variable.
- After each phase: TypeScript → Build → Regression → update `PROJECT_STATUS.md` + `CHANGELOG.md` → commit.
