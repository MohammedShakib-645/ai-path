"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import { toast } from "../../../components/Toaster";
import { useProgress, toggleLesson, logActivity, learnerLevel } from "../../../lib/store";
import { findLesson, ALL_LESSONS } from "../../../lib/curriculum";
import { AUTHORED_LESSONS } from "../../../content/lessons";
import { mdxComponents } from "../../../components/mdx/MDXBody";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Copy, Check, BotMessageSquare,
  FlaskConical, ClipboardList, Clock, ChevronRight,
} from "lucide-react";

interface LessonContent {
  topic: string; intro: string; analogy: string; syntax: string;
  examples: { title: string; code: string; explain: string }[];
  mistakes: string[]; points: string[]; practice: string[];
  quiz: { q: string; options: string[]; answer: number; tip: string }[];
  challenge: string; summary: string;
}

export default function LessonPage() {
  const params = useParams();
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";
  const flat = findLesson(lessonId);
  // Authored MDX lesson — derived at render time so no setState is needed in the effect.
  const authored = flat ? AUTHORED_LESSONS[flat.lesson.title] : undefined;
  const s = useProgress();

  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(!authored);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [quizPick, setQuizPick] = useState<Record<number, number>>({});

  useEffect(() => {
    // Authored MDX lessons render instantly — no AI round-trip, no flake.
    if (!flat || AUTHORED_LESSONS[flat.lesson.title]) return;
    setLoading(true);
    setContent(null);
    setFailed(false);
    setQuizPick({});
    fetch("/api/ai/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: flat.lesson.title, level: learnerLevel(s) }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.lesson) setContent(d.lesson as LessonContent);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, tick]);

  if (!flat) {
    return (
      <div>
        <TopHeader title="Lesson not found" subtitle="This lesson isn't part of the curriculum" />
        <div className="card p-10 text-center max-w-[520px] mx-auto">
          <div className="text-[46px] mb-2">🔍</div>
          <b className="text-[16px] text-[#101a3f]">Lesson not found</b>
          <p className="text-[13px] text-slate-500 mt-1">
            The link may be outdated or the lesson id is wrong. Browse the full catalog to pick up where you left off.
          </p>
          <Link href="/learn?view=catalog" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl primary-gradient text-white font-bold text-[14px]">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const { lesson, module: mod, level } = flat;
  const doneSet = new Set(s.lessons ?? []);
  const isDone = doneSet.has(lesson.id);
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lesson.id);
  const next = idx >= 0 ? ALL_LESSONS[idx + 1] : undefined;

  const copy = (t: string, i: number) => {
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const markComplete = () => {
    const nowDone = toggleLesson(lesson.id);
    if (nowDone) {
      logActivity(`Completed: ${lesson.title}`, `${level.title} • ${mod.title}`, "lesson");
      toast("Lesson marked complete ✓");
    } else {
      toast("Lesson marked incomplete");
    }
  };

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap text-[12px] text-slate-500">
        <Link href="/learn?view=catalog" className="font-semibold hover:text-indigo-600">Courses</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/courses/${level.id}`} className="font-semibold hover:text-indigo-600">{level.icon} {level.title}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-[#101a3f]">{mod.title}</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Link href={`/courses/${level.id}`} className="text-[#101a3f] hover:text-indigo-600" aria-label="Back to level">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader title={lesson.title} subtitle={authored ? `Editorial lesson • ${mod.title}, ${level.title}` : `AI-generated for your ${learnerLevel(s)} level • ${mod.title}, ${level.title}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {lesson.topics.map((t) => (
          <span key={t} className="text-[11px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{t}</span>
        ))}
        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{lesson.mins} min</span>
        {isDone && <span className="text-[11px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Completed</span>}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[80, 60, 90].map((w, i) => (
            <div key={i} className="card p-6"><div className="h-5 bg-slate-100 rounded" style={{ width: `${w}%` }} /><div className="h-3 bg-slate-50 rounded mt-3" /></div>
          ))}
          <p className="text-[13px] text-slate-500">Generating your personalized lesson…</p>
        </div>
      )}

      {!loading && !authored && (failed || !content) && (
        <div className="card p-10 text-center">
          <div className="text-[40px] mb-2">🛠️</div>
          <b className="text-[15px] text-[#101a3f]">Lesson engine is offline</b>
          <p className="text-[13px] text-slate-500 mt-1 max-w-[440px] mx-auto">
            We couldn&apos;t generate this lesson right now — no valid AI keys may be configured on this deployment.
            Nothing fake is shown here. Retry in a moment.
          </p>
          <button onClick={() => setTick((t) => t + 1)} className="mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold">
            Retry
          </button>
        </div>
      )}

      {!loading && (authored || !!content) && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="space-y-4">
            {authored && (
              <div className="card p-6 mdx-body">
                <authored.Component components={mdxComponents} />
              </div>
            )}
            {!authored && content && (
            <>
            <div className="card p-6">
              <h2 className="font-extrabold text-[18px] text-[#101a3f] mb-2">Introduction</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">{content.intro}</p>
              <div className="mt-3 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[13px] text-slate-600">
                <b className="text-[#101a3f]">Real-world analogy: </b>{content.analogy}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-extrabold text-[18px] text-[#101a3f] mb-2">Syntax</h2>
              <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap">{content.syntax}</pre>
            </div>

            {content.examples.map((ex, i) => (
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
                <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{content.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-[14px] text-[#101a3f] mb-2">⭐ Key points</h3>
                <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{content.points.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Mini quiz — check yourself</h3>
              {content.quiz.map((qq, qi) => (
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
              <p className="text-[13px] text-slate-600">{content.challenge}</p>
              <p className="text-[12px] text-slate-500 mt-2 italic">Summary: {content.summary}</p>
            </div>
            </>
            )}
          </div>

          {/* Right sidebar actions */}
          <div className="space-y-4">
            <div className="card p-5 space-y-2">
              <button
                onClick={markComplete}
                className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold transition ${
                  isDone ? "bg-green-50 border border-green-200 text-green-700" : "primary-gradient text-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> {isDone ? "Completed ✓ — undo" : "Mark Complete"}
              </button>

              {next ? (
                <Link href={`/lesson/${next.lesson.id}`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-slate-900 text-white">
                  Next Lesson: {next.lesson.title} <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/learn?view=catalog" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-slate-900 text-white">
                  Curriculum finished — back to Courses <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link href={`/ai-tutor?topic=${encodeURIComponent(lesson.title)}`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold primary-gradient text-white">
                <BotMessageSquare className="w-4 h-4" /> Ask AI about this
              </Link>
              <Link href={`/practice?topic=${encodeURIComponent(lesson.title)}`} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-green-50 border border-green-200 text-green-700">
                <FlaskConical className="w-4 h-4" /> Practice
              </Link>
              <Link href="/quizzes" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[13px] font-bold bg-purple-50 border border-purple-200 text-purple-700">
                <ClipboardList className="w-4 h-4" /> Take Quiz
              </Link>
            </div>

            {content && (
              <div className="card p-5">
                <h3 className="font-bold text-[14px] text-[#101a3f] mb-2">✍️ Practice tasks</h3>
                <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4">{content.practice.map((m, i) => <li key={i}>{m}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
