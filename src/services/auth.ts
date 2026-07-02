"use client";

// Authentication service. With Supabase configured it uses real email/password
// auth (verification + recovery emails included). In demo mode it validates
// against the seeded workspace owner and stores a signed-in marker cookie that
// the middleware checks for protected routes.

import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { SESSION_COOKIE } from "@/lib/i18n/config";

export const DEMO_EMAIL = "abdullah@hirf.sa";
export const DEMO_PASSWORD = "Hirf@2026";

export interface SessionUser {
  email: string;
  name: string;
  role: "owner";
}

function setSessionCookie(email: string) {
  const value = encodeURIComponent(JSON.stringify({ email, at: Date.now() }));
  document.cookie = `${SESSION_COOKIE}=${value};path=/;max-age=${60 * 60 * 12};samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=;path=/;max-age=0`;
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    setSessionCookie(email);
    return { ok: true };
  }
  // Demo mode
  if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
    setSessionCookie(email);
    return { ok: true };
  }
  return { ok: false, error: "invalid" };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (supabase) await supabase.auth.signOut();
  clearSessionCookie();
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/reset-password` });
  }
  // Always report success — never leak whether an account exists.
  return { ok: true };
}

export async function updatePassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowser();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export { isSupabaseConfigured };
