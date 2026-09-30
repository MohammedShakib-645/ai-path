"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";
import { PYTHON_QUIZ, PYTHON_QUIZ_MEDIUM, QuizQ } from "../../lib/data";
import { useProgress, recordQuiz, recordMistakes, avgScore, learnerLevel } from "../../lib/store";
import { toast } from "../../components/Toaster";
import {
  Search, Sun, ArrowLeft, ArrowRight, Clock,
  CheckCircle2, XCircle, ClipboardList, Info, Lightbulb, BarChart3,
} from "lucide-react";

export default function QuizzesPage() {
  const prog = useProgress();
  const avg = avgScore(prog);
  const mediumUnlocked = avg >= 60 || learnerLevel(prog) !== "Beginner";
  const [tier, setTier] = useState<"easy" | "medium" | "ai">("easy");
  const [aiBank, setAiBank] = useState<QuizQ[]>([]);
  const BANK = tier === "easy" ? PYTHON_QUIZ : tier === "medium" ? PYTHON_QUIZ_MEDIUM : aiBank;

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
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

  const switchTier = (t: "easy" | "medium" | "ai") => {
    if (t === "medium" && !mediumUnlocked) return;
    if (t === "ai" && aiBank.length === 0) return;
    setTier(t);
    reset();
  };
  const reset = () => {
    setIdx(0);
    setPicked(null);
    setAnswers({});
    setSecs(300);
    setSubmitted(false);
    setAnalysis(null);
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
      if (d.questions?.length) {
        setAiBank(d.questions);
        setTier("ai");
        reset();
        toast(`AI quiz ready: ${d.questions.length} questions ✓`);
      } else {
        toast(d.error || "Quiz generation failed", "err");
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
  const correct = Object.entries(answers).filter(([k, v]) => BANK[Number(k)].answer === v).length;
  const answered = Object.keys(answers).length;
  const incorrect = answered - correct;
  const skipped = total - answered;
  const scorePct = answered === 0 ? 0 : Math.round((correct / answered) * 100);

  const choose = (o: number) => {
    setPicked(o);
    setAnswers((a) => ({ ...a, [idx]: o }));
    setSubmitted(false);
  };
  const go = (n: number) => {
    setIdx(n);
    setPicked(answers[n] ?? null);
    setSubmitted(false);
  };
  const submit = async () => {
    const label = tier === "ai" ? `AI Quiz: ${genTopic}` : `Python Basics Quiz (${tier})`;
    recordQuiz(label, correct, total);
    // mistake analysis feeds the LearningEngine (weak topics, tutor context)
    recordMistakes(
      Object.entries(answers)
        .filter(([k, v]) => BANK[Number(k)].answer !== v)
        .map(([k, v]) => ({
          q: BANK[Number(k)].q,
          picked: BANK[Number(k)].options[v] ?? "?",
          correct: BANK[Number(k)].options[BANK[Number(k)].answer] ?? "?",
          topic: label,
        }))
    );
    setSubmitted(true);
    setAnalysis(null);
    try {
      const wrong = Object.entries(answers).filter(([k, v]) => BANK[Number(k)].answer !== v).length;
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
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">Quiz – Python Basics</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Test your knowledge and see where you need to improve 🙂</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SearchBox />
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
            <div className="hidden lg:block">
              <div className="text-[13px] font-bold text-[#101a3f]">Mohammed Shakib</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {learnerLevel(prog)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div>
          {/* Banner */}
          <div className="card hero-gradient !border-0 p-5 text-white flex items-center gap-4 mb-4 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-extrabold text-[18px]">Python Basics Quiz</div>
              <div className="text-[12px] text-white/90">Answer the following questions. Each question has 1 mark.</div>
              <div className="flex gap-1.5 mt-2">
                {(["easy", "medium", "ai"] as const).map((t) => {
                  const locked = t === "medium" && !mediumUnlocked;
                  const aiLocked = t === "ai" && aiBank.length === 0;
                  return (
                    <button
                      key={t}
                      onClick={() => switchTier(t)}
                      disabled={locked || aiLocked}
                      title={locked ? `Unlocks at 60% average (now ${avg}%)` : aiLocked ? "Generate an AI quiz below first" : ""}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full transition ${tier === t ? "bg-white text-indigo-700" : "bg-white/20 text-white hover:bg-white/30"} ${locked || aiLocked ? "opacity-70" : ""}`}
                    >
                      {t === "easy" ? "Easy" : t === "medium" ? `Medium ${locked ? "🔒" : ""}` : `AI ${aiLocked ? "🔒" : ""}`}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-[12px] border border-white/40 rounded-full px-3 py-1.5 font-medium">Question {idx + 1} of {total}</span>
            <span className="text-[12px] border border-white/40 rounded-full px-3 py-1.5 flex items-center gap-1.5 font-semibold">
              <Clock className="w-3.5 h-3.5" /> {mm}:{ss}
            </span>
          </div>

          {/* Question */}
          <div className="card p-6">
            <div className="flex gap-4 mb-4">
              <span className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-[18px] shrink-0">{idx + 1}</span>
              <h2 className="font-extrabold text-[17px] text-[#101a3f]">{q.q}</h2>
            </div>
            {q.code && (
              <pre className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[13px] font-mono text-slate-700 mb-4 whitespace-pre-wrap ml-14">{q.code}</pre>
            )}
            <div className="space-y-3">
              {q.options.map((op, o) => {
                const isPick = picked === o;
                const isAns = o === q.answer;
                return (
                  <button
                    key={o}
                    onClick={() => choose(o)}
                    className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3.5 text-left text-[14px] transition ${
                      isPick ? (isAns ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50") : "border-slate-200 hover:border-indigo-300 bg-white"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isPick ? (isAns ? "border-green-500 bg-green-500" : "border-red-400 bg-red-400") : "border-slate-300"}`}>
                      {isPick && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span className="font-semibold text-slate-500">{["A.", "B.", "C.", "D."][o]}</span>
                    <span className={isPick && isAns ? "text-green-800 font-medium" : "text-slate-700"}>{op}</span>
                    {isPick && isAns && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />}
                    {isPick && !isAns && <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-6 gap-3">
              <button
                onClick={() => go(Math.max(0, idx - 1))}
                disabled={idx === 0}
                className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold flex items-center gap-2 disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              {idx === total - 1 ? (
                <button onClick={submit} className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow">
                  Submit Exam ✓
                </button>
              ) : (
                <button onClick={() => go(idx + 1)} className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow">
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
                  <div className="whitespace-pre-wrap">{analysis}</div>
                ) : (
                  <span className="text-slate-500">Analyzing your answers…</span>
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
            <input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Topic (e.g. Python Functions)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-indigo-400 mb-2" />
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
                const ans = i in answers;
                const ok = ans && answers[i] === BANK[i].answer;
                return (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className={`w-8 h-8 rounded-full text-[12px] font-bold transition ${i === idx ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : ans ? (ok ? "bg-green-500 text-white" : "bg-red-400 text-white") : "bg-slate-100 text-slate-500"}`}
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
              <div className="flex justify-between items-center"><span>Topic</span><b className="text-[#101a3f]">{tier === "ai" ? `✨ ${genTopic}` : "🐍 Python Basics"}</b></div>
              <div className="flex justify-between"><span>Total Questions</span><b className="text-[#101a3f]">{total}</b></div>
              <div className="flex justify-between"><span>Time per Question</span><b className="text-[#101a3f]">1 minute</b></div>
              <div className="flex justify-between items-center">
                <span>Difficulty</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tier === "easy" ? "bg-green-100 text-green-700" : tier === "medium" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {tier === "easy" ? "Easy" : tier === "medium" ? "Medium" : `AI ${genDiff}`}
                </span>
              </div>
              {!mediumUnlocked && (
                <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2">Medium unlocks at 60% average — now {avg}%.</p>
              )}
            </div>
          </div>

          <div className="card p-5 text-[13px]">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">💡 Quick Tip</h3>
            <p className="text-slate-600 leading-relaxed">{q.tip}</p>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Your Performance</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-[96px] h-[96px] shrink-0">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#eef1f7" strokeWidth="11" />
                  <circle
                    cx="48" cy="48" r="40" fill="none" stroke="#22c55e" strokeWidth="11" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - scorePct / 100)}
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[18px] text-[#101a3f]">{scorePct}%</b>
                  <span className="text-[10px] text-slate-500">Correct</span>
                </div>
              </div>
              <div className="text-[12px] space-y-1.5 text-slate-600 w-full">
                <div className="flex justify-between"><span>✅ Correct</span><b className="text-[#101a3f]">{correct}</b></div>
                <div className="flex justify-between"><span>❌ Incorrect</span><b className="text-[#101a3f]">{incorrect}</b></div>
                <div className="flex justify-between"><span>⏭ Skipped</span><b className="text-[#101a3f]">{skipped}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
