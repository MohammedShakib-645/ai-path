// POST /api/ai/chat { mode, profile, prefs, messages, attachments } —
// tutor modes + prefs + multimodal files (images & PDFs via copy/paste or upload).
import { aiChat, TUTOR_MODES } from "../../../../lib/ai";

export async function GET() {
  return Response.json({ modes: Object.entries(TUTOR_MODES).map(([id, m]) => ({ id, label: m.label })) });
}

interface Attachment {
  name?: string;
  mime?: string;
  kind?: "image" | "pdf" | "text";
  data?: string; // base64 (image/pdf) or raw text (text)
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ reply: "Empty request. Ask me anything about Python or AI.", engine: "mock" });
  }
  const { mode = "explain", profile = "", prefs, messages = [], attachments = [] } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ reply: "Ask me anything — a concept, code to debug, or say 'quiz me'.", engine: "mock" });
  }

  // Attachment guards — honest errors, never a silent drop.
  const atts: Attachment[] = Array.isArray(attachments) ? attachments.slice(0, 6) : [];
  let payloadChars = 0;
  for (const a of atts) payloadChars += (a.data || "").length;
  if (payloadChars > 8_000_000) {
    return Response.json({
      reply: "That attachment is too large (limit ~6 MB). Compress the image, split the file, or paste the text directly.",
      engine: "local",
      error: "TOO_LARGE",
    });
  }

  // Attach files to the CURRENT (last user) message only — history stays text.
  const msgs: { role: "system" | "user" | "assistant"; content: any }[] = messages
    .slice(-20)
    .map((m: any) => ({ role: (m.role === "assistant" || m.role === "system" ? m.role : "user") as "system" | "user" | "assistant", content: m.content }));
  let lastUser = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "user") { lastUser = i; break; }
  }
  if (atts.length && lastUser >= 0) {
    const textBlocks: string[] = [];
    const binParts: { type: "image" | "pdf"; mime: string; data: string }[] = [];
    for (const a of atts) {
      if (!a.data) continue;
      if (a.kind === "image") binParts.push({ type: "image", mime: a.mime || "image/png", data: a.data });
      else if (a.kind === "pdf") binParts.push({ type: "pdf", mime: "application/pdf", data: a.data });
      else textBlocks.push(`--- Attached document: ${a.name || "file"} ---\n${a.data}\n--- end of document ---`);
    }
    const base = typeof msgs[lastUser].content === "string" ? msgs[lastUser].content : "";
    const text = [base, ...textBlocks].filter(Boolean).join("\n\n");
    msgs[lastUser].content = binParts.length
      ? [{ type: "text", text: text || "Please analyze the attached file(s)." }, ...binParts]
      : text;
  }

  const style = prefs
    ? ` Style: ${prefs.respLength ?? "Short"} answers, ${prefs.style ?? "examples first"}, code in ${prefs.codeLang ?? "Python"}.`
    : "";
  try {
    const { reply, engine } = await aiChat(String(mode), `${profile}${style}`, msgs);
    return Response.json({ reply, engine });
  } catch (e: any) {
    return Response.json({
      reply: `AI service is temporarily unavailable (${e.message}). Your message is safe — try again, or add cloud keys in Vercel env (GROQ_KEYS / GEMINI_KEYS).`,
      engine: "mock",
      error: "AI_UNAVAILABLE",
    });
  }
}
