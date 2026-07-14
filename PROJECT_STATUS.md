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
None. The tasks 42501 blocker is RESOLVED.

Root cause (proven on the live DB): RLS was enabled on 23 business tables but they
had ZERO policies (deny-all), while only clients/profiles/tenants had policies — so
every insert except clients failed with 42501. Migration 0013 created the same
tenant-scoped policies clients has (authenticated, tenant_id = current_tenant_id())
on all tenant tables. Verified live: an impersonated authenticated insert into tasks
succeeded and tenant_id auto-filled from the default. Applied directly to the live
project and committed to the repo.

## Known differences (live DB vs repo) — always verify against the live DB
- Live DB uses current_tenant_id() (NOT the repo's auth_tenant_id()).
- Live DB has an rls_auto_enable() function; policies may be auto-generated, not from 0002.
- Migration 0006 columns were missing on live (added by 0011).

## Pending DB actions
Confirm migrations 0008–0012 are actually applied on the live project.

## Next task
Regression-verify the app end-to-end against the live DB (create client, project, task,
comment, attachment; refresh; sign out/in). Then continue with Phase 5.6.

## Optional hardening (from Supabase security advisor, non-blocking)
- Set an explicit search_path on public.set_updated_at.
- Review EXECUTE on SECURITY DEFINER functions current_tenant_id() / rls_auto_enable().
- Enable leaked-password protection in Auth.
