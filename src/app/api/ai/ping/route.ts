// POST /api/ai/ping — real key test for Settings → AI Engine.
// Uses x-user-groq / x-user-gemini headers (caller's own key) first,
// then the server pool. Returns only engine name + tiny reply — never keys.
import { cloudChat } from "../../../../lib/llm";

export async function POST() {
  try {
    const { reply, engine } = await cloudChat([
      { role: "system", content: "Reply with exactly: OK" },
      { role: "user", content: "ping" },
    ]);
    return Response.json({ ok: true, engine, reply: String(reply).slice(0, 40) });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message ?? e).slice(0, 300) });
  }
}
