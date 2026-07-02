# HIRF — Supabase backend

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in order (SQL editor or `supabase db push`):
   - `migrations/0001_schema.sql` — tables, enums, indexes, triggers
   - `migrations/0002_rls.sql` — Row Level Security (full tenant isolation)
   - `migrations/0003_seed.sql` — optional demo workspace data
3. In **Authentication → Providers** enable Email with confirmation
   ("Confirm email") and set the Site URL to your deployment
   (`NEXT_PUBLIC_SITE_URL`), plus `/reset-password` as a redirect URL.
4. Copy the project URL and anon key into `.env.local`
   (see `.env.example` at the repo root).
5. Create a `files` Storage bucket (private) for the file manager.

## Multi-tenancy

Every business table carries `tenant_id`. The `auth_tenant_id()` helper reads
the caller's tenant from `profiles`, and every policy filters on it, so no
tenant can read or write another tenant's rows — even with a leaked anon key.

Role gates on top of isolation:

| Action | Roles |
| --- | --- |
| Read workspace data | all members |
| Create/update records | everyone except `viewer` |
| Delete records | `owner`, `admin`, `manager` |
| Invoices/expenses insert | `owner`, `admin`, `manager`, `accountant` |
| Audit log & API keys | `owner`, `admin` |

## Onboarding a user

1. Invite the user via Supabase Auth (or self sign-up).
2. Insert a row in `profiles` with their `auth.users.id`, the tenant id and role.
3. Optionally link them to an `employees` row via `profile_id`.

The Next.js app runs in demo mode (bundled seed data) until
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
