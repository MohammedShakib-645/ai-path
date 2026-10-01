"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import Markdown from "../../components/Markdown";
import { toast } from "../../components/Toaster";
import { INTERVIEW_TRACKS } from "../../lib/curriculum";
import { recordQuiz, logActivity } from "../../lib/store";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Mic, RotateCcw,
  Sparkles, Target, TrendingUp, AlertTriangle,
} from "lucide-react";

type EvalResult = {
  score: number;          // 0–5
  reply: string;          // raw AI evaluation (or local fallback text)
  missing: string;        // "MISSING:" section (may be empty)
  source: "ai" | "keyword";
  answer: string;         // the student's submitted answer (for review)
};

export default function InterviewPage() {
  const [stage, setStage] = useState<"pick" | "run" | "summary">("pick");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(Date.now());
  const recorded = useRef(false);

  const track = INTERVIEW_TRACKS.find((t) => t.id === trackId) ?? null;
  const total = track?.qs.length ?? 0;
  const q = track?.qs[idx];

  const start = (id: string) => {
    setTrackId(id);
    setIdx(0);
    setDraft("");
    setResults([]);
    recorded.current = false;
    startedAt.current = Date.now();
    setStage("run");
  };

  const retake = () => {
    if (!track) return;
    setIdx(0);
    setDraft("");
    setResults([]);
    recorded.current = false;
    startedAt.current = Date.now();
    setStage("run");
  };

  // Honest fallback: how many of the question's key concepts appear in the answer.
  const keywordScore = (answer: string, keys: string[]): number => {
    const a = answer.toLowerCase();
    const matches = keys.filter((k) => a.includes(k.toLowerCase())).length;
    return Math.max(0, Math.min(5, Math.round((matches * 5) / Math.max(1, keys.length))));
  };

  const submitAnswer = async () => {
    if (!track || !q || loading) return;
    const answer = draft.trim();
    if (!answer) {
      toast("Type your answer first", "err");
      return;
    }
    setLoading(true);
    const kwScore = keywordScore(answer, q.keys);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "interview",
          profile: `Mock interview candidate practising for a ${track.label} interview`,
          messages: [{
            role: "user",
            content: `${q.q}\n\nStudent answer: ${answer}\n\nEvaluate: score this answer 0-5, list missing concepts, then give the ideal answer. Format: SCORE: x/5, MISSING: ..., BETTER ANSWER: ...`,
          }],
        }),
      });
      const d = await res.json().catch(() => ({ reply: "" }));
      const reply: string = typeof d?.reply === "string" ? d.reply : "";
      const failed = !reply || d?.error === "AI_UNAVAILABLE";
      const m = reply.match(/(\d)\s*\/\s*5/);
      const aiScore = m ? Math.max(0, Math.min(5, parseInt(m[1], 10))) : null;
      const useAI = !failed && aiScore !== null;
      const missing = useAI
        ? (reply.match(/MISSING:\s*([\s\S]*?)(?=BETTER ANSWER:|$)/i)?.[1] ?? "").trim()
        : `Keyword check: your answer mentioned ${q.keys.filter((k) => answer.toLowerCase().includes(k.toLowerCase())).length} of ${q.keys.length} key concepts (${q.keys.join(", ")}).`;
      const result: EvalResult = useAI
        ? { score: aiScore, reply, missing, source: "ai", answer }
        : {
            score: kwScore,
            reply: failed
              ? `AI evaluation is unavailable right now, so this score came from a keyword check of your answer against ${q.keys.length} key concepts. Retry later for a full written evaluation.\n\nYour answer: ${answer}`
              : reply || `Scored locally with a keyword check against ${q.keys.length} key concepts.`,
            missing,
            source: "keyword",
            answer,
          };
      setResults((r) => [...r, result]);
      setDraft("");
      if (!useAI) toast("AI score unavailable — used keyword check", "info");
    } catch {
      setResults((r) => [...r, {
        score: kwScore,
        reply: `AI request failed (network). Scored with a keyword check against ${q.keys.length} key concepts — press "Evaluate" again to retry the AI.`,
        missing: `Keyword check: matched ${q.keys.filter((k) => answer.toLowerCase().includes(k.toLowerCase())).length} of ${q.keys.length} key concepts (${q.keys.join(", ")}).`,
        source: "keyword",
        answer,
      }]);
      setDraft("");
      toast("AI unavailable — keyword check used", "info");
    } finally {
      setLoading(false);
    }
  };

  const current = results[idx] ?? null;

  const next = () => {
    if (!track) return;
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      setDraft("");
      return;
    }
    // finished — record the real result once
    const score = results.reduce((s, r) => s + r.score, 0);
    const max = total * 5;
    const secs = Math.min(1800, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(`AI Interview: ${track.label}`, score, max, secs);
      logActivity(
        `Interview: ${track.label}`,
        `${score}/${max} (${Math.round((score / Math.max(1, max)) * 100)}%) across ${total} questions in ${Math.max(1, Math.round(secs / 60))} min`,
        "quiz"
      );
      toast(`Interview saved — ${score}/${max} ✓`);
    }
    setStage("summary");
  };

  const score = results.reduce((s, r) => s + r.score, 0);
  const max = total * 5;
  const pct = max ? Math.round((score / max) * 100) : 0;
  const weak = results.map((r, i) => ({ r, i })).filter(({ r }) => r.score <= 2);

  const scoreColor = (s: number) =>
    s >= 4 ? "bg-green-100 text-green-700 border-green-300"
      : s === 3 ? "bg-amber-100 text-amber-700 border-amber-300"
        : "bg-red-100 text-red-600 border-red-300";

  return (
    <div>
      {/* Header */}
      <TopHeader title="AI Interview Mode" subtitle="One question at a time — answer out loud in writing, get graded 0–5" back="/" />

      {/* ── Stage 1: pick a track ─────────────────────────────── */}
      {stage === "pick" && (
        <div>
          <div className="card p-6 mb-4 flex items-center gap-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300">
              <Mic className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="font-extrabold text-[18px]">Pick your interview track</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">Real questions, graded by AI. Each answer scores 0–5 marks.</div>
            </div>
            <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI-graded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {INTERVIEW_TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => start(t.id)}
                className="card p-5 text-left hover:-translate-y-1 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[26px] shrink-0 group-hover:scale-110 transition">{t.icon}</span>
                  <div>
                    <div className="font-extrabold text-[15px] text-[#101a3f]">{t.label}</div>
                    <div className="text-[11px] text-slate-500">{t.qs.length} questions • 0–{t.qs.length * 5} marks</div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 line-clamp-2">{t.qs[0]?.q}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
                  Start interview <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stage 2: one question at a time ───────────────────── */}
      {stage === "run" && track && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div>
            <div className="card p-5 flex items-center gap-4 mb-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
              <span className="w-14 h-14 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center text-[28px] shrink-0">{track.icon}</span>
              <div className="flex-1 min-w-[180px]">
                <div className="font-extrabold text-[17px]">{track.label} Interview</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">Answer naturally — the AI grades depth, not keywords.</div>
              </div>
              <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">Question {idx + 1} of {total}</span>
              <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 font-semibold">
                <Target className="w-3.5 h-3.5" /> {score}/{max}
              </span>
            </div>

            <div className="card p-6">
              <div key={idx} className="pop-in">
                <div className="flex gap-4 mb-4">
                  <span className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-[18px] shrink-0">{idx + 1}</span>
                  <h2 className="font-extrabold text-[17px] text-[#101a3f] flex-1">{q?.q}</h2>
                </div>

                {!current ? (
                  <>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={7}
                      placeholder="Type your answer here… explain the concept, give examples, mention trade-offs."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed outline-none resize-y placeholder:text-slate-400"
                    />
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                      <span className="text-[11px] text-slate-400">{draft.trim().length} characters</span>
                      <button
                        onClick={submitAnswer}
                        disabled={loading || !draft.trim()}
                        className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            AI is evaluating…
                          </>
                        ) : (
                          <>Evaluate my answer <Sparkles className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pop-in space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Your answer</div>
                      <Markdown text={current.answer} className="text-[13px] text-slate-600" />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-extrabold text-[16px] ${scoreColor(current.score)}`}>
                        {current.score} / 5
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${current.source === "ai" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {current.source === "ai" ? "AI evaluation" : "Keyword check (AI unavailable)"}
                      </span>
                    </div>

                    {current.missing && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                        <div className="text-[12px] font-extrabold text-amber-700 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-4 h-4" /> Missing concepts
                        </div>
                        <Markdown text={current.missing} className="text-[13px] text-amber-900" />
                      </div>
                    )}

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                      <div className="text-[12px] font-extrabold text-indigo-700 mb-1">Full evaluation &amp; ideal answer</div>
                      <Markdown text={current.reply} className="text-[13px] leading-relaxed text-slate-700" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6 gap-3">
                <button
                  onClick={() => { setStage("pick"); setResults([]); setIdx(0); }}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md hover:text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" /> Change track
                </button>
                {current && (
                  <button
                    onClick={next}
                    className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {idx === total - 1 ? "See my summary" : "Next question"} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Live score</h3>
              <div className="flex gap-1.5 flex-wrap">
                {track.qs.map((_, i) => {
                  const r = results[i];
                  return (
                    <span
                      key={i}
                      title={r ? `Question ${i + 1}: ${r.score}/5` : `Question ${i + 1}: not answered`}
                      className={`w-8 h-8 rounded-full text-[12px] font-bold flex items-center justify-center ${
                        r ? (r.score >= 3 ? "bg-green-500 text-white" : "bg-red-400 text-white")
                          : i === idx ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : "bg-slate-100 text-slate-400"}`}
                    >
                      {r ? r.score : i + 1}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 text-[13px] text-slate-600 flex justify-between">
                <span>Answered {results.length} / {total}</span>
                <b className="text-[#101a3f]">{score}/{max}</b>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Interview tips</h3>
              <ul className="text-[12.5px] text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Structure your answer: definition → example → trade-off.</li>
                <li>Mention real names (<b>SMOTE</b>, <b>k-fold</b>, <b>chain rule</b>) — keywords earn credit.</li>
                <li>If unsure, say what you DO know instead of guessing.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage 3: summary ──────────────────────────────────── */}
      {stage === "summary" && track && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div>
            <div className="card p-6 mb-4 flex items-center gap-5 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
              <div className="relative w-[110px] h-[110px] shrink-0">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="10" />
                  <circle
                    cx="55" cy="55" r="46" fill="none" stroke="#6366f1" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
                    transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.2,0.8,0.2,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[24px]">{pct}%</b>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">overall</span>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-extrabold text-[20px] flex items-center gap-2">{track.icon} {track.label} interview done</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">You scored <b>{score}</b> out of <b>{max}</b> marks across {total} questions.</div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{score}/{max} marks</span>
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{pct}%</span>
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{weak.length} weak {weak.length === 1 ? "area" : "areas"}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Question-by-question result</h3>
              <div className="space-y-2.5">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 border rounded-xl px-3.5 py-3 ${r.score <= 2 ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}>
                    <span className={`shrink-0 w-9 h-9 rounded-full border-2 font-extrabold text-[13px] flex items-center justify-center ${scoreColor(r.score)}`}>{r.score}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#101a3f] truncate">{track.qs[i]?.q}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.score <= 2 ? "Weak area — revisit this topic" : r.source === "ai" ? "AI-graded" : "Keyword-checked"}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-slate-400 shrink-0">/5</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-5 flex-wrap">
                <button onClick={retake} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md">
                  <RotateCcw className="w-4 h-4" /> Retake this track
                </button>
                <Link href="/ai-tutor" className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg">
                  Ask AI Tutor about weak areas →
                </Link>
              </div>

              <div className="mt-4 rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Saved to your progress — dashboard, transcript and activity updated live.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Weak areas (scored ≤ 2)</h3>
              {weak.length === 0 ? (
                <p className="text-[13px] text-slate-500">Nothing weak — every answer scored 3 or higher. Nice work! 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {weak.map(({ r, i }) => (
                    <li key={i} className="text-[12.5px] text-slate-700 border border-red-200 bg-red-50/60 rounded-xl px-3 py-2.5">
                      <b className="text-red-500">{r.score}/5</b> — {track.qs[i]?.q}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/ai-tutor" className="mt-3 inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[12px] font-bold px-4 py-2.5 rounded-lg">
                Study these with the AI Tutor →
              </Link>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">ⓘ How scoring works</h3>
              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                The AI grades each answer 0–5 for correctness and depth. If the AI is offline, the page falls back to a
                <b> keyword check</b> — how many of the question&apos;s key concepts appear in your answer — and labels it honestly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
