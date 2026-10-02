"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import Markdown from "../../components/Markdown";
import { useProgress, saveNote, deleteNote, logActivity } from "../../lib/store";
import { Plus, Search, Pin, Trash2, Pencil, BotMessageSquare, PenTool, Sparkles } from "lucide-react";

const PEN_COLORS = ["#4f46e5", "#7c3aed", "#db2777", "#dc2626", "#d97706", "#059669", "#0284c7", "#111827"];

const AI_ACTIONS = [
  { id: "summarize", label: "Summarize", prompt: (t: string) => `Summarize this study note as short bullet points. Keep every key fact and code snippet. Return ONLY the bullets as plain text.\n\nNOTE:\n${t}` },
  { id: "flashcards", label: "Flashcards", prompt: (t: string) => `Create 5 exam-style Q&A flashcards from this note. Format exactly:\nQ1: ...\nA1: ...\nQ2: ...\nA2: ...\nQ3: ...\nA3: ...\nQ4: ...\nA4: ...\nQ5: ...\nA5: ...\nReturn ONLY the cards.\n\nNOTE:\n${t}` },
  { id: "improve", label: "Improve", prompt: (t: string) => `Rewrite this study note with clearer wording and correct grammar, keeping all technical meaning and code intact. Return ONLY the improved note text.\n\nNOTE:\n${t}` },
];

