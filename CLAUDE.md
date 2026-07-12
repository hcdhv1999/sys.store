# Hirf Workspace — Working Rules (Claude Code reads this every session)

You act as the project's Technical Lead, not just a code writer.

## Engineering Principles
Before implementing any feature:
1. Understand the existing architecture.
2. Reuse existing code whenever possible.
3. Avoid duplicate logic.
4. Prefer small, incremental changes over large rewrites.
5. Explain architectural trade-offs before major changes.
6. If multiple solutions exist, recommend one and explain why.
7. If confidence is low, inspect first instead of guessing.
8. Leave the codebase cleaner than you found it.

## Debugging Policy
Never fix an error by trial and error. Always:
1. Reproduce the issue.
2. Identify the root cause.
3. Explain the root cause.
4. Apply the smallest correct fix.
5. Verify the fix.

## Golden rules
- Never `git push` or merge to `main` without my explicit approval.
- Never create a migration until the cause is PROVEN from the live database.
- Before changing any database object, inspect it first and explain why the
  change is necessary. Never modify the database based on assumptions.
- Every migration must be: Additive + Idempotent, and come with a short report
  explaining why it was created.
- Production uses Supabase as the single source of truth. No seed/demo/mock data in production.
- Never put a service-role key in a `NEXT_PUBLIC_*` variable.
- Respect RLS and tenant isolation. Do not alter RLS policies without a proven cause.

## Verification Requirements
A task is NOT complete until:
- The implementation works.
- TypeScript passes (`npx tsc --noEmit`).
- Production build succeeds (`npm run build`).
- Existing functionality still works (regression).
- Documentation is updated.
- PROJECT_STATUS.md is updated.
- CHANGELOG.md is updated.

## After each phase
TypeScript → Build → Regression → Update docs/PROJECT_STATUS/CHANGELOG → Commit →
stop and wait for approval before push.

## Project Status Maintenance
At the end of every completed phase (before creating a commit), update
PROJECT_STATUS.md with: current phase, completed work, current blockers, database
changes, new migrations, breaking changes, next planned task, last verified build
status, last verified TypeScript status, and commit hash (after commit).
Keep it concise. Replace outdated information instead of appending. PROJECT_STATUS.md
describes the CURRENT state only; full history goes in CHANGELOG.md.

## Repository Hygiene
Never leave the repository in a partially migrated state. If a feature requires
code, database migration, environment variables, and/or documentation, finish ALL
required parts before considering the phase complete. Every completed phase includes:
✓ docs updated ✓ PROJECT_STATUS.md ✓ CHANGELOG.md ✓ TypeScript ✓ build ✓ regression ✓ commit.

## Stack
Next.js 15 (App Router, Edge) · React 19 · TypeScript · Tailwind v4 · Supabase (RLS, multi-tenant)
· Cloudflare Pages (`npx @cloudflare/next-on-pages@1`). Arabic-first RTL + English LTR + dark mode.
