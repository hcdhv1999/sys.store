"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseConfigured, supabaseUrl } from "./env";

let client: SupabaseClient | null | undefined;

/**
 * Browser Supabase client. Returns null when the env vars are absent. In
 * production the repository turns that null into a DataConfigError (no silent
 * seed fallback); only explicit demo mode (NEXT_PUBLIC_DATA_MODE=demo) serves
 * seed data.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  client = url && key ? createBrowserClient(url, key) : null;
  return client;
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfigured();
}
