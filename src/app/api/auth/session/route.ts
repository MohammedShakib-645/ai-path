import { supabaseServer, json } from "../../../../lib/supabase/server";

// GET /api/auth/session — current authenticated user from the httpOnly
// Supabase session cookies. Never returns tokens or hashes.
export async function GET() {
  const sb = await supabaseServer();
  if (!sb) return json(200, { configured: false, user: null });

  try {
    const { data, error } = await sb.auth.getSession();
    if (error || !data.session) return json(200, { configured: true, user: null });

    const u = data.session.user;
    const meta = (u.user_metadata || {}) as { full_name?: string; avatar_url?: string; picture?: string };
    const provider = (u.app_metadata as { provider?: string } | undefined)?.provider || "email";
    return json(200, {
      configured: true,
      user: {
        name: meta.full_name || u.email?.split("@")[0] || "Learner",
        email: u.email || "",
        avatar: meta.avatar_url || meta.picture || "",
        provider,
      },
    });
  } catch {
    return json(200, { configured: true, user: null });
  }
}
