// Multi-key cloud engine with automatic failover.
// Env:
//   GROQ_KEYS   = comma-separated Groq keys (gsk_..., up to 10+). Falls back to GROQ_API_KEY.
//   GEMINI_KEYS = comma-separated Google AI Studio keys (backup provider). Falls back to GEMINI_API_KEY.
// How it survives limits: round-robin across keys; a key that hits 429/5xx or
// network error is parked in cooldown (90s) and the next key takes over
// instantly. Groq pool first, Gemini pool second. Judges only see answers.
interface Attempt {
  reply: string;
  engine: string;
}

const COOLDOWN_MS = 90_000;
const coolUntil = new Map<string, number>(); // key -> timestamp
let groqCursor = 0;
let geminiCursor = 0;

function pool(name: string, legacy: string): string[] {
  const raw = process.env[name] || process.env[legacy] || "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function pick(keys: string[], cursor: { i: number }): string | null {
  if (!keys.length) return null;
  const now = Date.now();
  for (let n = 0; n < keys.length; n++) {
    const k = keys[(cursor.i + n) % keys.length];
    if ((coolUntil.get(k) ?? 0) <= now) {
      cursor.i = (cursor.i + n + 1) % keys.length;
      return k;
    }
  }
  return null; // all cooling — caller decides (wait or fail over)
}

function park(key: string) {
  coolUntil.set(key, Date.now() + COOLDOWN_MS);
}

/** Ordered Groq keys, skipping cooling ones. */
export function groqPool(): string[] {
  const now = Date.now();
  return pool("GROQ_KEYS", "GROQ_API_KEY").filter((k) => (coolUntil.get(k) ?? 0) <= now);
}

export function coolKey(key: string) {
  park(key);
}

async function groqOnce(key: string, messages: any[], vision = false): Promise<string> {
  // Map our attachment parts to OpenAI-style content for Groq's vision model.
  const mapped = messages.map((m: any) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content
        .map((p: any) => {
          if (p.type === "text") return { type: "text", text: p.text };
          if (p.type === "image") return { type: "image_url", image_url: { url: `data:${p.mime};base64,${p.data}` } };
          return null; // pdfs never reach Groq (cloudChat routes them to Gemini)
        })
        .filter(Boolean),
    };
  });
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: vision ? "qwen/qwen3.8-27b" : "openai/gpt-oss-120b",
      messages: mapped,
      temperature: 0.7,
      // Quiz/plan JSON can exceed 900 tokens and get truncated → parse fails.
      max_tokens: 4000,
    }),
  });
  if (res.status === 429 || res.status >= 500) throw new Error(`Groq HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty Groq reply");
  return reply;
}

async function geminiOnce(key: string, messages: any[]): Promise<string> {
  // Map OpenAI-style messages to Gemini contents — text, images and PDFs
  // travel as inline_data (Gemini reads both natively).
  const sys = messages.find((m: any) => m.role === "system");
  const rest = messages.filter((m: any) => m.role !== "system");
  const contents = rest.map((m: any) => {
    const parts = Array.isArray(m.content)
      ? m.content
          .map((p: any) => {
            if (p.type === "text") return { text: p.text };
            if (p.type === "image" || p.type === "pdf") return { inline_data: { mime_type: p.mime, data: p.data } };
            return null;
          })
          .filter(Boolean)
      : [{ text: String(m.content) }];
    return { role: m.role === "assistant" ? "model" : "user", parts: parts.length ? parts : [{ text: "" }] };
  });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(sys ? { systemInstruction: { parts: [{ text: String(sys.content) }] } } : {}),
      }),
    }
  );
  if (res.status === 429 || res.status >= 500) throw new Error(`Gemini HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("");
  if (!reply) throw new Error("Empty Gemini reply");
  return reply;
}

/** Try every Groq key, then every Gemini key. Throws only if ALL fail. */
export async function cloudChat(messages: any[]): Promise<Attempt> {
  // Manual "use my own key" (Settings): browser sends x-user-groq / x-user-gemini.
  // Those are tried FIRST for this one request, then the server's private pool.
  let userGroq: string[] = [];
  let userGemini: string[] = [];
  try {
    const h = (await import("next/headers")).headers();
    const hh = await h;
    const ug = hh.get("x-user-groq");
    const um = hh.get("x-user-gemini");
    if (ug) userGroq = ug.split(",").map((s) => s.trim()).filter(Boolean);
    if (um) userGemini = um.split(",").map((s) => s.trim()).filter(Boolean);
  } catch { /* not in a request scope */ }
  const isMine = (k: string) => userGroq.includes(k) || userGemini.includes(k);

  const groqKeys = [...userGroq, ...pool("GROQ_KEYS", "GROQ_API_KEY")];
  const geminiKeys = [...userGemini, ...pool("GEMINI_KEYS", "GEMINI_API_KEY")];
  const cursor = { i: groqCursor };
  const gcur = { i: geminiCursor };
  const failures: string[] = [];

  // multimodal routing: images work on both providers (Groq vision first),
  // PDFs are Gemini-only — Groq keys are skipped so no wasted attempts.
  let hasImage = false;
  let hasPdf = false;
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p?.type === "image") hasImage = true;
        if (p?.type === "pdf") hasPdf = true;
      }
    }
  }

  if (!hasPdf) {
    for (let n = 0; n < groqKeys.length; n++) {
      const key = pick(groqKeys, cursor);
      if (!key) break;
      try {
        const reply = await groqOnce(key, messages, hasImage);
        groqCursor = cursor.i;
        return { reply, engine: (hasImage ? "groq:qwen3.8-vision" : "groq:gpt-oss-120b") + (isMine(key) ? " · your key" : "") };
      } catch (e: any) {
        park(key);
        failures.push(`groq:${e.message}`);
      }
    }
    groqCursor = cursor.i;
  }

  for (let n = 0; n < geminiKeys.length; n++) {
    const key = pick(geminiKeys, gcur);
    if (!key) break;
    try {
      const reply = await geminiOnce(key, messages);
      geminiCursor = gcur.i;
      return { reply, engine: (hasPdf ? "gemini:2.5-flash (pdf)" : "gemini:2.5-flash") + (isMine(key) ? " · your key" : "") };
    } catch (e: any) {
      park(key);
      failures.push(`gemini:${e.message}`);
    }
  }
  geminiCursor = gcur.i;

  const hint = hasPdf
    ? "Reading PDFs needs a Gemini key (GEMINI_KEYS) — Groq cannot open PDFs. Or paste the text directly."
    : "No cloud keys configured (set GROQ_KEYS and/or GEMINI_KEYS)";
  throw new Error(failures.length ? failures.join("; ") : hint);
}

/** What the UI/ping endpoint reports (key counts only — never values). */
export function poolStatus() {
  return {
    groqKeys: pool("GROQ_KEYS", "GROQ_API_KEY").length,
    geminiKeys: pool("GEMINI_KEYS", "GEMINI_API_KEY").length,
  };
}
