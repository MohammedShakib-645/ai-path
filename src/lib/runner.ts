// runner.ts — the ONLY place user code executes.
//
// Python   -> Pyodide (CPython compiled to WebAssembly) in a Web Worker
// JavaScript -> plain Web Worker
// C / C++ / Java -> POST /api/run (server proxies to RUNNER_URL; never our own box)
//
// Guarantees: hard timeout by terminating the worker, 20 KB output cap,
// stdin support, no filesystem/process access, runtime load is cached per session.

export interface RunInput {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
  /** progress hook: "Loading Python runtime…" etc. */
  onStatus?: (msg: string) => void;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  engine: string;
}

const MAX_OUTPUT = 20 * 1024; // 20 KB
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";

/** session-wide flag so we only announce the runtime download once */
const runtimeLoaded: Record<string, boolean> = { python: false, javascript: false };

const WORKER_SRC = `
const MAX = ${MAX_OUTPUT};
const fmt = (v) => { if (typeof v === "string") return v; try { return JSON.stringify(v); } catch { return String(v); } };
self.onmessage = async (e) => {
  const { language, code, stdin } = e.data;
  const out = []; let bytes = 0; let truncated = false;
  const push = (s) => {
    if (truncated) return;
    const t = String(s);
    bytes += t.length + 1;
    if (bytes > MAX) { out.push("\\n... [output truncated at 20 KB]"); truncated = true; return; }
    out.push(t);
  };
  try {
    if (language === "python") {
      importScripts(${JSON.stringify(PYODIDE_URL)});
      self.postMessage({ type: "status", msg: "Loading Python runtime…" });
      const py = await loadPyodide({ stdin: (() => {
        const it = String(stdin || "").split("\\n")[Symbol.iterator]();
        return () => { const n = it.next(); if (n.done) throw new Error("EOF"); return n.value; };
      })() });
      py.setStdout({ batched: push });
      py.setStderr({ batched: push });
      self.postMessage({ type: "ready" });
      const r = await py.runPythonAsync(code);
      if (r !== undefined && r !== null) push(fmt(r));
      self.postMessage({ type: "done", ok: true, output: out.join("\\n") });
    } else {
      self.postMessage({ type: "ready" });
      const sh = { log: (...a) => push(a.map(fmt).join(" ")),
                   info: (...a) => push(a.map(fmt).join(" ")),
                   warn: (...a) => push(a.map(fmt).join(" ")),
                   error: (...a) => push(a.map(fmt).join(" ")) };
      const fn = new Function("console", "stdin", code);
      const ret = fn(sh, String(stdin || ""));
      if (ret && typeof ret.then === "function") await ret;
      if (ret !== undefined && ret !== null) push(fmt(ret));
      self.postMessage({ type: "done", ok: true, output: out.join("\\n") });
    }
  } catch (err) {
    const msg = (err && (err.stack || err.message)) || String(err);
    self.postMessage({ type: "done", ok: false, output: String(msg).replace(new RegExp(${JSON.stringify(PYODIDE_URL)}, "g"), "pyodide").slice(0, MAX) });
  }
};
`;

function runInWorker(language: "python" | "javascript", code: string, stdin: string, timeoutMs: number, onStatus?: (m: string) => void): Promise<RunResult> {
  const blob = new Blob([WORKER_SRC], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  let settled = false;
  let readyAt = 0;

  return new Promise<RunResult>((resolve) => {
    const done = (r: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(readyTimer);
      clearTimeout(runTimer);
      worker.terminate();
      URL.revokeObjectURL(url);
      runtimeLoaded[language] = true;
      resolve(r);
    };

    // runtime download (first Python run) — generous, it is a network fetch
    const readyTimer = setTimeout(
      () => done({ stdout: "", stderr: "Python runtime could not load — check your connection and retry.", exitCode: 1, timedOut: false, engine: language }),
      60000
    );
    let runTimer: ReturnType<typeof setTimeout> | undefined = undefined;

    worker.onmessage = (ev: MessageEvent) => {
      const d = ev.data;
      if (d.type === "status") {
        if (!runtimeLoaded[language]) onStatus?.(d.msg);
      } else if (d.type === "ready") {
        readyAt = Date.now();
        clearTimeout(readyTimer);
        runtimeLoaded[language] = true;
        onStatus?.("Running…");
        // hard execution budget, kill by terminating the worker
        runTimer = setTimeout(
          () => done({ stdout: "", stderr: `Time limit exceeded (${Math.round(timeoutMs / 1000)}s) — execution was killed by the sandbox.`, exitCode: 124, timedOut: true, engine: language }),
          timeoutMs
        );
      } else if (d.type === "done") {
        const text = String(d.output ?? "");
        const ms = readyAt ? (Date.now() - readyAt) / 1000 : 0;
        done({
          stdout: d.ok ? text : "",
          stderr: d.ok ? "" : text,
          exitCode: d.ok ? 0 : 1,
          timedOut: false,
          engine: `${language === "python" ? "pyodide (wasm)" : "js worker"}${ms ? ` ${ms.toFixed(1)}s` : ""}`,
        });
      }
    };
    worker.onerror = (e) =>
      done({ stdout: "", stderr: `Runtime error: ${e.message || "worker failed"}`, exitCode: 1, timedOut: false, engine: language });

    // hand the job to the worker — handlers must be attached before this
    worker.postMessage({ language, code, stdin });
  });
}

/** C / C++ / Java via our server proxy (server never executes code itself). */
async function runRemote(language: string, code: string, stdin: string, timeoutMs: number): Promise<RunResult> {
  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin, timeoutMs }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { stdout: "", stderr: j.error || `Runner unavailable (HTTP ${res.status})`, exitCode: 1, timedOut: false, engine: "remote" };
    }
    return {
      stdout: j.stdout ?? "",
      stderr: j.stderr ?? "",
      exitCode: Number(j.exitCode ?? 0),
      timedOut: !!j.timedOut,
      engine: j.engine || "remote sandbox",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout: "", stderr: `Runner unreachable: ${msg}`, exitCode: 1, timedOut: false, engine: "remote" };
  }
}

export const REMOTE_LANGUAGES = ["c", "cpp", "c++", "java", "csharp", "go", "rust", "php", "ruby", "kotlin", "swift", "bash", "haskell", "scala", "lua", "dart", "r", "perl", "typescript"];

export async function runCode(input: RunInput): Promise<RunResult> {
  const id = (input.language || "").toLowerCase();
  const stdin = input.stdin ?? "";
  const timeoutMs = Math.max(1000, Math.min(15000, input.timeoutMs ?? 5000));

  if (id.startsWith("py")) return runInWorker("python", input.code, stdin, timeoutMs, input.onStatus);
  if (id.startsWith("js")) return runInWorker("javascript", input.code, stdin, timeoutMs, input.onStatus);
  return runRemote(id === "c++" ? "cpp" : id, input.code, stdin, timeoutMs);
}

/** Languages available right now (remote ones only when RUNNER_URL is configured). */
export async function availableLanguages(): Promise<string[]> {
  const base = ["python", "javascript"];
  try {
    const r = await fetch("/api/run", { cache: "no-store" });
    const j = await r.json();
    if (Array.isArray(j.languages)) return [...base, ...j.languages];
  } catch { /* capability unknown -> local only */ }
  return base;
}
