import { supabaseServer, json, humanAuthError, throttle } from "../../../../lib/supabase/server";

// POST /api/auth/signup — REAL account creation via Supabase Auth.
// Server-side validation, hashed passwords (handled by Supabase), honest
// responses (email-confirmation flows are surfaced, never faked).
export async function POST(req: Request) {
  if (!throttle(`signup:${req.headers.get("x-forwarded-for") || "local"}`, 6, 60_000)) {
    return json(429, { ok: false, error: "Too many attempts. Please wait a minute and try again." });
  }

  const sb = await supabaseServer();
  if (!sb) {
    return json(503, {
      ok: false,
      error: "Account creation isn't available on this deployment yet — the database hasn't been configured.",
    });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, error: "Enter your full name, email address and password." });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  // Validate on the server — never trust the browser alone.
  if (name.length < 2) return json(400, { ok: false, error: "Enter your full name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { ok: false, error: "Enter a valid email address." });
  if (password.length < 8) return json(400, { ok: false, error: "Use a stronger password with at least 8 characters." });

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message);
    return json(400, {
      ok: false,
      error: duplicate ? "An account with this email already exists. Try signing in instead." : humanAuthError(error.message),
    });
  }

  // Email confirmation enabled in Supabase → no session yet. Say so honestly.
  if (!data.session) {
    return json(200, { ok: true, needsConfirm: true });
  }
  return json(200, { ok: true, needsConfirm: false });
}
