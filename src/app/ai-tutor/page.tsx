"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, Bot, Copy, Check, RotateCcw, ArrowLeft, Cpu, Lightbulb, Plus, Search, Pin, Trash2, Pencil, Square, RefreshCw, Play, Bookmark, Paperclip } from "lucide-react";
import { toast } from "../../components/Toaster";
import { runCode as runSandbox } from "../../lib/runner";
import {
  useProgress, newChat, saveChat, deleteChat, toggleBookmark, logActivity,
} from "../../lib/store";
import { nextAction, tutorContext } from "../../lib/engine";
import { readAttachmentFiles, type Attachment } from "../../lib/attachments";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";

interface Msg { role: "user" | "assistant"; content: string; time?: string; engine?: string; ms?: number }

const MODES = [
  ["explain", "Explain"], ["teach", "Teach Me"], ["debug", "Debug Code"], ["review", "Code Review"],
  ["generate", "Generate Code"], ["practice", "Practice Me"], ["interview", "Interview Me"],
  ["exam", "Exam Prep"], ["mentor", "Project Mentor"], ["planner", "Study Planner"],
] as const;

const QUICK = [
  "Explain what I should learn next",
  "Why am I struggling? Check my weak topics",
  "Create a practice session for my weak topics",
  "Make me a study plan for today",
];

