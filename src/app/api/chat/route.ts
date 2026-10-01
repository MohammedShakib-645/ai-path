// AI-Path chat API — pure cloud key pools with automatic failover.
// Env (Vercel dashboard, never in code):
//   GROQ_KEYS   = gsk_...,gsk_... (up to 10+, free at console.groq.com)
//   GEMINI_KEYS = AI...,AI... (backup, free at aistudio.google.com)
// Rotation: round-robin; a key hitting 429/5xx cools down 90s and the next
// key answers instantly. Groq pool first, Gemini pool second.
import { cloudChat, poolStatus, groqPool, coolKey } from "../../../lib/llm";

const SYSTEM_PROMPT = `You are "AI-PATH", this app's built-in AI tutor chatbot for a student learning the complete AI journey: Python foundations, Math for AI, Data Science, Machine Learning, Deep Learning, NLP, Computer Vision, Generative AI, LLMs, Transformers and AI Agents.
Rules:
- Never say you are ChatGPT, GPT, Gemini, a language model, or any other product — you are always your AI-PATH chatbot.
- Explain simply with a short answer first, then one small example (Python code when the topic is programming/ML, plain example otherwise).
- Use fenced \`\`\`python (or the relevant language) code blocks for code.
- Keep answers under 220 words unless asked for depth.
- End with one follow-up question or tiny exercise.
- Adapt depth to the learner's level: Beginner = tiny steps + encouragement; Intermediate = idioms + pitfalls; Advanced = trade-offs and system thinking.`;

// GET /api/chat → pool health for the UI (counts only, never key values)
export async function GET() {
  const pools = poolStatus();
  return Response.json({
    ok: pools.groqKeys > 0 || pools.geminiKeys > 0,
    defaultProvider: "cloud",
    pools,
  });
}

export async function POST(req: Request) {
  const { messages, profile, stream = false } = await req.json();
  const p = profile ?? {};
  const profileBlock = p.level
    ? `\n\nLEARNER PROFILE (live, adapt to it): level=${p.level}, units done=${p.done ?? 0}/12, avg quiz score=${p.avg ?? "none yet"}%, current unit="${p.next ?? "unknown"}". If level is Beginner, use tiny steps and encouragement; Intermediate gets idioms + pitfalls; Advanced gets complexity trade-offs and system thinking. Suggest practice on the current unit.`
    : "";
  const withSystem = [{ role: "system", content: SYSTEM_PROMPT + profileBlock }, ...(messages ?? []).slice(-20)];

  // Streaming: try Groq keys live (SSE → plain text for the UI reader)
  if (stream) {
    for (const key of groqPool()) {
      try {
        const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: withSystem, temperature: 0.7, max_tokens: 600, stream: true }),
        });
        if (!upstream.ok || !upstream.body) throw new Error(`Groq HTTP ${upstream.status}`);
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        (async () => {
          let buf = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith("data:")) continue;
                const payload = t.slice(5).trim();
                if (payload === "[DONE]") { await writer.close(); return; }
                try {
                  const piece = JSON.parse(payload)?.choices?.[0]?.delta?.content ?? "";
                  if (piece) await writer.write(new TextEncoder().encode(piece));
                } catch { /* partial */ }
              }
            }
          } catch { /* disconnect */ }
          try { await writer.close(); } catch { /* closed */ }
        })();
        return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Engine": "groq:llama-3.3-70b" } });
      } catch {
        coolKey(key);
      }
    }
    // all Groq keys busy → non-stream Gemini fallback below
  }

  try {
    const { reply, engine } = await cloudChat(withSystem);
    return Response.json({ reply, engine });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({
      reply: `Cloud engines unreachable (${msg}).\n\nOwner: add free keys in Vercel → Settings → Environment Variables:\n• GROQ_KEYS = gsk_...,gsk_... (console.groq.com)\n• GEMINI_KEYS = AI...,AI... (aistudio.google.com, backup)`,
      engine: "mock",
      error: msg,
    });
  }
}
