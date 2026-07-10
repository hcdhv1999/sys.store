-- ═══════════════════════════════════════════════════════════════════════
-- API-role table privileges.
--
-- RLS enforces tenant isolation, but PostgreSQL checks *table-level privileges
-- before RLS is ever consulted*. Without a GRANT, PostgREST (which runs as
-- `authenticated`) fails with "permission denied for table …" before any
-- policy runs. This grants privileges once for every current and future object
-- in `public`.
--
-- Function grants are intentionally NAME-AGNOSTIC ("all functions") so this
-- never references a function that does not exist in a given project. It
-- therefore covers whatever tenant/RLS helper the live policies actually use
-- (e.g. current_tenant_id) plus rls_auto_enable / set_updated_at, without
-- assuming any specific name.
--
-- Safe to re-run: GRANT is idempotent. Additive only.
-- ═══════════════════════════════════════════════════════════════════════

grant usage on schema public to authenticated, anon;

-- Authenticated users operate the app; RLS still scopes every row to their tenant.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- RLS policies call SECURITY DEFINER helpers during evaluation, so the caller
-- role must be able to execute them. Granting on ALL functions covers the real
-- helpers in this project without naming any that might not exist.
grant execute on all functions in schema public to authenticated, anon;

-- Future tables/sequences/functions inherit the grants, so a new module never
-- reintroduces the "permission denied" class of bug.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated, anon;