export default function AITutorPage() {
  const search = useSearchParams();
  const prog = useProgress();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string>("explain");
  const [pool, setPool] = useState({ groqKeys: 0, geminiKeys: 0 });
  const [online, setOnline] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [chatQ, setChatQ] = useState("");
  // file attachments (paste Ctrl+V or upload): images & PDFs go multimodal,
  // text files are inlined — data never touches localStorage history.
  const [atts, setAtts] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showChats, setShowChats] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [runOut, setRunOut] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ensure an active conversation exists
  useEffect(() => {
    const fromUrl = search.get("chat");
    if (fromUrl && prog.chats.some((c) => c.id === fromUrl)) {
      setActiveId(fromUrl);
      return;
    }
    if (!activeId || !prog.chats.some((c) => c.id === activeId)) {
      setActiveId(prog.chats[0]?.id ?? newChat(mode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prog.chats.length]);

  // deep links: ?topic= / ?note=
  useEffect(() => {
    const topic = search.get("topic");
    const noteId = search.get("note");
    if (topic) setInput(`Teach me ${topic} step by step`);
    else if (noteId) {
      const n = prog.notes.find((x) => x.id === noteId);
      if (n) setInput(`Explain my note "${n.title}": ${n.body.slice(0, 400)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/ai/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPool({ groqKeys: 0, geminiKeys: 0 }))
      .catch(() => {});
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setOnline(!!d.ok);
        setPool(d.pools ?? { groqKeys: 0, geminiKeys: 0 });
      })
      .catch(() => setOnline(false));
  }, []);

  const chat = prog.chats.find((c) => c.id === activeId) ?? prog.chats[0];
  const msgs: Msg[] = chat?.msgs ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, activeId]);

  const filteredChats = useMemo(() => {
    const f = prog.chats.filter((c) => !chatQ || c.title.toLowerCase().includes(chatQ.toLowerCase()) || c.msgs.some((m) => m.content.toLowerCase().includes(chatQ.toLowerCase())));
    return [...f].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [prog.chats, chatQ]);

  const addFiles = async (files: FileList | File[]) => {
    const { atts: got, errors } = await readAttachmentFiles(files);
    if (got.length) setAtts((a) => [...a, ...got]);
    for (const g of got) toast(`${g.name} attached ✓`, "info");
    for (const e of errors) toast(e, "err");
  };

  const send = async (text?: string, regen = false) => {
    const q = (text ?? input).trim();
    const pending = regen ? [] : atts;
    const markers = pending.map((a) => `[📎 ${a.name}]`).join(" ");
    const qFinal = [q, markers].filter(Boolean).join(" ").trim();
    if ((!q && !pending.length) || loading || !chat) return;
    setInput("");
    if (pending.length) setAtts([]);
    const t0 = Date.now();
    const base = regen ? msgs.filter((m, i) => !(i === msgs.length - 1 && m.role === "assistant")) : [...msgs, { role: "user" as const, content: qFinal, time: now() }];
    const history = (regen ? base : [...msgs, { role: "user" as const, content: qFinal, time: now() }]).map((m) => ({ role: m.role, content: m.content }));
    if (!regen) {
      const titled = chat.msgs.length === 0 ? (q || pending[0]?.name || "File").slice(0, 42) : chat.title;
      saveChat(chat.id, { msgs: [...chat.msgs, { role: "user", content: qFinal, time: now() }], title: titled, mode });
    } else {
      saveChat(chat.id, { msgs: base as any });
    }
    setLoading(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: chat.mode || mode,
          profile: tutorContext(prog),
          prefs: prog.prefs,
          messages: history,
          attachments: pending.map((a) => ({ name: a.name, mime: a.mime, kind: a.kind, data: a.data })),
        }),
        signal: ctl.signal,
      });
      const text = await res.text();
      let reply = text;
      let engine = "cloud";
      try {
        const j = JSON.parse(text);
        if (typeof j.reply === "string") {
          reply = j.reply;
          engine = j.engine ?? "cloud";
        }
      } catch { /* plain-text stream body */ }
      const cur = snapshot().chats.find((c: any) => c.id === chat.id);
      let baseMsgs = (cur?.msgs ?? []).filter((m: any, i: number, a: any[]) => !(regen && i === a.length - 1 && m.role === "assistant"));
      // App-executed chat actions: the AI's [ACT:...] tags run here for real.
      const actTag = reply.match(/\[ACT:(clear|delete-chat|rename:[^\]]*)\]/i);
      if (actTag) {
        const cmd = actTag[1].toLowerCase();
        if (cmd === "clear") {
          saveChat(chat.id, { msgs: [{ role: "assistant", content: "✅ Old messages deleted — fresh start. What next?", engine, time: now(), ms: Date.now() - t0 }], title: "New chat" });
          toast("Messages deleted ✓");
          return;
        }
        if (cmd === "delete-chat") {
          deleteChat(chat.id);
          setActiveId(newChat(mode));
          toast("Chat deleted ✓");
          return;
        }
        if (cmd.startsWith("rename:")) {
          const newTitle = actTag[1].slice(7).trim().slice(0, 60);
          if (newTitle) saveChat(chat.id, { title: newTitle });
        }
        reply = reply.replace(/\[ACT:[^\]]*\]/g, "").trim() || "Done ✓";
      }
      saveChat(chat.id, { msgs: [...baseMsgs, { role: "assistant", content: reply, engine, time: now(), ms: Date.now() - t0 }] });
      logActivity(`AI Tutor session (${modeLabel(chat.mode || mode)})`, `${history.length} messages`, "tutor");
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast("Stopped", "info");
      } else {
        const cur = snapshot().chats.find((c: any) => c.id === chat.id);
        saveChat(chat.id, { msgs: [...(cur?.msgs ?? []), { role: "assistant", content: `Request failed: ${e.message}. Your chat is saved — press Retry.`, engine: "mock", time: now() }] });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // fresh read to avoid stale closures
  const snapshot = () => {
    try {
      const raw = localStorage.getItem("ai-path-progress-v3") || localStorage.getItem("ai-path-progress-v2") || localStorage.getItem("ai-path-progress-v1") || "{}";
      const p = JSON.parse(raw);
      return { ...p, chats: Array.isArray(p.chats) ? p.chats : [] };
    } catch {
      return { chats: [] };
    }
  };

  const modeLabel = (m: string) => MODES.find(([id]) => id === m)?.[1] ?? m;

  const runCode = async (code: string, key: string) => {
    setRunOut((r) => ({ ...r, [key]: "Running in sandbox…" }));
    try {
      const r = await runSandbox({ language: "python", code, stdin: "", timeoutMs: 5000 });
      setRunOut((x) => ({ ...x, [key]: r.timedOut ? r.stderr : r.stdout || r.stderr || "(no output)" }));
    } catch (e: any) {
      setRunOut((x) => ({ ...x, [key]: `Run failed: ${e.message}` }));
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
        const key = `${i}-${k}`;
        return (
          <div key={k} className="my-2 rounded-xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 text-[10px] font-mono text-slate-500">
              <span>code</span>
              <span className="flex gap-2">
                <button onClick={() => runCode(code, key)} className="hover:text-green-600 flex items-center gap-1 font-semibold">
                  <Play className="w-3 h-3" /> run
                </button>
                <button onClick={() => copy(code, i * 100 + k)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
                  {copied === i * 100 + k ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} copy
                </button>
              </span>
            </div>
            <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-3 overflow-x-auto font-mono whitespace-pre">{code}</pre>
            {runOut[key] && <pre className="bg-green-50 text-green-900 text-[11px] p-3 font-mono whitespace-pre-wrap border-t border-green-100">{runOut[key]}</pre>}
          </div>
        );
      }
      return <div key={k} className="whitespace-pre-wrap">{p}</div>;
    });
  };

  const act = nextAction(prog);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1"><ArrowLeft className="w-6 h-6" /></Link>
          <div>
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">AI Tutor</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Knows your level, weak topics and history — adapts every answer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChats(!showChats)} className="xl:hidden px-3 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-bold">Chats</button>
          <SearchBox />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_3fr_1.2fr] gap-4">
        {/* conversations */}
        <div className={`card p-3 ${showChats ? "" : "hidden"} xl:block`}>
          <button onClick={() => { const id = newChat(mode); setActiveId(id); setShowChats(false); }} className="w-full py-2 rounded-xl primary-gradient text-white text-[12px] font-bold flex items-center justify-center gap-1.5 mb-2">
            <Plus className="w-4 h-4" /> New chat
          </button>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={chatQ} onChange={(e) => setChatQ(e.target.value)} placeholder="Search chats…" className="bg-transparent outline-none text-[12px] w-full" />
          </div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {filteredChats.length === 0 && <p className="text-[12px] text-slate-400 p-2">No saved conversations yet.</p>}
            {filteredChats.map((c) => (
              <div key={c.id} className={`rounded-xl px-2.5 py-2 cursor-pointer border ${c.id === chat?.id ? "border-indigo-300 bg-indigo-50/50" : "border-transparent hover:bg-slate-50"}`} onClick={() => { setActiveId(c.id); setShowChats(false); }}>
                <div className="flex items-center gap-1.5">
                  {c.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                  {renaming === c.id ? (
                    <input autoFocus defaultValue={c.title} onBlur={(e) => { saveChat(c.id, { title: e.target.value.slice(0, 60) || "Untitled" }); setRenaming(null); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} onClick={(e) => e.stopPropagation()} className="text-[12px] font-bold border rounded px-1 w-full outline-none" />
                  ) : (
                    <span className="text-[12px] font-bold text-slate-700 truncate flex-1">{c.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-slate-400">{modeLabel(c.mode)} • {c.msgs.length} msgs</span>
                  <span className="ml-auto flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setRenaming(c.id)} title="Rename" className="p-1 text-slate-400 hover:text-slate-700"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => saveChat(c.id, { pinned: !c.pinned })} title="Pin" className="p-1 text-slate-400 hover:text-amber-500"><Pin className="w-3 h-3" /></button>
                    <button onClick={() => { deleteChat(c.id); if (c.id === activeId) setActiveId(null); toast("Chat deleted"); }} title="Delete" className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* chat */}
        <div className="card p-0 overflow-hidden">
          <div className="hero-gradient px-4 py-3 text-white flex items-center gap-2 flex-wrap">
            <span className="w-9 h-9 rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-[18px] shrink-0">🤖</span>
            <select value={chat?.mode || mode} onChange={(e) => { setMode(e.target.value); if (chat) saveChat(chat.id, { mode: e.target.value }); }} className="bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-[12px] font-bold outline-none text-white [&>option]:text-slate-800">
              {MODES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <span className="text-[11px] text-white/85 hidden sm:inline">adapts to {prog.prefs.level} • {prog.done.length}/12 units</span>
            <span className="ml-auto flex gap-1.5">
              <button onClick={() => send(undefined, true)} disabled={loading || !msgs.length} title="Regenerate" className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center disabled:opacity-40"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (chat) { saveChat(chat.id, { msgs: [] }); toast("Conversation cleared"); } }} title="Clear chat" className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"><RotateCcw className="w-3.5 h-3.5" /></button>
            </span>
          </div>

          <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            {["Explain what I should learn next", "Why am I struggling?", "Quiz me on my weak topics"].map((x, i) => (
              <button key={i} onClick={() => send(x)} disabled={loading} className="text-[11px] font-medium bg-white border border-slate-200 rounded-full px-3 py-1.5 whitespace-nowrap hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50">{x}</button>
            ))}
          </div>

          <div className="h-[560px] overflow-y-auto p-4 space-y-4 bg-white">
            {msgs.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-12">
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-[28px] mb-2">🤖</div>
                <b className="text-slate-600">Start a {modeLabel(chat?.mode || mode).toLowerCase()} session</b>
                <p className="text-[12px] mt-1">I know your progress — just ask, paste code, or pick a suggestion.</p>
              </div>
            )}
            {msgs.map((m, i) => {
              const user = m.role === "user";
              return (
                <div key={i} className={`flex ${user ? "justify-end" : "justify-start"}`}>
                  {!user && <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[16px] shrink-0 mr-2">🤖</span>}
                  <div className={`pop-in max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed ${user ? "primary-gradient text-white rounded-br-md" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-md"}`}>
                    {user ? <div className="whitespace-pre-wrap">{m.content}</div> : renderBody(m.content, i)}
                    {!user && m.content !== "" && (
                      <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400 gap-2">
                        <span className="font-mono">{m.engine ?? "ai"}{m.ms ? ` · ${(m.ms / 1000).toFixed(1)}s` : ""}</span>
                        <span className="flex gap-2">
                          <button onClick={() => copy(m.content, i)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">{copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} Copy</button>
                          <button onClick={() => { toggleBookmark("answer", `${chat?.id}-${i}`, (chat?.title || "Answer"), m.content.slice(0, 120)); toast("Answer bookmarked ✓"); }} className="hover:text-amber-500 flex items-center gap-1 font-semibold"><Bookmark className="w-3 h-3" /> Save</button>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && <div className="text-[12px] text-slate-400">AI Tutor is thinking…</div>}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            {atts.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-2 px-1">
                {atts.map((a, i) => (
                  <span key={i} className="pop-in flex items-center gap-1.5 text-[10.5px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full pl-1.5 pr-1 py-1 max-w-[190px]">
                    {a.preview ? <img src={a.preview} alt="" className="w-4 h-4 rounded object-cover shrink-0" /> : <span className="shrink-0">📄</span>}
                    <span className="truncate">{a.name}</span>
                    <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAtts((x) => x.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center text-indigo-500 shrink-0">×</button>
                  </span>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1.5 pr-1.5 py-1.5">
              <button type="button" aria-label="Attach a file" onClick={() => fileRef.current?.click()} disabled={loading} title="Upload image / PDF / text" className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 hover:-translate-y-0.5 transition disabled:opacity-50 shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={(e) => {
                  const files: File[] = [];
                  for (const it of Array.from(e.clipboardData?.items ?? [])) {
                    if (it.kind === "file") {
                      const f = it.getAsFile();
                      if (f) files.push(f);
                    }
                  }
                  if (files.length) {
                    e.preventDefault();
                    addFiles(files);
                  }
                }}
                placeholder="Ask anything — text, code, images (Ctrl+V) or a file…"
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-400"
              />
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.py"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {loading ? (
                <button type="button" onClick={() => abortRef.current?.abort()} title="Stop" className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"><Square className="w-4 h-4" /></button>
              ) : (
                <button aria-label="Send message" disabled={!input.trim() && atts.length === 0} className="w-10 h-10 rounded-full primary-gradient text-white flex items-center justify-center disabled:opacity-50 shrink-0 hover:scale-105 active:scale-95 transition"><Send className="w-4 h-4" /></button>
              )}
            </form>
          </div>
        </div>

        {/* right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-2">🎯 {act.kind === "start" ? "Get Started" : "Recommended Next"}</h3>
            <b className="text-[13px]">{act.title}</b>
            <p className="text-[12px] text-slate-500 mt-0.5">{act.why}</p>
            <Link href={act.href} className="mt-2 inline-block bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg">{act.cta} →</Link>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-2">⚡ Engine</h3>
            <div className={`text-[12px] font-bold px-3 py-2 rounded-xl ${online ? "bg-green-50 text-green-700" : online === false ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>
              {online === null ? "Checking…" : online ? `Cloud ready (${pool.groqKeys} Groq + ${pool.geminiKeys} Gemini keys)` : "AI not configured — add keys in Vercel env"}
            </div>
            <p className="text-[11px] text-slate-400">Answers stream from the cloud key pool — free for you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
