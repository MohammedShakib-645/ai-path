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

async function groqOnce(key: string, messages: any[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, temperature: 0.7, max_tokens: 600 }),
  });
  if (res.status === 429 || res.status >= 500) throw new Error(`Groq HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty Groq reply");
  return reply;
}

async function geminiOnce(key: string, messages: any[]): Promise<string> {
  const text = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
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
  const groqKeys = pool("GROQ_KEYS", "GROQ_API_KEY");
  const geminiKeys = pool("GEMINI_KEYS", "GEMINI_API_KEY");
  const cursor = { i: groqCursor };
  const gcur = { i: geminiCursor };
  const failures: string[] = [];

  for (let n = 0; n < groqKeys.length; n++) {
    const key = pick(groqKeys, cursor);
    if (!key) break;
    try {
      const reply = await groqOnce(key, messages);
      groqCursor = cursor.i;
      return { reply, engine: "groq:llama-3.3-70b" };
    } catch (e: any) {
      park(key);
      failures.push(`groq:${e.message}`);
    }
  }
  groqCursor = cursor.i;

  for (let n = 0; n < geminiKeys.length; n++) {
    const key = pick(geminiKeys, gcur);
    if (!key) break;
    try {
      const reply = await geminiOnce(key, messages);
      geminiCursor = gcur.i;
      return { reply, engine: "gemini:2.0-flash" };
    } catch (e: any) {
      park(key);
      failures.push(`gemini:${e.message}`);
    }
  }
  geminiCursor = gcur.i;

  throw new Error(failures.length ? failures.join("; ") : "No cloud keys configured (set GROQ_KEYS and/or GEMINI_KEYS)");
}

/** What the UI/ping endpoint reports (key counts only — never values). */
export function poolStatus() {
  return {
    groqKeys: pool("GROQ_KEYS", "GROQ_API_KEY").length,
    geminiKeys: pool("GEMINI_KEYS", "GEMINI_API_KEY").length,
  };
}
