# Local Development

## Prerequisites
- Node.js 20+, Git, VS Code

## Setup
    npm install
    # create .env.local (never commit it):
    #   NEXT_PUBLIC_SUPABASE_URL=https://groefmbcldbqynjkvima.supabase.co
    #   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

## Daily commands
    npm run dev                      # http://localhost:3000
    npx tsc --noEmit                 # typecheck
    npm run build                    # production build
    npx @cloudflare/next-on-pages@1  # Cloudflare build (optional)

## Supabase (direct DB access)
    npm install -g supabase
    supabase login
    supabase link --project-ref groefmbcldbqynjkvima
    supabase db push                 # apply migrations in supabase/migrations in order
    # or paste each migration into the SQL Editor in numeric order (0001 … 00xx)

## Cloudflare (optional)
    npm install -g wrangler
    wrangler login
    # Deploy also happens automatically on: git push origin main

## Notes
- Secrets live only in .env.local (git-ignored). Never put a service-role key in NEXT_PUBLIC_*.
- Production requires Supabase; there is no seed fallback. Demo mode is dev-only via
  NEXT_PUBLIC_DATA_MODE=demo.
