// Multi-key cloud engine with automatic failover.
import type { ChatMsg, MsgPart } from "./ai";
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
let openrouterCursor = 0;
let geminiCursor = 0;

// OpenRouter free models (404 = ID retired → try next).
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3.8-27b:free",
  "google/gemma-4-31b-it:free",
];

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

/** Provider HTTP failure carrying backoff metadata (Retry-After honoured). */
class ProviderHttpError extends Error {
  constructor(provider: string, readonly status: number, readonly retryAfterMs?: number) {
    super(`${provider} HTTP ${status}`);
  }
}

function retryMs(res: Response): number | undefined {
  const ra = res.headers.get("retry-after");
  if (!ra) return undefined;
  const secs = Number(ra);
  if (Number.isFinite(secs)) return Math.max(5, secs) * 1000;
  const at = Date.parse(ra);
  return Number.isFinite(at) ? Math.max(5_000, at - Date.now()) : undefined;
}

/** Backoff per failure: rate-limit → until the provider says go again (Retry-After,
 *  default 2 min); dead key → 30 min; server hiccup → 90s. Every key re-enters
 *  rotation automatically when its window expires — limits self-heal, no restart. */
function parkFor(e: unknown): number {
  if (e instanceof ProviderHttpError) {
    if (e.status === 401 || e.status === 403) return 30 * 60_000;
    if (e.status === 429) return e.retryAfterMs ?? 120_000;
    if (e.status >= 500) return e.retryAfterMs ?? 90_000;
  }
  return COOLDOWN_MS;
}

function park(key: string, ms = COOLDOWN_MS) {
  coolUntil.set(key, Date.now() + ms);
}

/** Ordered Groq keys, skipping cooling ones. */
export function groqPool(): string[] {
  const now = Date.now();
  return pool("GROQ_KEYS", "GROQ_API_KEY").filter((k) => (coolUntil.get(k) ?? 0) <= now);
}

export function coolKey(key: string) {
  park(key);
}

async function groqOnce(key: string, messages: ChatMsg[], vision = false): Promise<string> {
  // Map our attachment parts to OpenAI-style content for Groq's vision model.
  const mapped = messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content
        .map((p: MsgPart) => {
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
  if (!res.ok) throw new ProviderHttpError("Groq", res.status, retryMs(res));
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty Groq reply");
  return reply;
}

// Gemini model IDs rotate — a 404 means the ID was retired, so try known-good IDs in order.
const GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-flash-latest"];

async function geminiOnce(key: string, messages: ChatMsg[]): Promise<string> {
  // Map OpenAI-style messages to Gemini contents — text, images and PDFs
  // travel as inline_data (Gemini reads both natively).
  const sys = messages.find((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");
  const contents = rest.map((m) => {
    const parts = Array.isArray(m.content)
      ? m.content
          .map((p: MsgPart) => {
            if (p.type === "text") return { text: p.text };
            if (p.type === "image" || p.type === "pdf") return { inline_data: { mime_type: p.mime, data: p.data } };
            return null;
          })
          .filter(Boolean)
      : [{ text: String(m.content) }];
    return { role: m.role === "assistant" ? "model" : "user", parts: parts.length ? parts : [{ text: "" }] };
  });
  let res: Response | undefined;
  for (const model of GEMINI_MODELS) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(sys ? { systemInstruction: { parts: [{ text: String(sys.content) }] } } : {}),
        }),
      }
    );
    if (res.status !== 404) break; // 404 = this model ID is retired → try the next one
  }
  if (!res) throw new Error("Gemini HTTP 404 (no working model ID)");
  if (!res.ok) throw new ProviderHttpError("Gemini", res.status, retryMs(res));
  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
  if (!reply) throw new Error("Empty Gemini reply");
  return reply;
}

/** OpenRouter — OpenAI-compatible endpoint over free models, 404-fallback chain. */
async function openrouterOnce(key: string, messages: ChatMsg[]): Promise<string> {
  // Same OpenAI-style mapping as Groq (text + image parts; PDFs never land here).
  const mapped = messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content
        .map((p) => {
          if (p.type === "text") return { type: "text", text: p.text };
          if (p.type === "image") return { type: "image_url", image_url: { url: `data:${p.mime};base64,${p.data}` } };
          return null;
        })
        .filter(Boolean),
    };
  });
  let res: Response | undefined;
  for (const model of OPENROUTER_MODELS) {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://ai-path-tutor.vercel.app",
        "X-Title": "AI-PATH",
      },
      body: JSON.stringify({ model, messages: mapped, temperature: 0.7, max_tokens: 4000 }),
    });
    if (res.status !== 404 && res.status !== 400) break; // bad model ID → try the next one
  }
  if (!res) throw new Error("OpenRouter HTTP 404 (no working model ID)");
  if (!res.ok) throw new ProviderHttpError("OpenRouter", res.status, retryMs(res));
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty OpenRouter reply");
  return reply;
}

/** Try every Groq key, then every Gemini key. Throws only if ALL fail. */
export async function cloudChat(messages: ChatMsg[]): Promise<Attempt> {
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
  const openrouterKeys = pool("OPENROUTER_KEYS", "OPENROUTER_API_KEY");
  const geminiKeys = [...userGemini, ...pool("GEMINI_KEYS", "GEMINI_API_KEY")];
  const cursor = { i: groqCursor };
  const ocur = { i: openrouterCursor };
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
      } catch (e) {
        park(key, parkFor(e));
        failures.push(`groq:${e instanceof Error ? e.message : String(e)}`);
      }
    }
    groqCursor = cursor.i;
  }

  // OpenRouter — second line of defence for plain text chat (images/PDFs go to Gemini).
  if (!hasPdf && !hasImage) {
    for (let n = 0; n < openrouterKeys.length; n++) {
      const key = pick(openrouterKeys, ocur);
      if (!key) break;
      try {
        const reply = await openrouterOnce(key, messages);
        openrouterCursor = ocur.i;
        return { reply, engine: "openrouter:free" };
      } catch (e) {
        park(key, parkFor(e));
        failures.push(`openrouter:${e instanceof Error ? e.message : String(e)}`);
      }
    }
    openrouterCursor = ocur.i;
  }

  for (let n = 0; n < geminiKeys.length; n++) {
    const key = pick(geminiKeys, gcur);
    if (!key) break;
    try {
      const reply = await geminiOnce(key, messages);
      geminiCursor = gcur.i;
      return { reply, engine: (hasPdf ? "gemini:3-flash (pdf)" : "gemini:3-flash") + (isMine(key) ? " · your key" : "") };
    } catch (e) {
      park(key, parkFor(e));
      failures.push(`gemini:${e instanceof Error ? e.message : String(e)}`);
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
