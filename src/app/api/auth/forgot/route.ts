import { supabaseServer, json, humanAuthError, throttle } from "../../../../lib/supabase/server";

// POST /api/auth/forgot — real password-reset initiation through Supabase
// Auth (it emails a secure single-use link to the address on file).
// If email delivery is not configured on this deployment, we say so plainly
// instead of pretending a message was sent.
export async function POST(req: Request) {
  if (!throttle(`forgot:${req.headers.get("x-forwarded-for") || "local"}`, 5, 60_000)) {
    return json(429, { ok: false, error: "Too many attempts. Please wait a minute and try again." });
  }

  const sb = await supabaseServer();
  if (!sb) {
    return json(503, {
      ok: false,
      error: "Password reset isn't available yet on this deployment — email delivery isn't configured.",
    });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Enter a valid email address." });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { ok: false, error: "Enter a valid email address." });

  const origin = new URL(req.url).origin;
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) return json(400, { ok: false, error: humanAuthError(error.message) });

  // Supabase does not reveal whether the address exists (anti-enumeration).
  return json(200, {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way. Check your inbox.",
  });
}
