import { supabaseServer, json } from "../../../../lib/supabase/server";

// POST /api/auth/signout — ends the Supabase session and clears its cookies.
// Learning data on the device is never touched.
export async function POST() {
  const sb = await supabaseServer();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {
      // still clear cookies below
    }
  }
  return json(200, { ok: true });
}
