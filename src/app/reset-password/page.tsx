"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase/client";

// /reset-password — landing target of the secure reset link.
// Supabase attaches a recovery session via /auth/callback; we then call the
// real updateUser() so the password is hashed and stored server-side.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      // No recovery session → the link is missing/expired/invalid.
      const sb = getSupabase();
      if (!sb) {
        setError("Password reset isn't available on this deployment yet — the auth backend isn't configured.");
        return;
      }
      void sb.auth.getSession().then(({ data }) => {
        if (!data.session) setError("This reset link is invalid or has expired. Request a new one.");
      });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");

    if (password.length < 8) {
      setError("Use a stronger password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError("Password reset isn't available on this deployment yet — the auth backend isn't configured.");
      return;
    }

    setBusy(true);
    const { error: err } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError("We couldn't update your password. Request a fresh link and try again.");
      return;
    }
    setNotice("Password updated. Redirecting you to sign in...");
    setTimeout(() => router.push("/signin"), 1500);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white dark:bg-slate-950 px-5">
      <div className="w-full max-w-[368px]">
        <Link href="/" className="block text-center mb-7">
          <span className="text-[18px] font-extrabold tracking-tight text-[#101a3f] dark:text-white">AI-PATH</span>
          <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Your Personal AI Tutor</div>
        </Link>

        <h1 className="text-[23px] font-extrabold tracking-[-0.01em] text-[#101a3f] dark:text-white">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400">
          Your reset link is single-use — this replaces the old password for good.
        </p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="reset-pass"
              className="block text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              New password
            </label>
            <input
              id="reset-pass"
              type="password"
              className="w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="8+ characters"
            />
          </div>
          <div>
            <label
              htmlFor="reset-confirm"
              className="block text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Confirm new password
            </label>
            <input
              id="reset-confirm"
              type="password"
              className="w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat your password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-[13px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2.5"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2.5"
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-[42px] rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-70 text-white text-[14px] font-bold transition"
          >
            {busy ? "Updating password..." : "Update Password"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-slate-500">
          <Link href="/signin" className="font-bold text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
