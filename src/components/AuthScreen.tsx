"use client";
// AI-PATH authentication screen — shared by /signup and /signin.
// Deliberately restrained: no neon, no AI-art. Strong type, clean spacing,
// subtle borders, one accent color. Desktop = product panel + auth card.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "./Toaster";
import { useProgress } from "../lib/store";
import {
  consumeNextPath,
  forgotPassword,
  isValidEmail,
  refreshAuth,
  restoreAccountProgressIfEmpty,
  signIn,
  signUp,
  startOAuth,
} from "../lib/auth";

type Mode = "signup" | "signin";
type Panel = "auth" | "reset";

function GoogleG() {
  // Official Google "G" mark (4-color), inlined — no network dependency.
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GitHubMark() {
  // Official GitHub octocat mark (monochrome, uses currentColor)
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-[15px] h-[15px] rounded-full border-2 border-white/40 border-t-white animate-spin"
      aria-hidden="true"
    />
  );
}

const inputCls =
  "w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition";
const labelCls = "block text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5";
const primaryBtn =
  "w-full h-[42px] rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-70 text-white text-[14px] font-bold transition flex items-center justify-center gap-2";

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const s = useProgress();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [panel, setPanel] = useState<Panel>("auth");
  const nextRef = useRef<string>("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Hydration marker (DOM side-effect, no setState): tests and tooling can
  // wait for interactivity instead of guessing at timing.
  useEffect(() => {
    if (rootRef.current) rootRef.current.dataset.hydrated = "1";
  }, []);

  // Read query params just after mount (avoids useSearchParams Suspense
  // plumbing). State updates live inside async callbacks — never synchronous
  // in the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      const next = p.get("next");
      if (next && next.startsWith("/")) nextRef.current = next;
      const err = p.get("err");
      if (err === "oauth") setError("Sign-in wasn't completed. Please try again.");
      else if (err === "not_configured") setError("The auth backend isn't configured on this deployment yet.");
      else if (err === "google_unavailable") setError("Google sign-in wasn't completed. Please try again.");

      // Already signed in → skip the form (auth redirect behavior).
      void refreshAuth().then((st) => {
        if (st.user) router.replace(consumeNextPath(nextRef.current || "/dashboard"));
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  function guestGo() {
    router.push(nextRef.current || (s.onboarded ? "/dashboard" : "/start"));
  }

  /** Real Google / GitHub OAuth — redirects to the provider's consent screen. */
  async function oauth(provider: "google" | "github") {
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);
    setBusyLabel(provider === "google" ? "Connecting to Google..." : "Connecting to GitHub...");
    const r = await startOAuth(provider, nextRef.current || (isSignup ? "/start" : "/dashboard"));
    if (!r.ok) {
      setBusy(false);
      setBusyLabel("");
      setError(r.error);
    }
    // On success the browser is already navigating to the provider.
  }

  async function doSubmit() {
    if (busy) return;
    setError("");
    setNotice("");

    // Forgot password → real reset email via the backend (honest outcomes).
    if (panel === "reset") {
      if (!isValidEmail(email)) {
        setError("Enter a valid email address.");
        return;
      }
      setBusy(true);
      setBusyLabel("Sending reset link...");
      const r = await forgotPassword(email);
      setBusy(false);
      setBusyLabel("");
      if (!r.ok) {
        setError(r.error || "Something went wrong. Please try again.");
        return;
      }
      setNotice(r.message || "If an account exists for that email, a reset link is on its way.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password || (isSignup && password.length < 8)) {
      setError(isSignup ? "Use a stronger password with at least 8 characters." : "Enter your password.");
      return;
    }
    if (isSignup && !name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (isSignup && confirm !== password) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    setBusyLabel(isSignup ? "Creating your account..." : "Signing you in...");
    const r = isSignup ? await signUp({ name, email, password }) : await signIn({ email, password });
    setBusy(false);
    setBusyLabel("");
    if (!r.ok) {
      setError(r.error);
      return;
    }

    if (isSignup && r.needsConfirm) {
      // Supabase email confirmation is ON — say so, never fake a session.
      setNotice("Check your inbox to confirm your email, then sign in.");
      setPassword("");
      setConfirm("");
      return;
    }

    toast(isSignup ? "Account created — welcome to AI-PATH!" : "Welcome back!", "ok");
    if (!isSignup) await restoreAccountProgressIfEmpty();
    const fallback = isSignup && !s.onboarded ? "/start" : "/dashboard";
    router.push(consumeNextPath(nextRef.current || fallback));
  }

  const heading = panel === "reset" ? "Reset password" : isSignup ? "Create your account" : "Welcome back";
  const sub =
    panel === "reset"
      ? "Enter your email and we'll send a secure reset link."
      : isSignup
        ? "Start building your personalized learning journey."
        : "Continue your learning journey.";
  const submitLabel =
    panel === "reset"
      ? busy
        ? "Sending reset link..."
        : "Send Reset Link"
      : isSignup
        ? busy
          ? "Creating your account..."
          : "Create Account"
        : busy
          ? "Signing you in..."
          : "Sign In";

  return (
    <div ref={rootRef} className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden grid lg:grid-cols-2 bg-white dark:bg-slate-950">
      {/* LEFT — product panel (desktop only, restrained) */}
      <aside className="hidden lg:flex flex-col min-h-0 overflow-hidden bg-[#0b1030] px-10 xl:px-12 py-6 xl:py-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-white">
            AI-PATH
            <span className="text-[11px] font-semibold text-white/45">Your Personal AI Tutor</span>
          </Link>
          <p className="mt-4 xl:mt-6 text-[21px] xl:text-[24px] leading-[1.35] font-semibold text-white max-w-[440px] tracking-[-0.01em]">
            Learn with a path built around your goals, progress and weak topics.
          </p>
          <p className="mt-2 xl:mt-3 text-[13px] leading-relaxed text-slate-400 max-w-[420px]">
            Personalized path, coding practice, quizzes, AI interview and progress tracking — one calm place to
            actually finish what you start.
          </p>
        </div>

        {/* Preview = primary visual: takes ~92% of panel width at its intrinsic
            aspect ratio; scales down (both dimensions, ratio preserved) only if
            the viewport height is tighter — never a letterboxed thumbnail. */}
        <div className="flex-1 min-h-0 flex items-center justify-center py-4">
          {/* Real product screenshot (light mode) — captured from the live app */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/dashboard.png"
            alt="AI-PATH dashboard"
            className="block w-auto h-auto max-w-[92%] max-h-full rounded-xl border border-white/10 shadow-2xl shadow-black/40"
          />
        </div>

        <p className="text-[12px] text-white/40">Personalized learning, honestly measured.</p>
      </aside>

      {/* RIGHT — auth card: vertically centered, everything visible in one viewport */}
      <main className="min-h-0 lg:h-full flex items-center justify-center px-5 py-7 sm:px-10">
        <div className="w-full max-w-[368px]">
          {/* Mobile brand (left panel hidden on small screens) */}
          <div className="lg:hidden text-center mb-5">
            <Link href="/" className="text-[18px] font-extrabold tracking-tight text-[#101a3f] dark:text-white">
              AI-PATH
            </Link>
            <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">Your Personal AI Tutor</div>
          </div>

          <h1 className="text-[23px] font-extrabold tracking-[-0.01em] text-[#101a3f] dark:text-white">{heading}</h1>
          <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400">{sub}</p>

          {panel === "auth" && (
            <>
              {/* Real OAuth — Google & GitHub through Supabase.
                  Provider client secrets never touch this browser. */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => oauth("google")}
                  disabled={busy}
                  className="w-full h-[42px] rounded-lg border border-[#dadce0] dark:border-slate-700 bg-white hover:bg-[#f8faff] dark:hover:bg-slate-900 text-[14px] font-medium text-[#3c4043] dark:text-slate-200 transition flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  <GoogleG />
                  {busyLabel === "Connecting to Google..." ? busyLabel : "Continue with Google"}
                </button>
                <button
                  type="button"
                  onClick={() => oauth("github")}
                  disabled={busy}
                  className="w-full h-[42px] rounded-lg border border-[#dadce0] dark:border-slate-700 bg-white hover:bg-[#f8faff] dark:hover:bg-slate-900 text-[14px] font-medium text-[#3c4043] dark:text-slate-200 transition flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  <GitHubMark />
                  {busyLabel === "Connecting to GitHub..." ? busyLabel : "Continue with GitHub"}
                </button>
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3 my-4" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] font-bold tracking-[0.12em] text-slate-400">OR</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            </>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void doSubmit();
            }}
            noValidate
            className={panel === "reset" ? "mt-6 space-y-4" : "space-y-4"}
          >
            {isSignup && panel === "auth" && (
              <div>
                <label htmlFor="auth-name" className={labelCls}>
                  Full name
                </label>
                <input
                  id="auth-name"
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Mohammed Shakib"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className={labelCls}>
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            {panel === "auth" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-pass" className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-400">
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => {
                        setPanel("reset");
                        setError("");
                        setNotice("");
                      }}
                      className="text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-pass"
                  type="password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "8+ characters" : "Your password"}
                />
              </div>
            )}

            {isSignup && panel === "auth" && (
              <div>
                <label htmlFor="auth-confirm" className={labelCls}>
                  Confirm password
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  className={inputCls}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-[13px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2.5">
                {notice}
              </p>
            )}

            {/* type=button: a click before hydration is a harmless no-op
                (never a native form submit that would reload the page) */}
            <button type="button" onClick={() => void doSubmit()} disabled={busy} className={primaryBtn}>
              {busy && <Spinner />}
              {submitLabel}
            </button>
          </form>

          {panel === "reset" ? (
            <p className="mt-4 text-center text-[13px] text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setPanel("auth");
                  setError("");
                  setNotice("");
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <p className="mt-5 text-center text-[13.5px] text-slate-500 dark:text-slate-400">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <Link
                href={isSignup ? "/signin" : "/signup"}
                className="font-bold text-indigo-600 hover:text-indigo-500"
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </p>
          )}

          {/* Guest stays one click away — judges never hit a wall */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={guestGo}
              className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
