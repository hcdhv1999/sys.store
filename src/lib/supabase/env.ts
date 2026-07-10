// Single source of truth for the public Supabase configuration.
//
// The browser bundle only receives `NEXT_PUBLIC_*` values that Next.js inlines
// at build time, and inlining only happens for *literal* `process.env.X`
// references — so both key names are spelled out explicitly here rather than
// resolved through a computed key.
//
// Supabase's newer projects issue a "publishable" key (`sb_publishable_…`); the
// canonical variable is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, with the legacy
// `NEXT_PUBLIC_SUPABASE_ANON_KEY` kept as a fallback for older deployments.
// Both are public, RLS-protected keys — never the service-role secret.

export const SUPABASE_KEY_VAR = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}
