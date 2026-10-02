"use client";
// AI-PATH client authentication — thin, honest wrapper around the real
// Supabase Auth backend (@supabase/ssr cookie sessions).
//
// • Google / GitHub OAuth: real provider redirects via Supabase; the browser
//   only ever holds the PUBLIC anon key — provider secrets stay in Supabase.
// • Email/password: server routes (src/app/api/auth/*) validate + hash.
// • Sessions: httpOnly cookies refreshed by middleware; this module only
//   caches the display profile (name/email/avatar) in memory.
// • Guest data: never touched here — signing in/up preserves local progress
//   and (when provisioned) mirrors it to the account server-side.

import { useSyncExternalStore } from "react";
import { getSupabase } from "./supabase/client";

export interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  /** "google" | "github" | "email" — which provider authenticated this user. */
  provider?: string;
}

interface SessionState {
  configured: boolean;
  user: AuthUser | null;
}

// ---------- tiny event bus with a STABLE snapshot (useSyncExternalStore) ----------
let state: SessionState = { configured: true, user: null };
const listeners = new Set<() => void>();
let started = false;

function emit() {
  listeners.forEach((l) => l());
}

async function loadSession() {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const data = (await res.json()) as { configured?: boolean; user: AuthUser | null };
    state = { configured: data.configured !== false, user: data.user ?? null };
  } catch {
    state = { configured: true, user: null };
  }
  emit();
}

function subscribeAuth(fn: () => void) {
  listeners.add(fn);
  if (!started) {
    started = true;
    void loadSession();
  }
  return () => {
    listeners.delete(fn);
  };
}

export function useAuth(): AuthUser | null {
  return useSyncExternalStore(
    subscribeAuth,
    () => state.user,
    () => null
  );
}

/** Whether this deployment has auth configured (for honest UI states). */
export function authConfigured(): boolean {
  return state.configured;
}

/** Re-read the session from the server (after login/logout). */
export async function refreshAuth(): Promise<SessionState> {
  await loadSession();
  return state;
}

// ---------- validation ----------

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ---------- email/password (server-validated) ----------

type AuthResult = { ok: true; needsConfirm?: boolean } | { ok: false; error: string };

async function post(path: string, payload: unknown): Promise<AuthResult & { message?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; message?: string; needsConfirm?: boolean };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Something went wrong. Please try again." };
    }
    return { ok: true, needsConfirm: data.needsConfirm, message: data.message };
  } catch {
    return { ok: false, error: "We couldn't reach the server. Check your connection and try again." };
  }
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const r = await post("/api/auth/signup", input);
  if (r.ok && !r.needsConfirm) {
    await refreshAuth();
    // Guest progress follows the new account (never deletes local data).
    await syncGuestProgressToAccount();
  }
  return r;
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const r = await post("/api/auth/signin", input);
  if (r.ok) {
    await refreshAuth();
    await syncGuestProgressToAccount();
  }
  return r;
}

export async function forgotPassword(email: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  return post("/api/auth/forgot", { email });
}

export async function signOut() {
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } catch {
    // network hiccup — cookies expire on their own
  }
  await refreshAuth();
}

// ---------- OAuth (Google + GitHub — real provider flows) ----------

type OAuthProvider = "google" | "github";

function oauthErrorCopy(provider: OAuthProvider): string {
  return provider === "google"
    ? "Google sign-in wasn't completed. Please try again."
    : "GitHub sign-in wasn't completed. Please try again.";
}

export async function startOAuth(provider: OAuthProvider, nextPath?: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      error: `${provider === "google" ? "Google" : "GitHub"} sign-in isn't available on this deployment yet — the auth backend hasn't been configured.`,
    };
  }
  const next = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "";
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });
  if (error) return { ok: false, error: oauthErrorCopy(provider) };
  return { ok: true }; // browser is being redirected to the provider
}

// ---------- guest → account progress migration ----------

/**
 * Associate the guest's local learning state with the signed-in account.
 * Never overwrites local data; server-side failures are reported honestly by
 * the caller (no fake "synced" claims).
 */
export async function syncGuestProgressToAccount(): Promise<boolean> {
  try {
    const raw = localStorage.getItem("ai-path-progress-v3");
    if (!raw) return true;
    const res = await fetch("/api/auth/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: JSON.parse(raw) }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return res.ok && data.ok === true;
  } catch {
    return false;
  }
}

/** Restore account progress when this device has none (fresh browser). */
export async function restoreAccountProgressIfEmpty(): Promise<boolean> {
  try {
    const local = localStorage.getItem("ai-path-progress-v3");
    const hasLocal = !!local && local.length > 200 && !/"onboarded"\s*:\s*false/.test(local);
    if (hasLocal) return false;
    const res = await fetch("/api/auth/progress", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean; progress?: unknown };
    if (!data.ok || !data.progress) return false;
    localStorage.setItem("ai-path-progress-v3", JSON.stringify(data.progress));
    return true;
  } catch {
    return false;
  }
}

// ---------- helpers for auth screens ----------

export function consumeNextPath(fallback: string): string {
  try {
    const remembered = sessionStorage.getItem("ai-path-auth-next");
    if (remembered) {
      sessionStorage.removeItem("ai-path-auth-next");
      return remembered;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function rememberNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) return;
  try {
    sessionStorage.setItem("ai-path-auth-next", nextPath);
  } catch {
    /* ignore */
  }
}
