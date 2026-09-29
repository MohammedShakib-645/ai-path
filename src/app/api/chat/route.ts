// AI-Path chat API — hybrid engine.
// - "groq"  (cloud): works for EVERY user of the deployed app. Owner sets
//   GROQ_API_KEY once on the server/Vercel; all users share it (free tier).
// - "ollama" (local): only works on the PC running Ollama (owner's PC).
//   A visitor's browser can never reach YOUR localhost — that's why cloud
//   must be the default for other users.
// - "auto" (default): try local Ollama first, fall back to Groq cloud.
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const DEFAULT_PROVIDER = (process.env.AI_PROVIDER ?? "auto") as "auto" | "ollama" | "groq";

const SYSTEM_PROMPT = `You are the AI-Path personal tutor for Mohammed, a beginner learning Python then AI/ML.
Rules:
- Explain simply with a short answer first, then one small Python example.
- Use fenced \`\`\`python code blocks for code.
- Keep answers under 220 words unless asked for depth.
- End with one follow-up question or tiny exercise.
- If asked non-Python questions, still tie back to learning progress.`;

async function askOllama(model: string, messages: any[], stream: boolean, temperature: number) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // think:false — skip Qwen3 reasoning tokens for fast, chatty answers
    body: JSON.stringify({ model, messages, stream, think: false, options: { temperature } }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  return res;
}

async function askGroq(messages: any[]) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set on server");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty reply from Groq");
  return reply as string;
}

// GET /api/chat → health + models for the UI picker
export async function GET() {
  let ollama: any = { ok: false };
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { cache: "no-store" });
    const data = await res.json();
    ollama = {
      ok: true,
      models: (data.models ?? []).map((m: any) => ({ name: m.name, size: m.size, params: m.details?.parameter_size })),
    };
  } catch (e: any) {
    ollama = { ok: false, error: e.message };
  }
  return Response.json({
    host: OLLAMA_HOST,
    defaultModel: DEFAULT_MODEL,
    defaultProvider: DEFAULT_PROVIDER,
    groqConfigured: !!process.env.GROQ_API_KEY,
    ollama,
  });
}

export async function POST(req: Request) {
  const { messages, model, stream = false, temperature = 0.6, provider = DEFAULT_PROVIDER, profile } = await req.json();
  const chosen = model || DEFAULT_MODEL;
  // Adaptive personalization: the UI sends the learner's live progress,
  // so explanations, difficulty and practice match THIS learner.
  const p = profile ?? {};
  const profileBlock = p.level
    ? `\n\nLEARNER PROFILE (live, adapt to it): level=${p.level}, units done=${p.done ?? 0}/12, avg quiz score=${p.avg ?? "none yet"}%, current unit="${p.next ?? "unknown"}". If level is Beginner, use tiny steps and encouragement; Intermediate gets idioms + pitfalls; Advanced gets complexity trade-offs and system thinking. Suggest practice on the current unit.`
    : "";
  const withSystem = [{ role: "system", content: SYSTEM_PROMPT + profileBlock }, ...(messages ?? []).slice(-20)];

  const tryOllama = async (): Promise<Response> => {
    if (stream) {
      const upstream = await askOllama(chosen, withSystem, true, temperature);
      if (!upstream.body) throw new Error("No stream body");
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
              if (!line.trim()) continue;
              try {
                const j = JSON.parse(line);
                const piece = j.message?.content ?? "";
                if (piece) await writer.write(new TextEncoder().encode(piece));
                if (j.done) { await writer.close(); return; }
              } catch { /* partial line */ }
            }
          }
        } catch { /* client disconnect */ }
        try { await writer.close(); } catch { /* closed */ }
      })();
      return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Engine": `ollama:${chosen}` } });
    }
    const res = await askOllama(chosen, withSystem, false, temperature);
    const data = await res.json();
    const reply = data.message?.content?.trim();
    if (!reply) throw new Error("Empty reply from Ollama");
    return Response.json({
      reply,
      engine: `ollama:${chosen}`,
      eval: { eval_count: data.eval_count, eval_duration_ms: Math.round((data.eval_duration ?? 0) / 1e6) },
    });
  };

  // Explicit provider choice from Settings
  if (provider === "ollama") {
    try {
      return await tryOllama();
    } catch (e: any) {
      return Response.json({ reply: `Local Ollama not reachable at ${OLLAMA_HOST} (${e.message}). Start D:\\ollama\\START-OLLAMA.bat or switch to Cloud mode in Settings.`, engine: "mock", error: e.message });
    }
  }
  if (provider === "groq") {
    try {
      const reply = await askGroq(withSystem);
      return Response.json({ reply, engine: "groq:llama-3.3-70b" });
    } catch (e: any) {
      return Response.json({ reply: `Cloud engine unavailable (${e.message}). The app owner must set GROQ_API_KEY on the server — get a free key at console.groq.com.`, engine: "mock", error: e.message });
    }
  }

  // auto: local first, cloud fallback (best for owner + visitors)
  try {
    return await tryOllama();
  } catch (ollamaErr: any) {
    try {
      const reply = await askGroq(withSystem);
      return Response.json({ reply, engine: "groq:llama-3.3-70b", warning: `Local Ollama unavailable, answered by cloud: ${ollamaErr.message}` });
    } catch (groqErr: any) {
      const last = messages?.[messages.length - 1]?.content ?? "";
      return Response.json({
        reply: `No AI engine reachable.\n• Local: start Ollama (D:\\ollama\\START-OLLAMA.bat)\n• Cloud: owner sets GROQ_API_KEY (free at console.groq.com)\n\nMeanwhile, about "${String(last).slice(0, 80)}": floor division \`//\` rounds down — \`10 // 3 = 3\`.`,
        engine: "mock",
        error: `ollama: ${ollamaErr.message}; groq: ${groqErr.message}`,
      });
    }
  }
}
