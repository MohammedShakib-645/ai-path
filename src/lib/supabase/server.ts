// Server-side Supabase client for Route Handlers (cookie-based sessions via
// @supabase/ssr). Returns null when the deployment has no Supabase env yet —
// callers surface an honest "not configured" state instead of faking auth.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function supabaseServer() {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const store = await cookies();
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // setAll can be called from a Server Component — response cookies are
          // applied by middleware instead.
        }
      },
    },
  });
}

/** Uniform JSON response helper for auth endpoints. */
export function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}

/** Map provider/server errors to human copy — never leak raw codes. */
export function humanAuthError(raw: string): string {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("network") || msg.includes("fetch")) return "We couldn't reach the sign-in service. Check your connection and try again.";
  if (msg.includes("rate") || msg.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (msg.includes("password")) return "Use a stronger password with at least 8 characters.";
  if (msg.includes("email")) return "Enter a valid email address.";
  return "Something went wrong. Please try again.";
}

/** Lightweight in-memory throttle (per server instance) — slows abuse bursts. */
const buckets = new Map<string, { n: number; at: number }>();
export function throttle(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.at > windowMs) {
    buckets.set(key, { n: 1, at: now });
    if (buckets.size > 500) buckets.clear();
    return true;
  }
  b.n += 1;
  return b.n <= max;
}