export default function NotesPage() {
  const s = useProgress();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Python");
  const [topic, setTopic] = useState("");
  // sketch pad (pen colours, saved with the note)
  const [sketchSrc, setSketchSrc] = useState<string | null>(null);
  const [showPen, setShowPen] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penSize, setPenSize] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const baseSketch = useRef<string | null>(null);
  // AI note tools (real API, honest offline state)
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiOut, setAiOut] = useState<string | null>(null);
  const [aiLabel, setAiLabel] = useState("");
  const [aiOffline, setAiOffline] = useState(false);
  // card resize (works with mouse AND touch — pointer events)
  const [rz, setRz] = useState<{ id: string; span: number; h: number; x0: number; y0: number; sSpan: number; sH: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const f = s.notes.filter((n) => !q || (n.title + n.body + n.tag).toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [s.notes, q]);

  const openNew = () => {
    setEditing("new");
    setTitle("");
    setBody("");
    setTag("Python");
    setTopic("");
    baseSketch.current = null;
    setSketchSrc(null);
    setShowPen(false);
    setAiOut(null);
  };
  const openEdit = (id: string) => {
    const n = s.notes.find((x) => x.id === id)!;
    setEditing(id);
    setTitle(n.title);
    setBody(n.body);
    setTag(n.tag);
    setTopic(n.topic);
    baseSketch.current = n.sketch ?? null;
    setSketchSrc(n.sketch ?? null);
    setShowPen(!!n.sketch);
    setAiOut(null);
  };

  // initialise the canvas whenever the pad opens / a different note is edited
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !showPen) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    const src = baseSketch.current;
    if (src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = src;
    }
  }, [showPen, editing]);

  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const penDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    drawing.current = true;
    try { c.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = canvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const penMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = canvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const penUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current;
    if (!c) return;
    try {
      const url = c.toDataURL("image/png");
      if (url.length < 500000) setSketchSrc(url);
      else toast("Sketch too large — clear some strokes", "err");
    } catch { /* ignore */ }
  };
  const clearSketch = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    baseSketch.current = null;
    setSketchSrc(null);
  };

  // ── drag-to-resize note cards (mouse + touch via pointer events) ─────────
  const rzDown = (e: React.PointerEvent<HTMLButtonElement>, id: string, cur?: { span: number; h: number }) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const card = e.currentTarget.closest("[data-note]") as HTMLElement | null;
    const h = cur?.h ?? card?.offsetHeight ?? 260;
    const span = cur?.span ?? 1;
    setRz({ id, span, h, x0: e.clientX, y0: e.clientY, sSpan: span, sH: h });
  };
  const rzMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!rz) return;
    e.stopPropagation();
    const cols = typeof window === "undefined" ? 3 : window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    const grid = gridRef.current;
    const gap = 16;
    const colW = grid && cols > 1 ? (grid.clientWidth - gap * (cols - 1)) / cols : 400;
    const span = Math.min(cols, Math.max(1, rz.sSpan + Math.round((e.clientX - rz.x0) / (colW + gap))));
    const h = Math.min(900, Math.max(200, rz.sH + (e.clientY - rz.y0)));
    if (span !== rz.span || h !== rz.h) setRz({ ...rz, span, h });
  };
  const rzUp = () => {
    if (!rz) return;
    saveNote({ id: rz.id, size: { span: rz.span, h: rz.h } });
    setRz(null);
  };

  const aiNote = async (a: (typeof AI_ACTIONS)[number]) => {
    const text = `${title}\n${body}`.trim();
    if (!text) {
      toast("Write the note first", "err");
      return;
    }
    setAiBusy(a.id);
    setAiLabel(a.label);
    setAiOut(null);
    setAiOffline(false);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "explain", messages: [{ role: "user", content: a.prompt(text) }] }),
      });
      const d = await res.json();
      if (d.reply) {
        setAiOut(String(d.reply));
        setAiOffline(!!d.error || String(d.engine ?? "").includes("offline"));
      } else {
        toast("AI returned nothing — try again", "err");
      }
    } catch {
      toast("AI unreachable — check your connection", "err");
    }
    setAiBusy(null);
  };
  const aiInsert = (mode: "replace" | "append") => {
    if (!aiOut) return;
    setBody(mode === "replace" ? aiOut : body ? `${body}\n\n${aiOut}` : aiOut);
    toast(mode === "replace" ? "Body replaced with AI result ✓" : "AI result appended ✓");
  };

  const save = () => {
    if (!title.trim() && !body.trim() && !sketchSrc) {
      toast("Note is empty", "err");
      return;
    }
    if (editing === "new") {
      saveNote({ title: title.trim() || "Untitled", body, tag, topic, sketch: sketchSrc ?? undefined });
      logActivity(`Note created: ${title.trim() || "Untitled"}`, tag, "note");
      toast("Note saved ✓");
    } else if (editing) {
      saveNote({ id: editing, title: title.trim() || "Untitled", body, tag, topic, sketch: sketchSrc ?? undefined });
      toast("Note updated ✓");
    }
    setEditing(null);
    setShowPen(false);
  };

  return (
    <div>
      <TopHeader title="Notes" subtitle="Your learning workspace — text, sketches & AI tools" />
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 flex-1 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="bg-transparent outline-none text-[13px] w-full" />
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full font-bold text-[15px] outline-none mb-2 bg-transparent" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write…" rows={5} className="w-full text-[13px] outline-none bg-transparent resize-y" />

          {/* pen + AI toolbar */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <button
              onClick={() => setShowPen((v) => !v)}
              className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 hover:-translate-y-0.5 ${showPen ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"}`}
            >
              <PenTool className="w-3.5 h-3.5" /> Sketch
            </button>
            {AI_ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => aiNote(a)}
                disabled={!!aiBusy}
                className="text-[12px] font-bold px-3 py-1.5 rounded-lg border bg-violet-50 border-violet-100 text-violet-700 flex items-center gap-1.5 hover:bg-violet-100 hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" /> {aiBusy === a.id ? "Working…" : a.label}
              </button>
            ))}
            <span className="text-[10.5px] text-slate-400">AI tools read this note&apos;s text</span>
          </div>

          {aiBusy && (
            <div className="mt-2.5 flex items-center gap-2 text-[12px] font-semibold text-violet-600">
              <span className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
              AI is working on your note…
            </div>
          )}

          {aiOut && !aiBusy && (
            <div className="mt-2.5 rounded-xl border border-violet-200 bg-violet-50/60 p-3 pop-in">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold text-violet-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {aiLabel}
                  {aiOffline && <span className="ml-1 text-[9.5px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">OFFLINE REPLY</span>}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => aiInsert("replace")} className="text-[11px] font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md hover:-translate-y-0.5 transition">Replace body</button>
                  <button onClick={() => aiInsert("append")} className="text-[11px] font-bold bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md hover:-translate-y-0.5 hover:shadow transition">Append</button>
                  <button onClick={() => setAiOut(null)} className="text-[11px] font-bold text-slate-400 px-2 py-1 hover:text-slate-600 transition">Dismiss</button>
                </div>
              </div>
              <Markdown text={aiOut} className="text-[12.5px] text-slate-700 max-h-56 overflow-y-auto" />
            </div>
          )}

          {showPen && (
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 pop-in">
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Pen colour ${c}`}
                    onClick={() => setPenColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition hover:scale-110 ${penColor === c ? "border-slate-800 scale-110 shadow" : "border-white shadow-sm"}`}
                    style={{ background: c }}
                  />
                ))}
                <button
                  aria-label="Eraser"
                  onClick={() => setPenColor("#ffffff")}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition hover:scale-110 ${penColor === "#ffffff" ? "border-slate-800" : "border-white"} bg-white shadow-sm`}
                  title="Eraser"
                >
                  🧽
                </button>
                <span className="w-px h-5 bg-slate-200 mx-1" />
                {[2, 5, 9].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setPenSize(sz)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-md border transition ${penSize === sz ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"}`}
                  >
                    {sz === 2 ? "S" : sz === 5 ? "M" : "L"}
                  </button>
                ))}
                <button onClick={clearSketch} className="ml-auto text-[11px] font-bold text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition">Clear</button>
              </div>
              <canvas
                ref={canvasRef}
                width={680}
                height={240}
                onPointerDown={penDown}
                onPointerMove={penMove}
                onPointerUp={penUp}
                onPointerLeave={penUp}
                className="w-full h-[190px] bg-white rounded-lg border border-slate-200 touch-none cursor-crosshair"
              />
              <div className="text-[10.5px] text-slate-400 mt-1">Draw with mouse or finger — the sketch is saved with this note.</div>
            </div>
          )}

          <div className="flex gap-2 mt-2 flex-wrap">
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] w-[130px] outline-none" />
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Linked topic" className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] w-[160px] outline-none" />
            <button onClick={save} className="ml-auto px-5 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-bold hover:-translate-y-0.5 hover:shadow transition">Save</button>
            <button onClick={() => { setEditing(null); setShowPen(false); }} className="px-4 py-1.5 rounded-lg text-[12px] font-bold text-slate-500 hover:text-slate-700 transition">Cancel</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[40px] mb-2">📝</div>
          <b className="text-[15px] text-[#101a3f]">No notes yet</b>
          <p className="text-[13px] text-slate-500 mt-1">Capture what you learn — text, sketches and AI tools, all in one place.</p>
        </div>
      ) : (
        <div ref={gridRef} className="stagger grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((n) => {
            const live = rz?.id === n.id ? rz : null;
            const span = live?.span ?? n.size?.span ?? 1;
            const h = live?.h ?? n.size?.h;
            return (
            <div key={n.id} data-note className={`card p-4 flex flex-col hover:-translate-y-1 hover:shadow-lg transition relative md:[grid-column:span_min(var(--span),2)] xl:[grid-column:span_var(--span)] ${live ? "z-10 !translate-y-0 shadow-xl outline outline-2 outline-indigo-300" : ""}`} style={{ ...(n.size || live ? { "--span": String(span) } : {}), ...(h || live ? { minHeight: h } : {}) } as React.CSSProperties}>
              <div className="flex items-start gap-2">
                <b className="text-[14px] text-[#101a3f] flex-1">{n.title}</b>
                {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <p className={`text-[12px] text-slate-500 mt-1 flex-1 whitespace-pre-wrap ${n.size || live ? "" : "line-clamp-4"}`}>{n.body || "—"}</p>
              {n.sketch && (
                <img src={n.sketch} alt="Note sketch" className="mt-2 h-20 w-full object-cover rounded-lg border border-slate-100" />
              )}
              <div className="text-[11px] text-slate-400 mt-2">{n.tag}{n.topic ? ` • ${n.topic}` : ""}</div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => saveNote({ id: n.id, pinned: !n.pinned })} title="Pin" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:-translate-y-0.5 transition"><Pin className="w-4 h-4" /></button>
                <button onClick={() => openEdit(n.id)} title="Edit" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:-translate-y-0.5 transition"><Pencil className="w-4 h-4" /></button>
                <Link href={`/ai-tutor?note=${n.id}`} title="Ask AI about this note" className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-500 hover:-translate-y-0.5 transition"><BotMessageSquare className="w-4 h-4" /></Link>
                <button onClick={() => { deleteNote(n.id); toast("Note deleted"); }} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 hover:-translate-y-0.5 transition ml-auto"><Trash2 className="w-4 h-4" /></button>
              </div>
              <button
                aria-label="Resize note (drag with mouse or finger)"
                title="Drag to resize — works with touch"
                onPointerDown={(e) => rzDown(e, n.id, n.size)}
                onPointerMove={rzMove}
                onPointerUp={rzUp}
                onPointerCancel={rzUp}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-1 text-slate-300 hover:text-indigo-500 cursor-nwse-resize touch-none select-none z-10"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M9 1 L1 9 M9 5 L5 9" /></svg>
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
