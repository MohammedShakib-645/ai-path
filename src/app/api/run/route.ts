// POST /api/run — remote code execution proxy (30+ real compilers).
// Our server NEVER runs the code: it forwards to a public compile engine.
//   • Wandbox (wandbox.org) — free, no key — default for 30+ languages
//   • RUNNER_URL (+ optional RUNNER_KEY) — your own Piston-compatible instance
// Python/JS/TS run in the learner's browser instead (see src/lib/runner.ts).
//
// GET  /api/run -> { languages: [...] }  (engine list, cached 10 min)
// POST /api/run -> { stdout, stderr, exitCode, timedOut, engine }

const PUBLIC_BASE = "https://wandbox.org/api";
const MAX_CODE = 20 * 1024;
const MAX_STDIN = 4 * 1024;
const RATE_LIMIT = 40; // requests / minute / IP

/** Normalize any spelling (ours or Wandbox's) to one canonical id. */
function canon(s: string): string {
  const x = (s || "").toLowerCase().replace(/[^a-z0-9+#]/g, "");
  if (x === "c++" || x === "cpp") return "cpp";
  if (x === "c#" || x === "csharp") return "csharp";
  if (x === "bash" || x === "bashscript" || x === "sh" || x === "shell") return "bash";
  if (x === "javascript" || x === "js" || x === "node") return "javascript";
  if (x === "typescript" || x === "ts") return "typescript";
  if (x === "python" || x === "py") return "python";
  if (x === "golang" || x === "go") return "go";
  if (x === "ruby" || x === "rb") return "ruby";
  if (x === "rscript" || x === "rlang") return "r";
  if (x === "perl" || x === "pl") return "perl";
  if (x === "kotlin" || x === "kt") return "kotlin";
  if (x === "dart") return "dart";
  return x;
}

/** preferred compiler name fragments per canonical language (first match wins).
 *  Ordered stable-first so nightly "head" builds lose to released versions. */
const PREFER: Record<string, string[]> = {
  c: ["gcc-13", "gcc-12", "gcc-11", "gcc"],
  cpp: ["g++-13", "g++-12", "g++", "gcc-13", "gcc-12", "gcc"],
  java: ["openjdk", "jdk", "javac"],
  go: ["go-1", "go"],
  rust: ["rust-1", "rustc", "rust"],
  csharp: ["mono", "dotnet"],
  php: ["php-8", "php"],
  ruby: ["ruby-4", "ruby-3", "ruby"],
  typescript: ["typescript"],
  javascript: ["node"],
  haskell: ["ghc"],
  scala: ["scala-2.13", "scala-3.3", "scala"],
  lua: ["lua"],
  r: ["r-"],
  perl: ["perl"],
  bash: ["bash"],
  python: ["python"],
};

interface WandCompiler {
  name: string;
  language: string;
  "display-name"?: string;
}

let listCache: { at: number; list: WandCompiler[] } | null = null;

async function compilers(): Promise<WandCompiler[]> {
  if (listCache && Date.now() - listCache.at < 10 * 60_000) return listCache.list;
  try {
    const res = await fetch(`${PUBLIC_BASE}/list.json`, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as WandCompiler[];
    if (!Array.isArray(j) || !j.length) throw new Error("empty list");
    listCache = { at: Date.now(), list: j };
    return j;
  } catch {
    return listCache?.list ?? [];
  }
}

function pickCompiler(id: string, list: WandCompiler[]): WandCompiler | null {
  const candidates = list.filter((c) => canon(c.language) === id);
  if (!candidates.length) return null;
  for (const pat of PREFER[id] ?? []) {
    const hit = candidates.find((c) => c.name.toLowerCase().includes(pat));
    if (hit) return hit;
  }
  return candidates[0];
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
  const list = await compilers();
  const ids = [...new Set(list.map((c) => canon(c.language)))];
  return Response.json({ languages: ids });
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

  const id = canon(language);

  // ── self-hosted Piston-compatible runner (optional) ──────────────────────
  const own = process.env.RUNNER_URL?.replace(/\/$/, "");
  if (own) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.RUNNER_KEY) headers.Authorization = `Bearer ${process.env.RUNNER_KEY}`;
      const res = await fetch(`${own}/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ language: id, version: "*", files: [{ content: code }], stdin, run_timeout: timeoutMs }),
        signal: AbortSignal.timeout(timeoutMs + 8000),
      });
      if (!res.ok) return Response.json({ error: `Runner HTTP ${res.status}` }, { status: 502 });
      const j = await res.json();
      return Response.json({
        stdout: j.run?.stdout ?? "",
        stderr: j.run?.stderr ?? "",
        exitCode: Number(j.run?.code ?? 0),
        timedOut: !!j.run?.timeout || Number(j.run?.code ?? 0) === 124,
        engine: `${language}@${j.language?.version ?? "self-hosted"}`,
      });
    } catch (e) {
      return Response.json({ error: `Runner unreachable: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
    }
  }

  // ── Wandbox (public, free) ───────────────────────────────────────────────
  const list = await compilers();
  if (!list.length) {
    return Response.json(
      { error: "Cloud compiler is unreachable right now — Python and JavaScript still run locally in your browser." },
      { status: 503 }
    );
  }
  const comp = pickCompiler(id, list);
  if (!comp) {
    const sample = [...new Set(list.map((c) => canon(c.language)))].slice(0, 14).join(", ");
    return Response.json({ error: `Language "${language}" isn't available on this runner. Try one of: ${sample}…` }, { status: 400 });
  }

  try {
    const res = await fetch(`${PUBLIC_BASE}/compile.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compiler: comp.name, code, stdin }),
      signal: AbortSignal.timeout(timeoutMs + 30000), // compile (JVM langs ~25s) + run
    });
    if (res.status === 429 || res.status === 503) {
      return Response.json({ error: "The cloud compiler is busy — wait a few seconds and run again." }, { status: 429, headers: { "Retry-After": "10" } });
    }
    if (!res.ok) {
      return Response.json({ error: `Compiler service error (HTTP ${res.status}) — try again shortly.` }, { status: 502 });
    }
    const j = await res.json();
    const stdout = String(j.program_output ?? "");
    const stderr = [String(j.compiler_error ?? ""), String(j.program_error ?? "")]
      .filter(Boolean)
      .join("");
    const signal = String(j.signal ?? "");
    const ok = String(j.status) === "0";
    return Response.json({
      stdout,
      stderr,
      exitCode: ok ? 0 : 1,
      timedOut: signal === "SIGKILL" || signal === "SIGXCPU",
      engine: `${comp.name} · ${process.env.RUNNER_URL ? "self-hosted" : "wandbox"}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timedOut = msg.includes("timeout") || msg.includes("abort");
    return Response.json(
      { error: timedOut ? `The compiler took too long (over ~${Math.round((timeoutMs + 30000) / 1000)}s) — heavy languages like Scala/Java can be slow to compile. Try again.` : `Compiler unreachable: ${msg}` },
      { status: timedOut ? 408 : 502 }
    );
  }
}
