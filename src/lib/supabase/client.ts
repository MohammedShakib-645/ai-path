"use client";
// Browser Supabase client — anon key only (public by design; never a secret).
// OAuth (Google/GitHub), password sign-up/in and session cookies all run
// through this client; the server never receives provider client secrets.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let decided = false;

/** Null when NEXT_PUBLIC_SUPABASE_* env vars are not configured yet. */
export function getSupabase(): SupabaseClient | null {
  if (decided) return client;
  decided = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  client = createBrowserClient(url, anonKey);
  return client;
}

export function supabaseConfigured(): boolean {
  return getSupabase() !== null;
}
