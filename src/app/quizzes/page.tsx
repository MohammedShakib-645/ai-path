"use client";
import { useState, useEffect } from "react";
import TopHeader from "../../components/TopHeader";
import { PYTHON_QUIZ, PYTHON_QUIZ_MEDIUM } from "../../lib/data";
import { useProgress, recordQuiz, relTime, avgScore, learnerLevel } from "../../lib/store";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function QuizzesPage() {
  const [idx, setIdx] = useState(2); // Question 3 of 5
  const [picked, setPicked] = useState<number | null>(1);
  const [answers, setAnswers] = useState<Record<number, number>>({ 0: 1, 1: 1 });
  const [secs, setSecs] = useState(272); // 04:32
  const [submitted, setSubmitted] = useState(false);
  const [tier, setTier] = useState<"easy" | "medium">("easy");
  const prog = useProgress();
  const avg = avgScore(prog);
  const mediumUnlocked = avg >= 60 || learnerLevel(prog) !== "Beginner";
  const BANK = tier === "easy" ? PYTHON_QUIZ : PYTHON_QUIZ_MEDIUM;

  const switchTier = (t: "easy" | "medium") => {
    if (t === "medium" && !mediumUnlocked) return;
    setTier(t);
    setIdx(0);
    setPicked(null);
    setAnswers({});
    setSecs(300);
    setSubmitted(false);
  };

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const q = BANK[idx];

  const correct = Object.entries(answers).filter(
    ([k, v]) => BANK[Number(k)].answer === v
  ).length;
  const incorrect = Object.keys(answers).length - correct;
  const totalQuestions = BANK.length;

  const choose = (o: number) => {
    setSubmitted(false);
    setPicked(o);
    setAnswers((a) => ({ ...a, [idx]: o }));
  };

  const handleNext = () => {
    if (idx < totalQuestions - 1) {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      setPicked(answers[nextIdx] ?? null);
    }
  };

  const handlePrev = () => {
    if (idx > 0) {
      const prevIdx = idx - 1;
      setIdx(prevIdx);
      setPicked(answers[prevIdx] ?? null);
    }
  };

  const handleReset = () => {
    setIdx(0);
    setPicked(null);
    setAnswers({});
    setSecs(300);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    recordQuiz(`Unit 02 Diagnostic (${tier})`, correct, totalQuestions);
    setSubmitted(true);
  };

  const lastAttempt = prog.attempts[prog.attempts.length - 1];

  return (
    <div className="space-y-6 pb-12">
      <TopHeader
        title="Coursework Assessment Arena"
        subtitle="Examination Code: EXAM-CS-101 • Unit 02 Diagnostic Evaluation"
      />

      {/* Adaptive difficulty: Medium unlocks at 60% average */}
      <div className="pro-card px-5 py-3.5 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</span>
        {(["easy", "medium"] as const).map((t) => {
          const locked = t === "medium" && !mediumUnlocked;
          const active = tier === t;
          return (
            <button
              key={t}
              onClick={() => switchTier(t)}
              disabled={locked}
              title={locked ? `Score 60%+ average to unlock (now ${avg}%)` : t === "medium" ? "Comprehensions, pitfalls, complexity" : "Syntax, types, loops"}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${active ? "bg-slate-900 text-white" : locked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t === "easy" ? "Easy — Foundations" : `Medium — Problem Solving ${locked ? "🔒" : ""}`}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] font-mono text-slate-400">
          {mediumUnlocked ? `unlocked · your avg ${avg}%` : `lock at 60% avg · now ${avg}%`}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        {/* Main Examination View */}
        <div className="space-y-5">
          {/* Official Exam Meta Header */}
          <div className="pro-card p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-700/50">
                  EXAM-CS101-02
                </span>
                <span className="text-xs text-slate-400">Formal Assessment</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Unit 02 Diagnostic: Variables, Types & Slicing
              </h2>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Item {idx + 1} of {totalQuestions}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className={secs < 60 ? "text-amber-400 font-bold" : ""}>
                  {mm}:{ss}
                </span>
              </span>
            </div>
          </div>

          {/* Question Card */}
          <div className="pro-card p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  QUESTION {idx + 1}
                </span>
                <span className="text-xs text-slate-500 font-medium">Points: 1.00</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">ID: REF-00{idx + 1}</span>
            </div>

            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                {q.q}
              </p>
            </div>

            {/* Code Block if Present */}
            {q.code && (
              <div className="rounded-md border border-slate-800 bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-100 leading-relaxed overflow-x-auto">
                <div className="text-[10px] text-slate-500 pb-2 mb-2 border-b border-slate-800 uppercase tracking-wider">
                  Python Code Sample:
                </div>
                <pre>{q.code}</pre>
              </div>
            )}

            {/* Multiple Choice Radio List */}
            <div className="space-y-2.5 pt-1">
              {q.options.map((option, optIdx) => {
                const isSelected = picked === optIdx;
                const isCorrectAnswer = optIdx === q.answer;
                const isSubmitted = picked !== null;

                let borderClasses = "border-slate-200 hover:border-slate-300 bg-white text-slate-800";
                if (isSelected) {
                  borderClasses = isCorrectAnswer
                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-950"
                    : "border-rose-400 bg-rose-50/30 text-rose-950";
                } else if (isSubmitted && isCorrectAnswer) {
                  borderClasses = "border-emerald-300 bg-emerald-50/20 text-emerald-900";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => choose(optIdx)}
                    className={`w-full p-3.5 rounded-md border text-left flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${borderClasses}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? isCorrectAnswer
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {["A", "B", "C", "D"][optIdx]}
                      </span>
                      <span className="font-medium text-slate-900">{option}</span>
                    </div>

                    <div className="shrink-0">
                      {isSelected && isCorrectAnswer && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Correct
                        </span>
                      )}
                      {isSelected && !isCorrectAnswer && (
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {picked !== null && (
              <div className="rounded-md p-3.5 bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Technical Rationale & Specification:
                </div>
                <p className="text-slate-600 leading-relaxed font-normal">{q.tip}</p>
              </div>
            )}

            {/* Exam Navigation Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <button
                onClick={handlePrev}
                disabled={idx === 0}
                className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Item
              </button>

              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length === 0}
                className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <FileCheck className="w-3.5 h-3.5" /> Submit Exam ({correct}/{totalQuestions})
              </button>

              <button
                onClick={handleNext}
                disabled={idx === totalQuestions - 1}
                className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
              >
                Next Item <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {submitted && (
              <div className="rounded-md p-3.5 bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-900 font-semibold">
                  Saved — {correct}/{totalQuestions} ({Math.round((correct / totalQuestions) * 100)}%). Dashboard, transcript and activity updated live.
                </span>
              </div>
            )}
            {lastAttempt && !submitted && (
              <p className="text-[11px] text-slate-400 font-mono">
                Last saved attempt: {lastAttempt.score}/{lastAttempt.total} • {relTime(lastAttempt.at)}
              </p>
            )}
          </div>
        </div>

        {/* Examination Navigation & Rubric Column */}
        <div className="space-y-6">
          {/* Question Grid Manifest */}
          <div className="pro-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Examination Manifest
              </h4>
              <span className="text-xs font-mono text-slate-700">
                {Object.keys(answers).length}/{totalQuestions} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {BANK.map((_, i) => {
                const isCurrent = i === idx;
                const isAnswered = i in answers;
                const isCorrect = isAnswered && answers[i] === BANK[i].answer;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setIdx(i);
                      setPicked(answers[i] ?? null);
                    }}
                    className={`h-9 rounded font-mono text-xs font-bold transition ${
                      isCurrent
                        ? "bg-slate-900 text-white"
                        : isAnswered
                        ? isCorrect
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : "bg-rose-50 text-rose-800 border border-rose-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    0{i + 1}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>Passing Grade:</span>
                <span className="font-semibold text-slate-800">70.0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Weighting:</span>
                <span className="font-semibold text-slate-800">10% of Total Grade</span>
              </div>
            </div>
          </div>

          {/* Real-time Diagnostic Summary */}
          <div className="pro-card p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Current Evaluation Score
            </h4>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center space-y-1">
              <div className="font-mono text-2xl font-bold text-slate-900">
                {Math.round((correct / Math.max(1, Object.keys(answers).length)) * 100)}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {correct} Correct • {incorrect} Incorrect
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake Assessment
              </button>
              <Link
                href="/learning-path"
                className="text-blue-600 hover:underline font-semibold"
              >
                Return to Coursework
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
