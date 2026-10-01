"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import { toast } from "../../../components/Toaster";
import { useProgress, toggleUnit, logActivity, toggleBookmark, learnerLevel, UNITS } from "../../../lib/store";
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Copy, Check, BotMessageSquare, FlaskConical, ClipboardList } from "lucide-react";

interface Lesson {
  topic: string; intro: string; analogy: string; syntax: string;
  examples: { title: string; code: string; explain: string }[];
  mistakes: string[]; points: string[]; practice: string[];
  quiz: { q: string; options: string[]; answer: number; tip: string }[];
  challenge: string; summary: string;
}

/** AI JSON can miss fields — normalize so the page never crashes on `.map`
 *  (returns null → honest "engine offline" state instead of a white screen). */
function normalizeLesson(raw: unknown): Lesson | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<Lesson>;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const n: Lesson = {
    topic: typeof l.topic === "string" ? l.topic : "",
    intro: typeof l.intro === "string" ? l.intro : "",
    analogy: typeof l.analogy === "string" ? l.analogy : "",
    syntax: typeof l.syntax === "string" ? l.syntax : "",
    examples: Array.isArray(l.examples)
      ? l.examples
          .filter((e) => !!e && typeof e === "object")
          .map((e) => ({
            title: typeof e.title === "string" ? e.title : "",
            code: typeof e.code === "string" ? e.code : "",
            explain: typeof e.explain === "string" ? e.explain : "",
          }))
      : [],
    mistakes: strArr(l.mistakes),
    points: strArr(l.points),
    practice: strArr(l.practice),
    quiz: Array.isArray(l.quiz)
      ? l.quiz
          .filter((q) => !!q && typeof q === "object")
          .map((q) => ({
            q: typeof q.q === "string" ? q.q : "",
            options: Array.isArray(q.options)
              ? q.options.filter((o): o is string => typeof o === "string")
              : [],
            answer: typeof q.answer === "number" ? q.answer : 0,
            tip: typeof q.tip === "string" ? q.tip : "",
          }))
      : [],
    challenge: typeof l.challenge === "string" ? l.challenge : "",
    summary: typeof l.summary === "string" ? l.summary : "",
  };
  if (!n.topic && !n.intro && n.quiz.length === 0 && n.examples.length === 0) return null;
  return n;
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const unit = UNITS.find((u) => u.id === id) ?? UNITS[0];
  const s = useProgress();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [quizPick, setQuizPick] = useState<Record<number, number>>({});
  const done = s.done.includes(unit.id);
  const saved = s.bookmarks.some((b) => b.kind === "lesson" && b.ref === String(unit.id));
  const next = UNITS.find((u) => u.id === unit.id + 1);

  useEffect(() => {
    setLoading(true);
    setLesson(null);
    setQuizPick({});
    fetch("/api/ai/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: unit.title, level: learnerLevel(s) }),
    })
      .then((r) => r.json())
      .then((d) => setLesson(normalizeLesson(d?.lesson)))
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id, tick]);

  const copy = (t: string, i: number) => {
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const complete = () => {
    if (!done) {
      toggleUnit(unit.id);
      logActivity(`Lesson: ${unit.title}`, `Unit ${unit.id} finished`, "lesson");
      toast(`Unit ${unit.id} marked complete ✓`);
    }
    if (next) router.push(`/learn/${next.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/learn" className="text-[#101a3f] hover:text-indigo-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader title={`Unit ${unit.id}: ${unit.title}`} subtitle={`${unit.hours} • AI-generated for your ${learnerLevel(s)} level`} />
        </div>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[80, 60, 90].map((w, i) => (
            <div key={i} className="card p-6"><div className="h-5 bg-slate-100 rounded" style={{ width: `${w}%` }} /><div className="h-3 bg-slate-50 rounded mt-3" /></div>
          ))}
          <p className="text-[13px] text-slate-500">Generating your personalized lesson…</p>
        </div>
      )}

      {!loading && !lesson && (
        <div className="card p-10 text-center">
          <div className="text-[40px] mb-2">🛠️</div>
          <b className="text-[15px] text-[#101a3f]">Lesson engine is offline</b>
          <p className="text-[13px] text-slate-500 mt-1 max-w-[440px] mx-auto">
            No valid AI keys are configured on this deployment yet, so no lesson was generated.
            Nothing fake is shown — add <code className="font-mono">GROQ_KEYS</code> / <code className="font-mono">GEMINI_KEYS</code> on the host and retry.
          </p>
          <button onClick={() => setTick((t) => t + 1)} className="mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold">Retry</button>
        </div>
      )}

      {!loading && lesson && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-extrabold text-[18px] text-[#101a3f] mb-2">Introduction</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">{lesson.intro}</p>
              <div className="mt-3 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[13px] text-slate-600">
                <b className="text-[#101a3f]">Real-world analogy: </b>{lesson.analogy}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-extrabold text-[18px] text-[#101a3f] mb-2">Syntax</h2>
              <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">{lesson.syntax}</pre>
            </div>

            {lesson.examples.map((ex, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">{ex.title}</h3>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 text-[10px] font-mono text-slate-500">
                    <span>python</span>
                    <button onClick={() => copy(ex.code, i)} className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
                      {copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} copy
                    </button>
                  </div>
                  <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-4 overflow-x-auto font-mono whitespace-pre">{ex.code}</pre>
                </div>
                <p className="text-[13px] text-slate-600 mt-2">{ex.explain}</p>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-bold text-[14px] text-[#101a3f] mb-2">⚠️ Common mistakes</h3>
                <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{lesson.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-[14px] text-[#101a3f] mb-2">⭐ Key points</h3>
                <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{lesson.points.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Mini quiz — check yourself</h3>
              {lesson.quiz.map((qq, qi) => (
                <div key={qi} className="mb-4 last:mb-0">
                  <p className="text-[13px] font-semibold text-slate-800 mb-2">{qi + 1}. {qq.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {qq.options.map((op, oi) => {
                      const pick = quizPick[qi];
                      const cls = pick === undefined ? "border-slate-200 hover:border-indigo-300" : oi === qq.answer ? "border-green-400 bg-green-50" : pick === oi ? "border-red-300 bg-red-50" : "border-slate-200";
                      return (
                        <button key={oi} onClick={() => setQuizPick((p) => ({ ...p, [qi]: oi }))} className={`border rounded-xl px-3 py-2 text-left text-[12px] ${cls}`}>
                          {op}
                        </button>
                      );
                    })}
                  </div>
                  {quizPick[qi] !== undefined && <p className="text-[11px] text-slate-500 mt-1">💡 {qq.tip}</p>}
                </div>
              ))}
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-1">🏋️ Challenge</h3>
              <p className="text-[13px] text-slate-600">{lesson.challenge}</p>
              <p className="text-[12px] text-slate-500 mt-2 italic">Summary: {lesson.summary}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5 space-y-2">
              <button onClick={() => { toggleBookmark("lesson", String(unit.id), `Unit ${unit.id}: ${unit.title}`, lesson.intro.slice(0, 120)); toast(saved ? "Bookmark removed" : "Lesson bookmarked ✓"); }} className={`w-full py-2.5 rounded-xl text-[13px] font-bold border transition ${saved ? "bg-amber-50 border-amber-200 text-amber-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                <Bookmark className="w-4 h-4 inline mr-1" /> {saved ? "Bookmarked ✓" : "Bookmark lesson"}
              </button>
              <Link href={`/ai-tutor?topic=${encodeURIComponent(unit.title)}`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold primary-gradient text-white">
                <BotMessageSquare className="w-4 h-4" /> Ask AI about this
              </Link>
              <Link href={`/practice?topic=${encodeURIComponent(unit.title)}`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-green-50 border border-green-200 text-green-700">
                <FlaskConical className="w-4 h-4" /> Practice
              </Link>
              <Link href="/quizzes" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-purple-50 border border-purple-200 text-purple-700">
                <ClipboardList className="w-4 h-4" /> Take Quiz
              </Link>
              <button onClick={complete} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-slate-900 text-white">
                <CheckCircle2 className="w-4 h-4" /> {done ? "Next Lesson" : "Mark Complete & Next"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-[14px] text-[#101a3f] mb-2">✍️ Practice tasks</h3>
              <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{lesson.practice.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
