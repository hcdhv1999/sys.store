# Project Status

Current phase: 5.5 — Smart Calendar (built; verifying against the live DB)
Last verified TypeScript: passing
Last verified build: passing (next build)
Last pushed commit on origin/main: 205ba49

## Completed
- Phase 5.4 — Tasks & Workflow
- Phase 5.4.1 — Production data cutover (Supabase = single source of truth, no seed fallback)
- Supabase production connection (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, with legacy ANON_KEY fallback)
- Phase 5.5 — Smart Calendar & Scheduler (week bar, month view, day panel, Today widget, filters, search)
- Earlier phases 5.1–5.3 per prior tracking

## Current blocker
Task creation fails with 42501 (new row violates RLS policy on "tasks").
tenant_id default was applied via migration 0012, but it still fails → the failing
condition is another conjunct in the tasks INSERT WITH CHECK (not yet inspected on the
live DB). Root cause must be proven from the live database before any further fix.

## Known differences (live DB vs repo) — always verify against the live DB
- Live DB uses current_tenant_id() (NOT the repo's auth_tenant_id()).
- Live DB has an rls_auto_enable() function; policies may be auto-generated, not from 0002.
- Migration 0006 columns were missing on live (added by 0011).

## Pending DB actions
Confirm migrations 0008–0012 are actually applied on the live project.

## Next task
Connect directly to the live DB and prove exactly which expression in the tasks INSERT
WITH CHECK evaluates FALSE (print the policy, check tenant_id/creator_id defaults, run an
impersonated insert). Then apply an additive, idempotent fix and verify a task persists
after refresh.
