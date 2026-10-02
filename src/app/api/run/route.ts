// POST /api/run — remote code execution proxy (30+ languages).
// Our server NEVER runs the code: it forwards to a Piston-compatible engine.
//   • RUNNER_URL (+ optional RUNNER_KEY) → your own/self-hosted instance
//   • otherwise → the public Piston cloud (emkc.org, free, no key)
// Python and JS do not come here at all — they run in the learner's browser (src/lib/runner.ts).
//
// GET  /api/run -> { languages: [...] }  (engine runtimes, cached 10 min)
// POST /api/run -> { stdout, stderr, exitCode, timedOut, engine }

const PUBLIC_PISTON = "https://emkc.org/api/v2/piston";
const MAX_CODE = 20 * 1024;
const MAX_STDIN = 4 * 1024;
const RATE_LIMIT = 20; // requests / minute / IP  (in-memory: serverless needs KV — see guard.ts)

/** common spellings → Piston runtime names */
const ALIASES: Record<string, string> = {
  "c++": "cpp",
  "cc": "cpp",
  "cxx": "cpp",
  "g++": "cpp",
  "c#": "csharp",
  "cs": "csharp",
  "dotnet": "csharp",
  "js": "javascript",
  "node": "javascript",
  "ts": "typescript",
  "py": "python",
  "python3": "python",
  "golang": "go",
  "rb": "ruby",
  "sh": "bash",
  "shell": "bash",
  "rscript": "r",
  "kt": "kotlin",
  "rs": "rust",
  "pl": "perl",
  "pascal": "freebasic",
};

interface Runtime {
  language: string;
  version: string;
  aliases?: string[];
}

let rtCache: { at: number; list: Runtime[] } | null = null;

/** Engine runtimes (10-minute server-side cache; honest [] on failure). */
async function runtimes(): Promise<Runtime[]> {
  if (rtCache && Date.now() - rtCache.at < 10 * 60_000) return rtCache.list;
  const base = (process.env.RUNNER_URL || PUBLIC_PISTON).replace(/\/$/, "");
  try {
    const headers: Record<string, string> = {};
    if (process.env.RUNNER_KEY) headers.Authorization = `Bearer ${process.env.RUNNER_KEY}`;
    const res = await fetch(`${base}/runtimes`, { headers, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as Runtime[];
    if (!Array.isArray(j) || !j.length) throw new Error("empty runtimes");
    rtCache = { at: Date.now(), list: j };
    return j;
  } catch {
    return rtCache?.list ?? [];
  }
}

/** resolve a user language id to a concrete runtime (name + version). */
function resolve(language: string, list: Runtime[]): Runtime | null {
  const id = (language || "").toLowerCase().trim();
  const target = ALIASES[id] ?? id;
  const exact = list.filter((r) => r.language === target);
  if (exact.length) return exact[exact.length - 1]; // last = newest when several exist
  return list.find((r) => (r.aliases ?? []).some((a) => a.toLowerCase() === target)) ?? null;
}

const hits = new Map<string, { n: number; t: number }>();

function ipOf(req: Request): string {
  return (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local").split(",")[0].trim();
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > 60000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > RATE_LIMIT;
}

export async function GET() {
  const list = await runtimes();
  return Response.json({ languages: list.map((r) => r.language) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && !origin.endsWith(host)) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const ip = ipOf(req);
  if (rateLimit(ip)) {
    return Response.json({ error: "Too many runs — wait a minute." }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const raw = await req.text();
  if (raw.length > 64 * 1024) return Response.json({ error: "Request too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const language = String(body.language ?? "").toLowerCase();
  const code = String(body.code ?? "");
  const stdin = String(body.stdin ?? "");
  const timeoutMs = Math.max(1000, Math.min(15000, Number(body.timeoutMs) || 5000));

  if (!language) return Response.json({ error: "No language given" }, { status: 400 });
  if (!code.trim()) return Response.json({ error: "Empty code" }, { status: 400 });
  if (code.length > MAX_CODE) return Response.json({ error: "Code exceeds 20 KB" }, { status: 413 });
  if (stdin.length > MAX_STDIN) return Response.json({ error: "stdin exceeds 4 KB" }, { status: 413 });

  const list = await runtimes();
  if (!list.length) {
    return Response.json(
      { error: "Cloud compiler is unreachable right now — Python and JavaScript still run locally in your browser." },
      { status: 503 }
    );
  }

  const rt = resolve(language, list);
  if (!rt) {
    const sample = list.slice(0, 12).map((r) => r.language).join(", ");
    return Response.json(
      { error: `Language "${language}" isn't available on this runner. Try one of: ${sample}…` },
      { status: 400 }
    );
  }

  const base = (process.env.RUNNER_URL || PUBLIC_PISTON).replace(/\/$/, "");
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.RUNNER_KEY) headers.Authorization = `Bearer ${process.env.RUNNER_KEY}`;

    const res = await fetch(`${base}/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        language: rt.language,
        version: rt.version,
        files: [{ content: code }],
        stdin,
        run_timeout: timeoutMs,
        compile_timeout: timeoutMs,
      }),
      signal: AbortSignal.timeout(timeoutMs + 8000),
    });
    if (res.status === 429) {
      return Response.json({ error: "The cloud compiler is busy — wait a few seconds and run again." }, { status: 429, headers: { "Retry-After": "10" } });
    }
    if (!res.ok) {
      return Response.json({ error: `Runner HTTP ${res.status}` }, { status: 502 });
    }
    const j = await res.json();
    return Response.json({
      stdout: j.run?.stdout ?? "",
      stderr: j.compile?.stderr || j.run?.stderr || "",
      exitCode: Number(j.run?.code ?? 0),
      timedOut: !!j.run?.timeout || String(j.run?.signal ?? "") === "SIGKILL" || Number(j.run?.code ?? 0) === 124,
      engine: `${rt.language}@${rt.version} · ${process.env.RUNNER_URL ? "self-hosted runner" : "piston cloud"}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `Compiler unreachable: ${msg}` }, { status: 502 });
  }
}
