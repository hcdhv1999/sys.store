# Project Status

Current phase: 5.5 complete — smoke test PASSED on the live DB. Ready for Phase 5.6 (pending approval).
Last verified TypeScript: passing
Last verified build: passing (next build)
Last live smoke test: PASSED (client/project/task create+update+delete, calendar event, persistence)

## Completed
- Phase 5.4 — Tasks & Workflow
- Phase 5.4.1 — Production data cutover (Supabase = single source of truth, no seed fallback)
- Supabase production connection (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, with legacy ANON_KEY fallback)
- Phase 5.5 — Smart Calendar & Scheduler (week bar, month view, day panel, Today widget, filters, search)
- Earlier phases 5.1–5.3 per prior tracking

## Current blocker
None. Full CRUD smoke test passed on the live DB.

Two root causes were found and fixed on the live project:
- 0013: RLS was enabled on 23 business tables but they had ZERO policies (deny-all),
  so every insert except clients failed with 42501. Created tenant-scoped policies
  (authenticated, tenant_id = current_tenant_id()) on all tenant tables.
- 0014: only 5 tables had tenant_id DEFAULT current_tenant_id(); the rest were NULL
  (the broad 0009 was never applied on live), so project/invoice/etc. inserts stored
  NULL and failed the policy. Set the default on all business tables (except profiles).

Verified live (as the authenticated user, real RLS): create Client → Project → Task,
update Task, delete Task, create Calendar Event — all succeeded and persisted across a
fresh session; test data cleaned; postgres logs show no errors post-fix.

## Known differences (live DB vs repo) — always verify against the live DB
- Live DB uses current_tenant_id() (NOT the repo's auth_tenant_id()).
- Live DB has an rls_auto_enable() function; policies may be auto-generated, not from 0002.
- Migration 0006 columns were missing on live (added by 0011).

## Pending DB actions
None blocking. 0013 + 0014 applied and verified live. (0008–0012 effectively superseded
by 0013/0014 for the tables in use.)

## Next task
Awaiting approval for the next implementation batch (recommend Phase 5.10 Notifications
or hardening first — see health report). Do not implement until approved.

## Optional hardening (from Supabase security advisor, non-blocking)
- Set an explicit search_path on public.set_updated_at.
- Review EXECUTE on SECURITY DEFINER functions current_tenant_id() / rls_auto_enable().
- Enable leaked-password protection in Auth.
