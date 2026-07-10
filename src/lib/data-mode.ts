// ── Explicit data modes ────────────────────────────────────────────────
// PRODUCTION (default): Supabase is the single source of truth. Missing or
// broken configuration surfaces as an error — never a silent seed fallback.
// DEMO: development-only, enabled explicitly with NEXT_PUBLIC_DATA_MODE=demo;
// reads/writes go to an in-memory copy of the bundled seed.

export type DataMode = "production" | "demo";

export function getDataMode(): DataMode {
  return process.env.NEXT_PUBLIC_DATA_MODE === "demo" ? "demo" : "production";
}

export function isDemoMode(): boolean {
  return getDataMode() === "demo";
}

/** Thrown when production mode runs without a valid Supabase configuration. */
export class DataConfigError extends Error {
  readonly name = "DataConfigError";
  readonly code = "SUPABASE_NOT_CONFIGURED";
  constructor() {
    super(
      "Production data mode requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (see PRODUCTION_DATA_SETUP.md), or explicitly " +
        "enable the development demo with NEXT_PUBLIC_DATA_MODE=demo.",
    );
  }
}
