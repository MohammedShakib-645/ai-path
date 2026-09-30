"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Send, X, Maximize2, Minimize2, Eye, EyeOff, Sparkles, ClipboardList, Loader2, Paperclip } from "lucide-react";
import { useProgress, logActivity } from "../lib/store";
import { tutorContext, weakTopics, nextAction } from "../lib/engine";
import { readAttachmentFiles, type Attachment } from "../lib/attachments";
import { toast } from "./Toaster";

interface M { role: "user" | "assistant"; content: string }

const CHIPS = ["Open quizzes", "What should I learn next?", "Quiz me"];

const TASKS = [  { id: "next", icon: "🎯", label: "Tell my next step", prompt: "Look at my progress and tell me the ONE thing I should do right now, with a reason." },
  { id: "weak", icon: "⚠️", label: "Fix my weak topic", prompt: "Pick my weakest topic, explain why I'm likely failing it, and give a 3-step recovery plan." },
  { id: "plan", icon: "🗓️", label: "Plan my session", prompt: "Make a concrete plan for my next study session (topic + task + minutes), based on my goal and daily limit." },
  { id: "quiz", icon: "🧠", label: "Quiz me (1 Q)", prompt: "Ask me ONE exam-style question at my level. Wait for my answer, then grade it." },
  { id: "screen", icon: "🖥️", label: "Summarize this screen", prompt: "Summarize what is on my screen right now and point out anything I should notice." },
  { id: "streak", icon: "🔥", label: "Motivate me", prompt: "Give me a short, specific motivation using my real streak and progress numbers." },
];

/** Pages the bot can OPEN inside the app when you say "open X" / "kholo X". */
const ROUTES: { href: string; label: string; words: string[] }[] = [
  { href: "/", label: "Dashboard", words: ["dashboard", "home", "main page", "home page", "mukhya"] },
  { href: "/learning-path", label: "Learning Path", words: ["learning path", "path", "syllabus", "course", "curriculum", "topics list"] },
  { href: "/ai-tutor", label: "AI Tutor", words: ["ai tutor", "tutor", "chat", "assistant", "teacher"] },
  { href: "/quizzes", label: "Quizzes", words: ["quiz", "quizzes", "test", "exam", "mock test", "paper"] },
  { href: "/practice", label: "Practice / Code Lab", words: ["practice", "code", "coding", "lab", "compiler", "runner", "problems"] },
  { href: "/progress", label: "Progress", words: ["progress", "stats", "analytics", "chart", "performance", "report card"] },
  { href: "/activity", label: "Activity", words: ["activity", "history", "timeline", "log"] },
  { href: "/notes", label: "Notes", words: ["note", "notes", "my notes"] },
  { href: "/saved", label: "Saved / Bookmarks", words: ["saved", "bookmark", "bookmarks", "favourites", "favorites"] },
  { href: "/planner", label: "Study Planner", words: ["planner", "study plan", "schedule", "timetable", "plan"] },
  { href: "/settings", label: "Settings", words: ["setting", "settings", "profile", "preferences"] },
  { href: "/start", label: "Onboarding", words: ["onboarding", "start", "setup", "begin"] },
];

