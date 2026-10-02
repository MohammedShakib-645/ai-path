import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

// OAuth / email-link landing point (Google, GitHub, password recovery).
// Exchanges the provider code for a real session cookie, then continues to
// the requested page. Open-redirect safe: next must be a local path.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const sb = await supabaseServer();
  if (!sb) return NextResponse.redirect(`${url.origin}/signin?err=not_configured`);

  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${url.origin}/signin?err=oauth`);
  } else {
    // User cancelled or the provider returned an error — honest message.
    return NextResponse.redirect(`${url.origin}/signin?err=oauth`);
  }

  return NextResponse.redirect(`${url.origin}${next}`);
}
