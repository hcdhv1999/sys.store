-- ═══════════════════════════════════════════════════════════════════════
-- Phase 5.4.1 fix — API-role table privileges.
--
-- RLS (0002) enforces tenant isolation, but PostgreSQL checks *table-level
-- privileges before RLS is ever consulted*. The earlier migrations enable RLS
-- and create policies but never GRANT any privileges to the API roles, so
-- PostgREST (which runs as `authenticated`) fails with
-- "permission denied for table …" before a single policy runs. This grants
-- the privileges once, for every current and future object in `public`.
--
-- Safety: every business table in `public` has RLS enabled (0002/0004/0005),
-- so GRANT here only lets the role *attempt* an operation — the policies still
-- restrict it to the caller's own tenant. Additive only; no history rewritten.
-- ═══════════════════════════════════════════════════════════════════════

grant usage on schema public to authenticated, anon;

-- Authenticated users operate the app; RLS scopes every row to their tenant.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Policies call these SECURITY DEFINER helpers during evaluation; the caller
-- role must be allowed to execute them.
grant execute on function auth_tenant_id() to authenticated, anon;
grant execute on function auth_role() to authenticated, anon;

-- Future tables/sequences/functions created in this schema inherit the grants,
-- so a new module never reintroduces the "permission denied" class of bug.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