function findRoute(text: string): { href: string; label: string } | null {
  const s = text.toLowerCase().trim();
  if (!s) return null;
  const action = /(open|show|go to|take me to|navigate|launch|start|display|kholo|khol do|khol|dikhao|dikha do|dikha|le jao|chalo|jao)/.test(s);
  const stop = /(close|band|quit|exit)/.test(s);
  if (stop) return null;
  // longest phrase first so "learning path" wins over "path"
  const sorted = [...ROUTES].sort((a, b) => Math.max(...b.words.map((w) => w.length)) - Math.max(...a.words.map((w) => w.length)));
  for (const r of sorted) {
    for (const w of r.words) {
      if (s.includes(w) && (action || s === w)) return { href: r.href, label: r.label };
    }
  }
  // "open unit 3" / "lesson 5 kholo"
  const unit = s.match(/(?:unit|lesson|chapter)\s*#?(\d{1,2})/);
  if (unit && (action || /^#?\d+$/.test(s))) return { href: `/learn/${Math.min(12, Math.max(1, Number(unit[1])))}`, label: `Lesson ${unit[1]}` };
  if (action && s.includes("search")) return { href: "/search", label: "Search" };
  return null;
}

export default function AiFab() {
  const pathname = usePathname();
  const router = useRouter();
  const prog = useProgress();
  const [open, setOpen] = useState(false);
  const [big, setBig] = useState(false);
  const [tab, setTab] = useState<"chat" | "tasks">("chat");
  const [screenOn, setScreenOn] = useState(true);
  const [input, setInput] = useState("");
  // attachments: paste (Ctrl+V) or upload — images/PDF go multimodal, text inlined
  const [atts, setAtts] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<M[]>([
    { role: "assistant", content: "Hi! I'm your AI-PATH bot 🤖\nI can run tasks for you and I can read the screen you're on." },
  ]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, open, big]);

  // Escape key also closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // what the bot "sees": current route + visible page text (no screenshots leave the browser)
  const screenText = () => {
    if (typeof document === "undefined") return "";
    const t = (document.body.innerText || "").replace(/\s+/g, " ").trim();
    return t.slice(0, 1800);
  };

  const addFiles = async (files: FileList | File[]) => {
    const { atts: got, errors } = await readAttachmentFiles(files);
    if (got.length) setAtts((a) => [...a, ...got]);
    for (const g of got) toast(`${g.name} attached ✓`, "info");
    for (const e of errors) toast(e, "err");
  };

  const ask = async (q: string, task?: string, attachments: Attachment[] = []) => {
    if (!q || loading) return;
    const history = [...msgs, { role: "user" as const, content: task ? `▶ ${task}` : q }];
    setMsgs(history);
    setLoading(true);
    if (task) setRunningTask(task);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: task ? "exam" : "explain",
          profile:
            tutorContext(prog) +
            (screenOn ? `\nSCREEN I AM LOOKING AT now: URL ${pathname} — "${screenText()}" (react to what is actually visible).` : ""),
          prefs: prog.prefs,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          attachments: attachments.map((a) => ({ name: a.name, mime: a.mime, kind: a.kind, data: a.data })),
        }),
      });
      const raw = await res.text();
      let reply = raw;
      try {
        const j = JSON.parse(raw);
        if (typeof j.reply === "string") reply = j.reply;
      } catch { /* plain text */ }
      setMsgs((m) => [...m, { role: "assistant", content: reply || "(empty reply)" }]);
      logActivity(task ? `AI bot task: ${task}` : "Quick ask (AI bot)", q.slice(0, 60), "tutor");
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Request failed — please try again." }]);
    }
    setLoading(false);
    setRunningTask(null);
  };

  const send = (text?: string) => {
    const base = (text ?? input).trim();
    const pending = atts;
    const markers = pending.map((a) => `[📎 ${a.name}]`).join(" ");
    const q = [base, markers].filter(Boolean).join(" ").trim();
    if (!q) return;
    setInput("");
    if (pending.length) setAtts([]);
    // "open quizzes" / "notes kholo" -> the bot navigates inside the app
    const route = pending.length ? null : findRoute(base);
    if (route) {
      setMsgs((m) => [
        ...m,
        { role: "user", content: q },
        { role: "assistant", content: `Opening ${route.label} for you ✅  (${route.href})` },
      ]);
      logActivity(`AI bot opened ${route.label}`, route.href, "tutor");
      if (route.href !== pathname) router.push(route.href);
      return;
    }
    ask(q, undefined, pending);
  };


  const act = nextAction(prog);
  const weak = weakTopics(prog, 1)[0];

  const size = big
    ? "inset-3 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[min(760px,calc(100vw-48px))] sm:h-[min(680px,80vh)]"
    : "right-3 bottom-24 md:bottom-6 w-[calc(100vw-24px)] sm:w-[368px] h-[460px] max-h-[72vh]";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI bot"
        title="Ask the AI bot"
        className={`ai-fab fixed right-4 z-50 w-14 h-14 rounded-full primary-gradient text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition bottom-24 md:bottom-6 ${open ? "opacity-0 pointer-events-none" : ""}`}
      >
        <span className="text-[26px] leading-none select-none">🤖</span>
        <span className="ai-fab-dot absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
      </button>

      {/* click anywhere outside = close */}
      {open && <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} aria-hidden />}

      {open && (
        <div className={`fixed z-50 ${size} card pop-in !p-0 overflow-hidden flex flex-col shadow-2xl transition-all duration-200`}
          onClick={(e) => e.stopPropagation()}>
          {/* header */}
          <div className="hero-gradient px-3.5 py-2.5 text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-[17px]">🤖</span>
            <div className="flex-1 leading-tight min-w-0">
              <div className="text-[13px] font-extrabold">AI-PATH Bot</div>
              <div className="text-[10px] text-white/80 truncate">
                {loading ? "thinking…" : screenOn ? `watching ${pathname}` : "screen off"} • {prog.prefs.level}
              </div>
            </div>
            <button
              onClick={() => setScreenOn((v) => !v)}
              title={screenOn ? "Screen context ON (bot sees this page)" : "Screen context OFF"}
              className={`w-7 h-7 rounded-full border flex items-center justify-center ${screenOn ? "bg-white/30 border-white/40" : "bg-white/10 border-white/20"}`}
            >
              {screenOn ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <Link href="/ai-tutor" title="Open full tutor screen" className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"><Maximize2 className="w-3.5 h-3.5" /></Link>
            <button onClick={() => setBig((b) => !b)} title={big ? "Shrink" : "Expand"} className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
              {big ? <Minimize2 className="w-3.5 h-3.5" /> : <span className="text-[12px] leading-none">⤢</span>}
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          </div>

          {/* tabs */}
          <div className="flex border-b border-slate-100 bg-white">
            {([["chat", "Chat", Sparkles], ["tasks", "Tasks", ClipboardList]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`flex-1 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${tab === id ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto bg-white">
            {tab === "chat" ? (
              <div className="p-3 space-y-2.5">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`pop-in max-w-[88%] px-3 py-2 rounded-2xl text-[12.5px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "primary-gradient text-white rounded-br-md" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-md"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-3 py-2 text-[12px] text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> thinking…
                    </div>
                  </div>
                )}
                <div ref={bottom} />
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <div className="text-[11px] text-slate-400">One tap = one real AI task, run with your live progress{screenOn ? " + this screen" : ""}.<br />
                  You can also just type <b className="text-indigo-600">"open quizzes"</b> or <b className="text-indigo-600">"show my notes"</b> and I&apos;ll take you there.</div>
                {TASKS.map((t) => (
                  <button
                    key={t.id}
                    disabled={loading}
                    onClick={() => { setTab("chat"); ask(t.prompt, t.label); }}
                    className="w-full text-left flex items-center gap-2.5 bg-slate-50 hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-md border border-slate-200 hover:border-indigo-300 rounded-xl px-3 py-2.5 transition disabled:opacity-60"
                  >
                    <span className="text-[17px]">{t.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[12.5px] font-bold text-slate-700">{t.label}</span>
                      <span className="block text-[10.5px] text-slate-400 truncate">{t.prompt}</span>
                    </span>
                    {runningTask === t.label && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
                  </button>
                ))}
                <div className="text-[11px] bg-indigo-50 border border-indigo-100 rounded-xl p-2 text-indigo-700">
                  <b>Now:</b> {act.title} • weak: {weak?.label} ({weak?.mastery}%)
                </div>
              </div>
            )}
          </div>

          {/* chips + input */}
          <div className="px-2.5 py-2 border-t border-slate-100 bg-white">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5">
              {CHIPS.map((c) => (
                <button key={c} onClick={() => { setTab("chat"); send(c); }} disabled={loading} className="text-[10.5px] whitespace-nowrap bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5 transition disabled:opacity-50">{c}</button>
              ))}
            </div>
            {atts.length > 0 && (
              <div className="flex gap-1.5 flex-wrap pb-1.5">
                {atts.map((a, i) => (
                  <span key={i} className="pop-in flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full pl-1.5 pr-1 py-1 max-w-[150px]">
                    {a.preview ? <img src={a.preview} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" /> : <span className="shrink-0">📄</span>}
                    <span className="truncate">{a.name}</span>
                    <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAtts((x) => x.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center text-indigo-500 shrink-0">×</button>
                  </span>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1.5 pr-1 py-1">
              <button type="button" aria-label="Attach a file" onClick={() => fileRef.current?.click()} disabled={loading} title="Upload image / PDF / text" className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 hover:-translate-y-0.5 transition disabled:opacity-50 shrink-0">
                <Paperclip className="w-3.5 h-3.5" />
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
                placeholder={screenOn ? "Ask — text, images (Ctrl+V), files…" : "Ask the bot…"}
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-[12.5px] min-w-0"
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
              <button aria-label="Send" disabled={(!input.trim() && atts.length === 0) || loading} className="w-8 h-8 rounded-full primary-gradient text-white flex items-center justify-center disabled:opacity-50 shrink-0 hover:scale-105 active:scale-95 transition">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
