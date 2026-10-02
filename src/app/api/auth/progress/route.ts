import { supabaseServer, json } from "../../../../lib/supabase/server";

const MAX_BYTES = 600_000; // generous cap for the progress JSON blob

// PUT /api/auth/progress — associate the guest's learning state with the
// authenticated account (server-side, keyed by session user). GET returns the
// stored copy so a fresh device can restore it. Skips honestly when the
// progress table has not been provisioned yet.
async function withStore(fn: (sb: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>, uid: string) => Promise<Response>) {
  const sb = await supabaseServer();
  if (!sb) return json(503, { ok: false, error: "Cloud save isn't available on this deployment yet." });

  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return json(401, { ok: false, error: "Sign in to save your progress." });

  try {
    return await fn(sb, uid);
  } catch {
    return json(500, { ok: false, error: "Couldn't save right now." });
  }
}

export async function PUT(req: Request) {
  return withStore(async (sb, uid) => {
    let body: { progress?: unknown };
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, error: "Invalid payload." });
    }
    const raw = JSON.stringify(body.progress ?? "");
    if (raw.length > MAX_BYTES) return json(413, { ok: false, error: "Progress data too large to sync." });

    const { error } = await sb.from("user_progress").upsert(
      { user_id: uid, data: JSON.parse(raw), updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) {
      // Table not provisioned yet (see supabase/auth-extras.sql) — no fake success.
      return json(503, { ok: false, error: "Cloud save isn't set up yet on this deployment." });
    }
    return json(200, { ok: true });
  });
}

export async function GET() {
  return withStore(async (sb, uid) => {
    const { data, error } = await sb.from("user_progress").select("data, updated_at").eq("user_id", uid).maybeSingle();
    if (error || !data) return json(200, { ok: true, progress: null });
    return json(200, { ok: true, progress: data.data, updatedAt: data.updated_at });
  });
}
