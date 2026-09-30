// POST /api/ai/chat { mode, profile, prefs, messages } — tutor modes + prefs
import { aiChat, TUTOR_MODES } from "../../../../lib/ai";

export async function GET() {
  return Response.json({ modes: Object.entries(TUTOR_MODES).map(([id, m]) => ({ id, label: m.label })) });
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ reply: "Empty request. Ask me anything about Python or AI.", engine: "mock" });
  }
  const { mode = "explain", profile = "", prefs, messages = [] } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ reply: "Ask me anything — a concept, code to debug, or say 'quiz me'.", engine: "mock" });
  }
  const style = prefs
    ? ` Style: ${prefs.respLength ?? "Short"} answers, ${prefs.style ?? "examples first"}, code in ${prefs.codeLang ?? "Python"}.`
    : "";
  try {
    const { reply, engine } = await aiChat(String(mode), `${profile}${style}`, messages.slice(-20));
    return Response.json({ reply, engine });
  } catch (e: any) {
    return Response.json({
      reply: `AI service is temporarily unavailable (${e.message}). Your message is safe — try again, or add cloud keys in Vercel env (GROQ_KEYS / GEMINI_KEYS).`,
      engine: "mock",
      error: "AI_UNAVAILABLE",
    });
  }
}
