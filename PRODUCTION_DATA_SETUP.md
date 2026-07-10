# Production Data Setup — HIRF AI Workspace

This workspace runs in one of **two explicit data modes**. There is no third
"automatic" behaviour: production never silently falls back to demo/seed data
because Supabase is missing or a query failed. Instead it surfaces a clear
configuration or data error.

| Mode | How it's selected | Data source |
| --- | --- | --- |
| **Production** (default) | anything other than the demo flag | Supabase (single source of truth) |
| **Demo** (development only) | `NEXT_PUBLIC_DATA_MODE=demo` | in-memory copy of the bundled seed |

If production mode runs without a valid Supabase configuration, the UI shows
**"Database not configured"** (a `DataConfigError`), and mutations fail loudly —
they are never presented as success.

---

## 1. Environment variables

Set these on your host (Cloudflare Pages → **Settings → Environment variables**,
for both **Production** and **Preview**).

| Variable | Required | Exposure | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ yes | browser | Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ yes | browser | Supabase **anon** public key (RLS-protected) |
| `NEXT_PUBLIC_DATA_MODE` | ❌ no | browser | Set to `demo` **only** for a local/dev demo. Leave unset in production. |

> **Never** put the Supabase **service-role** key in any `NEXT_PUBLIC_*`
> variable or anywhere the browser can read it. This app talks to Supabase
> exclusively through the anon key + Row Level Security. The service-role key is
> not used by the app at all.

`.env.local` example for a developer running against a real project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # anon key, not service_role
# NEXT_PUBLIC_DATA_MODE=demo                    # uncomment for the offline demo
```

### Failure handling (what the user sees)

| Situation | Behaviour |
| --- | --- |
| Env vars missing | `DataError` → "Database not configured" with the exact vars to set |
| Invalid URL / key | Supabase request fails → `DataError` → "Couldn't load data" + message |
| Expired session | Middleware redirects to `/login`; queries return an auth error until re-login |
| Query fails | `DataError` on the affected page; no seed shown |
| Storage upload fails | Optimistic row is rolled back and an error toast is shown |

---

## 2. Database migrations

Apply the SQL migrations in order (Supabase CLI, or paste into the SQL editor):

```bash
supabase db push          # applies supabase/migrations/0001 … 0007 in order
```

| Migration | Contents |
| --- | --- |
| `0001_schema.sql` | Tables, enums, FKs, indexes for every module (multi-tenant, `tenant_id` on all business tables) |
| `0002_rls.sql` | `auth_tenant_id()` / `auth_role()` helpers + RLS policies (tenant isolation, viewer write-guard) |
| `0003_seed.sql` | Optional demo dataset for a throwaway project (do **not** run on a clean production tenant) |
| `0004_document_items.sql` | Quotation/invoice line items |
| `0005_catalog.sql` | Products & services catalog |
| `0006_tasks_workflow.sql` | Task workflow columns (`cancelled` status, `client_id`, `creator_id`, `start_date`, `notes`), `task_comments` |
| `0007_production_cutover.sql` | Session-bound column defaults (`tenant_id` → `auth_tenant_id()`, creator ids → `auth.uid()`) + private `attachments` storage bucket with tenant-scoped RLS |

> On a real production tenant, **skip `0003_seed.sql`** — start empty and create
> your first client/project/task through the UI.

---

## 3. Storage — task attachments

Migration `0007` creates a **private** bucket named `attachments`:

- **Private** (not public); files are served through short-lived signed URLs.
- **10 MB** server-side size limit (also validated client-side).
- **MIME allowlist**: PDF, PNG/JPEG/WebP, Word, Excel, ZIP, plain text.
- Object path convention: `tasks/<task_id>/<uuid>-<safe-filename>`.
- **RLS on `storage.objects`**: a member may read/upload/delete an object only
  when the task in its path belongs to their tenant (`attachment_task_tenant()`),
  and uploads/deletes additionally require a non-`viewer` role.

No further dashboard configuration is needed — the bucket and its policies are
created by the migration.

---

## 4. Auth & tenant context

1. A user signs in at `/login` (Supabase Auth, email + password).
2. Middleware refreshes the session cookie on every request and redirects
   unauthenticated users to `/login`.
3. Each user has a row in `profiles` carrying their `tenant_id` and `role`.
4. `auth_tenant_id()` reads that tenant from `profiles` for the current
   `auth.uid()`; `auth_role()` reads the role.
5. Every query and mutation is filtered by RLS to the caller's tenant — the
   client code never sends a `tenant_id`; the column default + RLS with-check
   supply and enforce it.

Provision the first user via the Supabase dashboard (Authentication → Users),
then insert their `profiles` row with the desired `tenant_id`/`role`.

---

## 5. Cloudflare Pages build

- Build command: `npx @cloudflare/next-on-pages@1`
- Output directory: `.vercel/output/static`
- Compatibility flags: `nodejs_compat`
- The client/project detail routes (`/clients/[id]`, `/projects/[id]`) run on
  the **Edge runtime** because they resolve arbitrary Supabase UUIDs at request
  time; everything else is statically prerendered. Current output: **1
  middleware + 2 edge routes**, the rest prerendered.

---

## 6. Verifying real persistence

After configuring the env vars and applying the migrations, sign in and:

1. Create a client → refresh → it is still there.
2. Create a project for that client → refresh → still there.
3. Create two tasks, move one across the Kanban board, add a comment, log time,
   and upload an attachment.
4. Sign out and back in, then navigate Clients → the client → its project → a
   task. Everything you created is present.

If any of the above disappears on refresh, you are almost certainly still in
demo mode (`NEXT_PUBLIC_DATA_MODE=demo`) or pointing at a project without the
migrations applied — check the two env vars and re-run `supabase db push`.
