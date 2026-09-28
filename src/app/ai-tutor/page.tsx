"use client";
import { useState, useRef, useEffect } from "react";
import TopHeader from "../../components/TopHeader";
import {
  Terminal, Send, RotateCcw, Copy, Check,
  ShieldCheck, Cpu, Zap, MessageSquarePlus,
} from "lucide-react";
import { useProgress, learnerLevel, completionPct, avgScore, nextUnit } from "../../lib/store";

interface Msg { role: "user" | "assistant"; content: string; time?: string; engine?: string; ms?: number }
interface OllamaModel { name: string; size: number; params?: string }

const QUICK = [
  "Explain Python lists vs tuples with examples",
  "What is floor division // vs normal division?",
  "Debug: why do I get IndexError in a while loop?",
  "Give me a 3-line quiz on functions",
];
const LS_KEY = "ai-path-tutor-history-v1";

function fmtBytes(n?: number) {
  if (!n) return "";
  return n > 1e9 ? `${(n / 1e9).toFixed(1)}GB` : `${Math.round(n / 1e6)}MB`;
}

export default function AITutorPage() {
  // Deterministic initial render (must match server) — stored history
  // loads right after mount to avoid hydration mismatch.
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: "assistant",
    content: "Ollama tutor ready. I run 100% locally on your best text model. Ask Python, paste code, or pick a quick topic above.",
    time: "Session ready",
  }]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setMsgs(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState(process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "llama3.1:latest");
  const [provider, setProvider] = useState<"auto" | "groq" | "ollama">("auto");
  useEffect(() => {
    try {
      const p = localStorage.getItem("ai-path-provider");
      if (p === "groq" || p === "ollama") setProvider(p);
    } catch { /* ignore */ }
  }, []);
  const [online, setOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prog = useProgress();
  const profile = {
    level: learnerLevel(prog),
    done: prog.done.length,
    avg: prog.attempts.length ? avgScore(prog) : null,
    next: (() => { const u = nextUnit(prog); return `Unit ${u.id}: ${u.title}`; })(),
  };

  // Load model list + health
  useEffect(() => {
    fetch("/api/chat", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const ok = !!d.ollama?.ok;
        const list: OllamaModel[] = d.ollama?.models ?? [];
        setOnline(ok);
        setModels(list);
        if (ok && list.length && !list.some((m) => m.name === model)) {
          const pref = list.find((m) => m.name.startsWith("llama3.1"))
            ?? list.find((m) => m.name.startsWith("qwen2.5:7b"))
            ?? list[0];
          setModel(pref.name);
        }
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(msgs.slice(-50))); } catch { /* quota */ }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const t0 = Date.now();
    const userMsg: Msg = { role: "user", content: q, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const history = [...msgs, userMsg].map(m => ({ role: m.role, content: m.content }));
    setMsgs(m => [...m, userMsg]);
    setLoading(true);

    try {
      if (streaming) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, model, stream: true, provider, profile }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        setMsgs(m => [...m, { role: "assistant", content: "", engine: `ollama:${model}`, time: "typing…" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const snap = acc;
          setMsgs(m => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: snap }; return c; });
        }
        const ms = Date.now() - t0;
        setLatency(ms);
        setMsgs(m => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ms }; return c; });
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, model, stream: false, provider, profile }),
        });
        const data = await res.json();
        const ms = Date.now() - t0;
        setLatency(ms);
        setMsgs(m => [...m, {
          role: "assistant",
          content: data.reply ?? "(empty reply)",
          engine: data.engine, ms,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (e: any) {
      setMsgs(m => [...m, { role: "assistant", content: `Request failed: ${e.message}. Is Ollama running? Start D:\\ollama\\START-OLLAMA.bat`, time: "error" }]);
    } finally {
      setLoading(false);
    }
  };

  const copy = (t: string, i: number) => {
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  // Render fenced code blocks with a copy button
  const renderBody = (text: string, i: number) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((p, k) => {
      if (p.startsWith("```")) {
        const code = p.replace(/^```\w*\n?/, "").replace(/```$/, "");
        return (
          <div key={k} className="my-2 rounded-md overflow-hidden border border-slate-700">
            <div className="flex justify-between items-center px-2.5 py-1 bg-slate-800 text-[10px] font-mono text-slate-300">
              <span>python</span>
              <button onClick={() => copy(code, i * 100 + k)} className="hover:text-white flex items-center gap-1">
                {copied === i * 100 + k ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} copy
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-100 text-[12px] p-3 overflow-x-auto font-mono whitespace-pre">{code}</pre>
          </div>
        );
      }
      return <div key={k} className="whitespace-pre-wrap">{p}</div>;
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <TopHeader title="AI Tutor — Local Ollama" subtitle="Real answers from your own machine. No cloud, no cost." />

      <div className="pro-card overflow-hidden flex flex-col h-[760px]">
        {/* status bar */}
        <div className="px-5 py-3 bg-slate-900 text-slate-300 flex items-center justify-between border-b border-slate-800 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-mono font-bold text-white text-[13px]"><Terminal className="w-4 h-4 text-emerald-400" /> Local Tutor</span>
            <span className="px-2 py-0.5 rounded bg-blue-600/40 border border-blue-500/40 text-blue-200 font-mono text-[11px] font-bold" title="Auto level from your real progress — unlocks harder quizzes">
              {profile.level} · {completionPct(prog)}%
            </span>
            <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${online === false ? "text-red-400" : online ? "text-emerald-400" : "text-slate-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${online === false ? "bg-red-500" : online ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
              {online === null ? "checking…" : online ? "ollama online" : "ollama offline"}
            </span>
            {latency !== null && <span className="font-mono text-[11px] text-slate-400">last: {(latency / 1000).toFixed(1)}s</span>}
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={provider}
              onChange={e => { setProvider(e.target.value as any); try { localStorage.setItem("ai-path-provider", e.target.value); } catch { /* ignore */ } }}
              title="AI engine: cloud works for everyone, local only on this PC"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[12px] font-mono text-emerald-300 outline-none"
            >
              <option value="auto">auto</option>
              <option value="groq">cloud</option>
              <option value="ollama">local</option>
            </select>
            <select value={model} onChange={e => setModel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[12px] font-mono text-white outline-none max-w-[240px]">
              {models.length === 0 && <option value={model}>{model}</option>}
              {models.map(m => <option key={m.name} value={m.name}>{m.name} {m.params ? `· ${m.params}` : ""} {fmtBytes(m.size) ? `· ${fmtBytes(m.size)}` : ""}</option>)}
            </select>
            <label className="flex items-center gap-1 text-[11px] font-mono text-slate-300 cursor-pointer">
              <input type="checkbox" checked={streaming} onChange={e => setStreaming(e.target.checked)} className="accent-emerald-500" /> stream
            </label>
            <button onClick={() => { setMsgs([]); localStorage.removeItem(LS_KEY); }} className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-semibold text-[11px] flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* quick prompts */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1"><Zap className="w-3 h-3" /> Try:</span>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-xs whitespace-nowrap disabled:opacity-50">{q}</button>
          ))}
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          {msgs.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-16">
              <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              History cleared. Ask anything to start a new session.
            </div>
          )}
          {msgs.map((m, i) => {
            const user = m.role === "user";
            return (
              <div key={i} className={`flex gap-3 max-w-3xl ${user ? "ml-auto justify-end" : "mr-auto"}`}>
                {!user && <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-white font-mono font-bold text-xs shrink-0 mt-0.5">AI</div>}
                <div className="max-w-[85%] space-y-1">
                  <div className={`rounded-lg p-4 text-[13px] leading-relaxed border ${user ? "bg-slate-900 text-white border-slate-800" : "bg-slate-50/70 border-slate-200 text-slate-800"}`}>
                    {user ? <div className="whitespace-pre-wrap">{m.content}</div> : renderBody(m.content, i)}
                    {!user && (
                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {m.engine ?? "local"} {m.ms ? `· ${(m.ms / 1000).toFixed(1)}s` : ""}</span>
                        <button onClick={() => copy(m.content, i)} className="hover:text-slate-900 flex items-center gap-1 font-semibold">
                          {copied === i ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] text-slate-400 font-mono px-1 ${user ? "text-right" : ""}`}>{m.time}</div>
                </div>
                {user && <div className="w-8 h-8 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">MS</div>}
              </div>
            );
          })}
          {loading && <div className="font-mono text-xs text-slate-500">▊ generating with {model}…</div>}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2 bg-white border border-slate-300 rounded-md p-1 focus-within:ring-1 focus-within:ring-emerald-600">
            <span className="font-mono text-slate-400 pl-3 text-xs">&gt;</span>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask ${model} — Python, code, errors…`} disabled={loading}
              className="flex-1 px-2 py-2 text-sm bg-transparent outline-none placeholder:text-slate-400" />
            <button disabled={!input.trim() || loading} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40">
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex justify-between px-1 pt-2 text-[11px] text-slate-500 font-mono">
            <span>History saved on this device · {msgs.length} msgs</span>
            <span>Enter ↵ to send · served by Ollama, private to you</span>
          </div>
        </div>
      </div>
    </div>
  );
}
