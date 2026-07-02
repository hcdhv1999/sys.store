# حِرف — HIRF Platform

Production-ready **ERP + CRM SaaS platform** for digital agencies in Saudi Arabia
and the GCC. Arabic-first (RTL) with full English (LTR) support, light & dark
mode, and a premium design system.

## Modules

| | |
| --- | --- |
| 📊 Dashboard | KPIs, revenue vs. expenses, service mix, deadlines, activity |
| 🤝 CRM / Clients | CR & VAT records, contacts, tags, timelines, rollups |
| 📁 Projects | Milestones, budgets, hours, teams, progress |
| ✅ Tasks | Drag-and-drop kanban, list & calendar views, labels |
| 📅 Calendar | Meetings/deadlines/launches, drag to reschedule, agenda |
| 👥 Team | Departments, roles, attendance, utilization, productivity |
| 🧾 Quotations | Line items, approvals, convert to project/invoice |
| 💰 Finance | Invoices (15% VAT), expenses, recurring, cash flow |
| 📣 Marketing | Meta/Google/TikTok/Snapchat/LinkedIn — ROAS, CPA, CTR, CPC, CPM |
| 🛍️ Stores | Salla, Zid, Shopify, WooCommerce operations |
| 🗂️ Files | Folders, versions, storage quota |
| 🔔 Notifications | In-app center + topbar menu |
| 📈 Reports | Financial/clients/team/marketing, Excel + PDF export |
| ⚙️ Settings | Company, branding, users & roles, API keys, security, audit |

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
TanStack Query + Table · React Hook Form + Zod · dnd-kit · Recharts ·
Supabase (PostgreSQL, Auth, RLS, Storage)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

The app boots in **demo mode** with a fully seeded Arabic workspace
(sign in with the pre-filled demo credentials on the login screen).

### Connecting Supabase

1. Follow [`supabase/README.md`](supabase/README.md) to create the project,
   run the migrations (schema → RLS → seed) and configure auth.
2. `cp .env.example .env.local` and fill in the keys.
3. Restart — auth and data now run against PostgreSQL with full
   multi-tenant Row Level Security.

## Deploying to Hostinger (Node.js hosting)

1. Push this repository to GitHub and connect it in hPanel, or upload the
   build output directly.
2. Build:
   ```bash
   npm ci
   npm run build
   ```
3. The build produces a self-contained server in `.next/standalone`
   (`output: "standalone"` — no Vercel-only features). Deploy these paths:
   ```
   .next/standalone/   → app root
   .next/static/       → .next/static
   public/             → public
   ```
4. Set environment variables from `.env.example` in the hosting panel and
   start the app with:
   ```bash
   node server.js     # honours PORT (defaults to 3000)
   ```
5. Point your domain at the Node app (or proxy through Apache/Nginx).
   Compression, immutable asset caching and security headers are
   pre-configured in `next.config.ts`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Strict TypeScript check |

## Project structure

```
src/
  app/            # App Router — (auth) public pages, (app) workspace
  components/     # ui/ (design system) · layout/ · charts/ · providers/
  features/       # feature-scoped composites (clients, projects, tasks…)
  hooks/          # TanStack Query data hooks
  lib/            # i18n, formatting, seed data, utils, constants
  services/       # auth + repositories (Supabase ⇄ demo fallback)
  types/          # domain model
supabase/
  migrations/     # schema, RLS policies, seed
```
