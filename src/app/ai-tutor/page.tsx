"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Bot, Copy, Check, RotateCcw, ArrowLeft, Search, Cpu, Lightbulb } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { useProgress, learnerLevel, completionInt, avgScore, nextUnit } from "../../lib/store";

interface Msg { role: "user" | "assistant"; content: string; time?: string; engine?: string; ms?: number }
interface OllamaModel { name: string; size: number; params?: string }

const QUICK = [
  "Explain Python lists vs tuples with examples",
  "What is floor division // vs normal division?",
  "Why do I get IndexError in a while loop?",
  "Give me a 3-line quiz on functions",
];
const LS_KEY = "ai-path-tutor-history-v1";

function fmtBytes(n?: number) {
  if (!n) return "";
  return n > 1e9 ? `${(n / 1e9).toFixed(1)}GB` : `${Math.round(n / 1e6)}MB`;
}

export default function AITutorPage() {
  const [msgs, setMsgs] = useState<Msg[]>( [{
    role: "assistant",
    content: "Hi Mohammed! 👋 I'm your AI Learning Companion. Ask me anything about Python, AI/ML, or your learning path.",
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
  const [model, setModel] = useState(process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "gemma3:4b");
  const [provider, setProvider] = useState<"auto" | "groq" | "ollama">("auto");
  useEffect(() => {
    try {
      const p = localStorage.getItem("ai-path-provider");
      if (p === "groq" || p === "ollama") setProvider(p);
    } catch { /* ignore */ }
  }, []);
  const [online, setOnline] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const prog = useProgress();
  const profile = {
    level: learnerLevel(prog),
    done: prog.done.length,
    avg: prog.attempts.length ? avgScore(prog) : null,
    next: (() => { const u = nextUnit(prog); return `Unit ${u.id}: ${u.title}`; })(),
  };

  useEffect(() => {
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const ok = !!d.ollama?.ok;
        const list: OllamaModel[] = d.ollama?.models ?? [];
        setOnline(ok);
        setModels(list);
        if (ok && list.length && !list.some((m) => m.name === model)) {
          const pref = list.find((m) => m.name.startsWith("gemma3:4b")) ?? list.find((m) => m.name.startsWith("qwen3:8b")) ?? list.find((m) => m.name.startsWith("llama3.1")) ?? list[0];
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
    const history = [...msgs, userMsg].map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, userMsg]);
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
        setMsgs((m) => [...m, { role: "assistant", content: "", engine: `ollama:${model}`, time: "typing…" }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const snap = acc;
          setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: snap }; return c; });
        }
        const ms = Date.now() - t0;
        setMsgs((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ms }; return c; });
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, model, stream: false, provider, profile }),
        });
        const data = await res.json();
        const ms = Date.now() - t0;
        setMsgs((m) => [...m, {
          role: "assistant", content: data.reply ?? "(empty reply)", engine: data.engine, ms,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `Request failed: ${e.message}.`, time: "error" }]);
    } finally {
      setLoading(false);
    }
  };

  const copy = (t: string, i: number) => {
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const renderBody = (text: string, i: number) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((p, k) => {
      if (p.startsWith("```")) {
        const code = p.replace(/^```\w*\n?/, "").replace(/```$/, "");
        return (
          <div key={k} className="my-2 rounded-xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 text-[10px] font-mono text-slate-500">
              <span>python</span>
              <button onClick={() => copy(code, i * 100 + k)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
                {copied === i * 100 + k ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} copy
              </button>
            </div>
            <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-3 overflow-x-auto font-mono whitespace-pre">{code}</pre>
          </div>
        );
      }
      return <div key={k} className="whitespace-pre-wrap">{p}</div>;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">AI Tutor</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Get instant help & explanations — adapts to your {profile.level} level</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2.5 w-[300px] shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input placeholder="Search topics, concepts, or ask anything..." className="outline-none text-[13px] w-full bg-transparent" />
          </div>
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
            <div className="hidden lg:block">
              <div className="text-[13px] font-bold text-[#101a3f]">Mohammed Shakib</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {profile.level}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="card p-0 overflow-hidden">
          {/* Engine bar */}
          <div className="hero-gradient px-5 py-3.5 text-white flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-full bg-white/25 border border-white/30 flex items-center justify-center"><Bot className="w-6 h-6" /></span>
              <div>
                <div className="font-extrabold text-[15px]">AI Learning Companion</div>
                <div className="text-[11px] text-white/85 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${online === false ? "bg-red-300" : online ? "bg-green-300" : "bg-white/60"}`} />
                  {online === null ? "checking…" : online ? `${completionInt(prog)}% complete · adapts to you` : "answering via cloud"}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setMsgs([]); try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }}
              className="text-[11px] font-bold bg-white/20 hover:bg-white/30 border border-white/30 rounded-full px-3 py-1.5 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>

          {/* Quick prompts */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            {QUICK.map((x, i) => (
              <button key={i} onClick={() => send(x)} disabled={loading} className="text-[11px] font-medium bg-white border border-slate-200 rounded-full px-3 py-1.5 whitespace-nowrap hover:border-indigo-300 disabled:opacity-50">
                {x}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="h-[420px] overflow-y-auto p-5 space-y-4 bg-white">
            {msgs.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-14">
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-[28px] mb-2">🤖</div>
                History cleared. Ask anything to start a new session.
              </div>
            )}
            {msgs.map((m, i) => {
              const user = m.role === "user";
              return (
                <div key={i} className={`flex ${user ? "justify-end" : "justify-start"}`}>
                  {!user && <span className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[18px] shrink-0 mr-2">🤖</span>}
                  <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${user ? "primary-gradient text-white rounded-br-md" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-md"}`}>
                    {user ? <div className="whitespace-pre-wrap">{m.content}</div> : renderBody(m.content, i)}
                    {!user && m.content !== "" && (
                      <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">{m.engine ?? "ai"} {m.ms ? `· ${(m.ms / 1000).toFixed(1)}s` : ""}</span>
                        <button onClick={() => copy(m.content, i)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
                          {copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && <div className="text-[12px] text-slate-400 flex items-center gap-2"><span className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[18px]">🤖</span> thinking…</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-indigo-400">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Python, loops, functions…"
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 placeholder:text-slate-400"
              />
              <button disabled={!input.trim() || loading} aria-label="Send message" className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center disabled:opacity-50 shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><Cpu className="w-4 h-4" /> AI Engine</h3>
            <label className="text-[11px] font-semibold text-slate-500">Answer source</label>
            <select
              value={provider}
              onChange={(e) => { setProvider(e.target.value as any); try { localStorage.setItem("ai-path-provider", e.target.value); } catch { /* ignore */ } }}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-white outline-none focus:border-indigo-400"
            >
              <option value="auto">Auto — local first, cloud fallback</option>
              <option value="groq">Cloud — works for everyone</option>
              <option value="ollama">Local Ollama — this PC only</option>
            </select>
            <label className="text-[11px] font-semibold text-slate-500 mt-3 block">Local model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] bg-white outline-none font-mono focus:border-indigo-400">
              {models.length === 0 && <option value={model}>{model}</option>}
              {models.map((m) => <option key={m.name} value={m.name}>{m.name}{m.params ? ` · ${m.params}` : ""}{fmtBytes(m.size) ? ` · ${fmtBytes(m.size)}` : ""}</option>)}
            </select>
            <label className="flex items-center gap-2 mt-3 text-[12px] text-slate-600 cursor-pointer">
              <input type="checkbox" checked={streaming} onChange={(e) => setStreaming(e.target.checked)} className="accent-indigo-600" /> Stream answers live
            </label>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">💡 Quick Tip</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              I can see you&apos;re at <b>{profile.level}</b> level on <b>{profile.next}</b>. Ask for an explanation, an example, or a mini-quiz — I adjust to you.
            </p>
          </div>

          <div className="card p-4 flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-[26px] shrink-0">🤖</span>
            <div>
              <b className="text-[13px] text-[#101a3f] flex items-center gap-1">You&apos;re doing great! <Lightbulb className="w-3.5 h-3.5 text-amber-400" /></b>
              <p className="text-[11px] text-slate-500">Every question helps you get better at AI and Python.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
