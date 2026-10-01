"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import Markdown from "../../components/Markdown";
import { PYTHON_QUIZ, PYTHON_QUIZ_MEDIUM, PYTHON_QUIZ_HARD, QuizQ } from "../../lib/data";
import { useProgress, recordQuiz, recordMistakes, avgScore, learnerLevel } from "../../lib/store";
import { toast } from "../../components/Toaster";
import {
  Search, Sun, ArrowLeft, ArrowRight, Clock,
  CheckCircle2, XCircle, ClipboardList, Info, Lightbulb, BarChart3, Lock, Eye,
} from "lucide-react";

export default function QuizzesPage() {
  const prog = useProgress();
  const avg = avgScore(prog);
  const mediumUnlocked = avg >= 60 || learnerLevel(prog) !== "Beginner";
  const hardUnlocked = avg >= 80 || learnerLevel(prog) === "Advanced";
  const [tier, setTier] = useState<"easy" | "medium" | "hard" | "ai">("easy");
  const [aiBank, setAiBank] = useState<QuizQ[]>([]);
  const BANK = tier === "easy" ? PYTHON_QUIZ : tier === "medium" ? PYTHON_QUIZ_MEDIUM : tier === "hard" ? PYTHON_QUIZ_HARD : aiBank;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // mixed question types: multi-select answers + typed (fill-in-the-blank) answers
  const [multiAnswers, setMultiAnswers] = useState<Record<number, number[]>>({});
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({});
  // security: an answer locks the moment it is picked (no peeking, no changing)
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);
  const advTimer = useRef<number | null>(null);
  // real measured time on this quiz attempt (start → submit)
  const startedAt = useRef(Date.now());
  const [secs, setSecs] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const [genTopic, setGenTopic] = useState("Python Functions");
  const [genDiff, setGenDiff] = useState("Easy");
  const [genCount, setGenCount] = useState(5);
  const [genLoading, setGenLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSecs((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const switchTier = (t: "easy" | "medium" | "hard" | "ai") => {
    if (t === "medium" && !mediumUnlocked) return;
    if (t === "hard" && !hardUnlocked) return;
    if (t === "ai" && aiBank.length === 0) return;
    setTier(t);
    reset();
  };
  const reset = () => {
    if (advTimer.current) window.clearTimeout(advTimer.current);
    startedAt.current = Date.now();
    setIdx(0);
    setAnswers({});
    setMultiAnswers({});
    setFillAnswers({});
    setLocked({});
    setShowPreview(false);
    setSecs(300);
    setSubmitted(false);
    setAnalysis(null);
  };

  // ── mixed-type scoring: mcq/tf index, multi all-indexes, fill accepted text ──
  const isCorrectAt = (i: number): boolean => {
    const q = BANK[i];
    if (!q) return false;
    if (q.type === "multi") {
      const picked = (multiAnswers[i] ?? []).slice().sort((a, b) => a - b).join(",");
      const want = (q.answers ?? [q.answer]).slice().sort((a, b) => a - b).join(",");
      return picked !== "" && picked === want;
    }
    if (q.type === "fill") {
      const typed = (fillAnswers[i] ?? "").trim().toLowerCase().replace(/\s+/g, " ");
      return typed !== "" && (q.accept ?? []).map((a) => a.trim().toLowerCase().replace(/\s+/g, " ")).includes(typed);
    }
    return answers[i] === q.answer;
  };
  const isAnsweredAt = (i: number): boolean => {
    const q = BANK[i];
    if (!q) return false;
    if (q.type === "multi") return (multiAnswers[i] ?? []).length > 0;
    if (q.type === "fill") return (fillAnswers[i] ?? "").trim().length > 0;
    return answers[i] !== undefined;
  };

  const generate = async () => {
    if (!genTopic.trim()) {
      toast("Enter a topic first", "err");
      return;
    }
    setGenLoading(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: genTopic, difficulty: genDiff, count: genCount }),
      });
      const d = await res.json();
      const eng = String(d.engine ?? "");
      const canned = eng.includes("fallback") || eng.includes("mock");
      if (d.questions?.length && !canned) {
        setAiBank(d.questions);
        setTier("ai");
        reset();
        toast(`AI quiz ready: ${d.questions.length} questions ✓`);
      } else {
        toast(d.error || "AI couldn't create real questions — try again", "err");
      }
    } catch {
      toast("AI unavailable", "err");
    }
    setGenLoading(false);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const q = BANK[idx];
  const total = BANK.length;
  const picked = q && (q.type === "multi" || q.type === "fill") ? null : answers[idx] ?? null;
  const correct = BANK.reduce((n, _, i) => (isCorrectAt(i) ? n + 1 : n), 0);
  const answered = BANK.reduce((n, _, i) => (isAnsweredAt(i) ? n + 1 : n), 0);
  const incorrect = answered - correct;
  const skipped = total - answered;
  // during the quiz the ring tracks answered progress (no answer leaking!),
  // after submit it becomes the real score
  const ringPct = submitted ? Math.round((correct / total) * 100) : Math.round((answered / total) * 100);

  const choose = (o: number) => {
    if (submitted || locked[idx]) return; // one shot: once picked the answer is locked
    const qt = BANK[idx]?.type;
    if (qt === "multi") {
      // multi-select: toggle freely, lock only on Confirm below
      setMultiAnswers((m) => {
        const cur = m[idx] ?? [];
        return { ...m, [idx]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] };
      });
      return;
    }
    setAnswers((a) => ({ ...a, [idx]: o }));
    setLocked((l) => ({ ...l, [idx]: true }));
    if (idx < total - 1) {
      // brief pause so the user sees the lock, then move to the next question
      if (advTimer.current) window.clearTimeout(advTimer.current);
      advTimer.current = window.setTimeout(() => setIdx((i) => (i === idx ? i + 1 : i)), 700);
    }
  };
  const confirmMulti = () => {
    if (submitted || locked[idx] || !(multiAnswers[idx] ?? []).length) return;
    setLocked((l) => ({ ...l, [idx]: true }));
    if (idx < total - 1) {
      if (advTimer.current) window.clearTimeout(advTimer.current);
      advTimer.current = window.setTimeout(() => setIdx((i) => (i === idx ? i + 1 : i)), 700);
    }
  };
  const confirmFill = () => {
    if (submitted || locked[idx] || !(fillAnswers[idx] ?? "").trim()) return;
    setLocked((l) => ({ ...l, [idx]: true }));
    if (idx < total - 1) {
      if (advTimer.current) window.clearTimeout(advTimer.current);
      advTimer.current = window.setTimeout(() => setIdx((i) => (i === idx ? i + 1 : i)), 700);
    }
  };
  const go = (n: number) => {
    if (advTimer.current) window.clearTimeout(advTimer.current);
    setIdx(n);
  };
  const submit = async () => {
    const label = tier === "ai" ? `AI Quiz: ${genTopic}` : tier === "easy" ? "Python Basics Quiz (easy)" : tier === "medium" ? "Python Basics Quiz (medium)" : "Python Advanced Quiz (hard)";
    // honest study time: seconds actually spent on this attempt (capped at 10 min)
    const spent = Math.min(600, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    recordQuiz(label, correct, total, spent);
    // mistake analysis feeds the LearningEngine (weak topics, tutor context)
    recordMistakes(
      BANK.map((qq, i) => ({ qq, i }))
        .filter(({ qq, i }) => isAnsweredAt(i) && !isCorrectAt(i))
        .map(({ qq, i }) => ({
          q: qq.q,
          picked: qq.type === "fill"
            ? (fillAnswers[i] ?? "")
            : qq.type === "multi"
              ? (multiAnswers[i] ?? []).map((x) => qq.options[x] ?? "?").join(", ")
              : qq.options[answers[i] ?? -1] ?? "?",
          correct: qq.type === "fill"
            ? (qq.accept?.[0] ?? "?")
            : (qq.options[qq.type === "multi" ? (qq.answers?.[0] ?? qq.answer) : qq.answer] ?? "?"),
          topic: label,
        }))
    );
    setSubmitted(true);
    setAnalysis(null);
    try {
      const wrong = BANK.reduce((n, _, i) => (isAnsweredAt(i) && !isCorrectAt(i) ? n + 1 : n), 0);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "exam",
          profile: `quiz just finished: ${label}, score ${correct}/${total}`,
          messages: [{ role: "user", content: `Analyze this result: ${correct} correct, ${wrong} wrong out of ${total} on "${label}". Name strong areas, weak areas (with WHY), and exact next practice steps. Keep under 150 words.` }],
        }),
      });
      const d = await res.json();
      if (d.reply) setAnalysis(d.reply);
    } catch { /* analysis optional */ }
  };

  return (
    <div>
      {/* Header */}
      <TopHeader title="Quiz – Python Basics" subtitle="Test your knowledge and see where you need to improve 🙂" back="/" />

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div>
          {/* Banner */}
          <div className="card p-5 flex items-center gap-4 mb-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-extrabold text-[18px] text-[#101a3f] dark:text-slate-50">Python Basics Quiz</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">Answer the following questions. Each question has 1 mark.</div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(["easy", "medium", "hard", "ai"] as const).map((t) => {
                  const lockedT = t === "medium" && !mediumUnlocked;
                  const lockedH = t === "hard" && !hardUnlocked;
                  const aiLocked = t === "ai" && aiBank.length === 0;
                  return (
                    <button
                      key={t}
                      onClick={() => switchTier(t)}
                      disabled={lockedT || lockedH || aiLocked}
                      title={lockedT ? `Unlocks at 60% average (now ${avg}%)` : lockedH ? `Unlocks at 80% average or Advanced level (now ${avg}%)` : aiLocked ? "Generate an AI quiz below first" : ""}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full transition border ${tier === t ? "bg-white text-indigo-700 border-indigo-200 dark:border-white/15 shadow-sm" : "bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/20"} ${lockedT || lockedH || aiLocked ? "opacity-70" : ""}`}
                    >
                      {t === "easy" ? "Easy" : t === "medium" ? `Medium ${lockedT ? "🔒" : ""}` : t === "hard" ? `Hard ${lockedH ? "🔒" : ""}` : `AI ${aiLocked ? "🔒" : ""}`}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">Question {idx + 1} of {total}</span>
            <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5" /> {mm}:{ss}
            </span>
          </div>

          {/* Question */}
          <div className="card p-6">
            <div key={idx} className="pop-in">
              <div className="flex gap-4 mb-4">
                <span className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-[18px] shrink-0">{idx + 1}</span>
                <h2 className="font-extrabold text-[17px] text-[#101a3f] flex-1">{q.q}</h2>
                {locked[idx] && !submitted && (
                  <span className="self-start flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 shrink-0">
                    <Lock className="w-3 h-3" /> Answer locked
                  </span>
                )}
              </div>
              {q.scenario && (
                <div className="mb-4 ml-14 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[12.5px] text-amber-900">
                  <b className="block text-[11px] uppercase tracking-wide text-amber-600 mb-0.5">Scenario</b>
                  {q.scenario}
                </div>
              )}
              {q.code && (
                <pre className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[13px] font-mono text-slate-700 mb-4 whitespace-pre-wrap ml-14">{q.code}</pre>
              )}
              {q.type === "fill" ? (
                <div className="ml-14 space-y-3">
                  <p className="text-[12px] text-slate-500">Type your answer — not case-sensitive.</p>
                  <div className="flex gap-2">
                    <input
                      value={fillAnswers[idx] ?? ""}
                      onChange={(e) => !locked[idx] && !submitted && setFillAnswers((f) => ({ ...f, [idx]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") confirmFill(); }}
                      disabled={locked[idx] || submitted}
                      placeholder="Your answer…"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none disabled:bg-slate-50"
                    />
                    <button
                      onClick={confirmFill}
                      disabled={locked[idx] || submitted || !(fillAnswers[idx] ?? "").trim()}
                      className="px-5 py-3 rounded-xl primary-gradient text-white text-[13px] font-bold disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                  {submitted && (
                    <p className="text-[12.5px] rounded-lg border px-3 py-2 bg-green-50 border-green-200 text-green-800">
                      <b>Correct answer:</b> {q.accept?.[0]} — {q.tip}
                    </p>
                  )}
                </div>
              ) : (
              <div className="space-y-3">
                {q.options.map((op, o) => {
                  const isMulti = q.type === "multi";
                  const pickedSet = multiAnswers[idx] ?? [];
                  const isPick = isMulti ? pickedSet.includes(o) : picked === o;
                  const isAns = isMulti ? (q.answers ?? [q.answer]).includes(o) : o === q.answer;
                  const reveal = submitted; // correctness only after the exam is submitted
                  const isLocked = locked[idx] || submitted;
                  const state = reveal
                    ? isAns
                      ? "border-green-400 bg-green-50"
                      : isPick
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    : isPick
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-white hover:border-indigo-300";
                  return (
                    <button
                      key={o}
                      onClick={() => choose(o)}
                      disabled={isLocked}
                      className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3.5 text-left text-[14px] transition hover:-translate-y-0.5 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:shadow-none ${state}`}
                    >
                      <span className={`${isMulti ? "w-6 h-6 rounded-md" : "w-6 h-6 rounded-full"} border-2 flex items-center justify-center shrink-0 ${
                        reveal && isAns ? "border-green-500 bg-green-500"
                          : reveal && isPick ? "border-red-400 bg-red-400"
                            : isPick ? "border-indigo-500 bg-indigo-500" : "border-slate-300"}`}>
                        {isPick && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      {!isMulti && <span className="font-semibold text-slate-500">{q.type === "tf" ? "" : ["A.", "B.", "C.", "D."][o]}</span>}
                      <span className={reveal && isAns ? "text-green-800 font-medium" : isPick ? "font-semibold text-slate-700" : "text-slate-700"}>{op}</span>
                      {reveal && isAns && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                      {reveal && isPick && !isAns && <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />}
                      {!reveal && isPick && <Lock className="w-4 h-4 text-indigo-500 ml-auto shrink-0" />}
                    </button>
                  );
                })}
                {q.type === "multi" && !locked[idx] && !submitted && (
                  <button
                    onClick={confirmMulti}
                    disabled={!(multiAnswers[idx] ?? []).length}
                    className="w-full py-3 rounded-xl primary-gradient text-white text-[13px] font-bold disabled:opacity-50"
                  >
                    Confirm {multiAnswers[idx]?.length ?? 0} answer{(multiAnswers[idx]?.length ?? 0) === 1 ? "" : "s"}
                  </button>
                )}
              </div>
              )}
            </div>
            <div className="flex justify-between mt-6 gap-3">
              <button
                onClick={() => go(Math.max(0, idx - 1))}
                disabled={idx === 0}
                className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold flex items-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-md hover:text-slate-700"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              {idx === total - 1 ? (
                <button onClick={submit} className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg">
                  Submit Exam ✓
                </button>
              ) : (
                <button onClick={() => go(idx + 1)} className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg">
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {submitted && (
              <div className="mt-4 rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Saved — {correct}/{total} ({Math.round((correct / total) * 100)}%). Dashboard, transcript and activity updated live.
              </div>
            )}
            {submitted && (
              <div className="mt-3 rounded-xl p-3.5 bg-indigo-50 border border-indigo-200 text-[13px] text-slate-700">
                <b className="text-indigo-700 flex items-center gap-1.5 mb-1">🤖 AI Analysis of your result</b>
                {analysis ? (
                  <Markdown text={analysis} />
                ) : (
                  <span className="text-slate-500">Analyzing your answers…</span>
                )}
              </div>
            )}
            {/* Answer Preview — full review of every question after submission */}
            {submitted && (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-white overflow-hidden">
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-[13px] font-extrabold text-indigo-700 hover:bg-indigo-50 transition text-left"
                >
                  <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Answer Preview — see every question with the correct answer</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 shrink-0">{showPreview ? "Hide" : "Show"}</span>
                </button>
                {showPreview && (
                  <div className="stagger px-4 pb-4 space-y-3 max-h-[460px] overflow-y-auto">
                    {BANK.map((qq, i) => {
                      const okQ = isCorrectAt(i);
                      const answeredQ = isAnsweredAt(i);
                      const yours = qq.type === "fill" ? fillAnswers[i] : qq.type === "multi" ? (multiAnswers[i] ?? []).map((x) => qq.options[x]).join(", ") : answers[i] !== undefined ? qq.options[answers[i]] : undefined;
                      return (
                        <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                          <div className="text-[13px] font-bold text-[#101a3f] mb-2 flex items-center gap-2">
                            Q{i + 1}. {qq.q}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${okQ ? "bg-green-100 text-green-700" : answeredQ ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                              {okQ ? "Correct ✓" : answeredQ ? "Wrong ✗" : "Skipped"}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {qq.type === "fill" ? (
                              <div className="text-[12px] rounded-lg px-2.5 py-1.5 border border-green-300 bg-green-50 text-green-800 font-semibold">
                                <b>Accepted:</b> {qq.accept?.join(" / ")} {yours && <span className="text-slate-500 font-normal">— you typed: “{yours}”</span>}
                              </div>
                            ) : (
                              qq.options.map((op, o) => {
                                const right = qq.type === "multi" ? (qq.answers ?? [qq.answer]).includes(o) : o === qq.answer;
                                const mine = qq.type === "multi" ? (multiAnswers[i] ?? []).includes(o) : answers[i] === o;
                                return (
                                  <div key={o} className={`flex items-center gap-2 text-[12px] rounded-lg px-2.5 py-1.5 border ${right ? "border-green-300 bg-green-50 text-green-800 font-semibold" : mine ? "border-red-300 bg-red-50 text-red-700" : "border-slate-100 text-slate-500"}`}>
                                    <span className="font-bold">{["A", "B", "C", "D"][o]}.</span>
                                    <span>{op}</span>
                                    {right && <span className="ml-auto text-[10px] font-extrabold uppercase tracking-wide text-green-600 shrink-0">{mine ? "Correct ✓" : "Correct answer"}</span>}
                                    {mine && !right && <span className="ml-auto text-[10px] font-extrabold uppercase tracking-wide text-red-500 shrink-0">Your pick</span>}
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <p className="text-[11.5px] text-slate-500 mt-2 border-t border-slate-100 pt-2"><b className="text-indigo-600">Explanation:</b> {qq.tip}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Need help */}
          <div className="card p-4 mt-4 flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-[28px] shrink-0">🤖</span>
            <div className="flex-1">
              <b className="text-[14px] text-[#101a3f]">Need Help?</b>
              <p className="text-[12px] text-slate-500">You can ask your AI tutor for hints, explanations or similar questions.</p>
            </div>
            <Link href="/ai-tutor" className="bg-gradient-to-r from-purple-500 to-blue-400 text-white text-[12px] font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shrink-0">
              💬 Ask AI Tutor
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">✨ Generate AI Quiz</h3>
            <input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Topic (e.g. Python Functions)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none mb-2" />
            <div className="flex gap-2 mb-2">
              <select value={genDiff} onChange={(e) => setGenDiff(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-[12px] font-bold bg-white outline-none">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <select value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} className="border border-slate-200 rounded-xl px-2 py-2 text-[12px] font-bold bg-white outline-none">
                {[3, 5, 10].map((n) => <option key={n} value={n}>{n} Qs</option>)}
              </select>
            </div>
            <button onClick={generate} disabled={genLoading} className="w-full py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold disabled:opacity-50">
              {genLoading ? "Generating…" : "Generate Quiz"}
            </button>
            <p className="text-[11px] text-slate-400 mt-1.5">Questions come from the AI — saved as the AI tier.</p>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">🎯 Quiz Progress</h3>
            <div className="text-[13px] font-extrabold text-[#101a3f]">{idx + 1} / {total} <span className="font-normal text-slate-500">Questions</span></div>
            <div className="h-[8px] bg-slate-100 rounded-full my-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
            </div>
            <div className="flex gap-2 mt-3 items-center">
              {BANK.map((_, i) => {
                const ans = isAnsweredAt(i);
                const ok = ans && isCorrectAt(i);
                return (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    title={`Question ${i + 1}${ans ? (submitted ? (ok ? " — correct" : " — wrong") : " — answered") : " — not answered"}`}
                    className={`w-8 h-8 rounded-full text-[12px] font-bold transition hover:scale-110 ${i === idx ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : ans ? (submitted ? (ok ? "bg-green-500 text-white" : "bg-red-400 text-white") : "bg-indigo-500 text-white") : "bg-slate-100 text-slate-500"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <span className="ml-auto text-[12px] text-slate-500">{Math.round(((idx + 1) / total) * 100)}%</span>
            </div>
          </div>

          <div className="card p-5 text-[13px]">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2">ⓘ Quiz Information</h3>
            <div className="space-y-2.5 text-slate-600">
              <div className="flex justify-between items-center"><span>Topic</span><b className="text-[#101a3f]">{tier === "ai" ? `✨ ${genTopic}` : tier === "hard" ? "🐍 Python Advanced" : "🐍 Python Basics"}</b></div>
              <div className="flex justify-between"><span>Total Questions</span><b className="text-[#101a3f]">{total}</b></div>
              <div className="flex justify-between"><span>Time per Question</span><b className="text-[#101a3f]">1 minute</b></div>
              <div className="flex justify-between items-center">
                <span>Difficulty</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tier === "easy" ? "bg-green-100 text-green-700" : tier === "medium" ? "bg-amber-100 text-amber-700" : tier === "hard" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {tier === "easy" ? "Easy" : tier === "medium" ? "Medium" : tier === "hard" ? "Hard" : `AI ${genDiff}`}
                </span>
              </div>
              {!mediumUnlocked && (
                <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2">Medium unlocks at 60% average — now {avg}%.</p>
              )}
              {mediumUnlocked && !hardUnlocked && (
                <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2">Hard unlocks at 80% average or Advanced level — now {avg}%.</p>
              )}
            </div>
          </div>

          <div className="card p-5 text-[13px]">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">💡 Quick Tip</h3>
            <p className="text-slate-600 leading-relaxed">{q.tip}</p>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> {submitted ? "Your Performance" : "Live Progress"}</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-[96px] h-[96px] shrink-0">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#eef1f7" strokeWidth="11" />
                  <circle
                    cx="48" cy="48" r="40" fill="none" stroke={submitted ? "#22c55e" : "#6366f1"} strokeWidth="11" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - ringPct / 100)}
                    transform="rotate(-90 48 48)"
                    style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.8,0.2,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[18px] text-[#101a3f]">{ringPct}%</b>
                  <span className="text-[10px] text-slate-500">{submitted ? "Score" : "Answered"}</span>
                </div>
              </div>
              <div className="text-[12px] space-y-1.5 text-slate-600 w-full">
                {submitted ? (
                  <>
                    <div className="flex justify-between"><span>✅ Correct</span><b className="text-[#101a3f]">{correct}</b></div>
                    <div className="flex justify-between"><span>❌ Incorrect</span><b className="text-[#101a3f]">{incorrect}</b></div>
                    <div className="flex justify-between"><span>⏭ Skipped</span><b className="text-[#101a3f]">{skipped}</b></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span>📌 Answered (locked)</span><b className="text-[#101a3f]">{answered}</b></div>
                    <div className="flex justify-between"><span>⏭ Remaining</span><b className="text-[#101a3f]">{total - answered}</b></div>
                    <p className="text-[11px] text-slate-400">Results stay hidden until you submit — pick carefully, answers lock instantly.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
