import { supabaseServer, json, throttle } from "../../../../lib/supabase/server";

const GENERIC = "We couldn't sign you in. Check your email and password and try again.";

// POST /api/auth/signin — real credential check against Supabase Auth.
export async function POST(req: Request) {
  if (!throttle(`signin:${req.headers.get("x-forwarded-for") || "local"}`, 10, 60_000)) {
    return json(429, { ok: false, error: "Too many attempts. Please wait a minute and try again." });
  }

  const sb = await supabaseServer();
  if (!sb) {
    return json(503, {
      ok: false,
      error: "Sign in isn't available on this deployment yet — the database hasn't been configured.",
    });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: GENERIC });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { ok: false, error: "Enter a valid email address." });
  if (!password) return json(400, { ok: false, error: "Enter your password." });

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message || "";
    if (/confirm/i.test(msg)) {
      return json(401, { ok: false, error: "Confirm your email first — open the link we sent to your inbox." });
    }
    return json(401, { ok: false, error: GENERIC });
  }
  return json(200, { ok: true });
}
