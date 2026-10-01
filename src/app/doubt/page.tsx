"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";
import MarkdownLite from "../../components/MarkdownLite";
import { toast } from "../../components/Toaster";
import { ArrowLeft, HelpCircle, Loader2, Send, Sparkles, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const CHIPS = [
  "Why is my model accuracy low?",
  "Explain CNN like I am a beginner.",
  "What is overfitting?",
  "Why do we use normalization?",
];

export default function DoubtPage() {
  const [question, setQuestion] = useState("");
  const [extra, setExtra] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const q = question.trim();
    if (!q) {
      toast("Type your doubt first", "err");
      return;
    }
    setLoading(true);
    setError(null);
    setReply("");
    const codePart = extra.trim()
      ? `\n\nCode / error output:\n\`\`\`\n${extra.trim()}\n\`\`\``
      : "";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "explain",
          profile: "Student stuck on a concept or error — needs a step-by-step doubt resolution",
          messages: [{
            role: "user",
            content:
              `${q}${codePart}\n\n` +
              `Answer this doubt with EXACTLY this structure, using these bold section headers in this order:\n` +
              `**Problem** → **Why it happened** → **How to fix it** → **Correct example** → **Practice question**\n\n` +
              `Rules: every section must be filled (never write "N/A"). The **Correct example** section must contain a working code block in triple backticks. ` +
              `The **Practice question** section must end with one question the student can answer to check themselves. Use short bullet points under each header.`,
          }],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d?.reply && !d.error) {
        setReply(d.reply);
      } else if (d?.reply) {
        setError(d.reply);
      } else {
        setError("The AI returned nothing. Check your connection and try again.");
      }
    } catch {
      setError("Request failed — the AI service could not be reached. Your question is saved below, try again.");
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">AI Doubt Solver</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Stuck on something? Get the problem, cause, fix, example and practice — in order</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SearchBox />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <div>
          {/* Banner */}
          <div className="card hero-gradient !border-0 p-5 text-white flex items-center gap-4 mb-4 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-extrabold text-[18px]">Ask anything you&apos;re stuck on</div>
              <div className="text-[12px] text-white/90">Problem → Why it happened → How to fix it → Correct example → Practice question</div>
            </div>
            <span className="text-[12px] border border-white/40 rounded-full px-3 py-1.5 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Structured answers
            </span>
          </div>

          {/* Quick chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => { setQuestion(c); setReply(""); setError(null); }}
                disabled={loading}
                className={`text-[12px] font-medium border rounded-full px-3.5 py-2 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${
                  question === c ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="card p-5">
            <label htmlFor="doubt-input" className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" /> Your question
            </label>
            <textarea
              id="doubt-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              placeholder="e.g. Why does my loss go down but validation accuracy stays flat?"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed outline-none resize-y placeholder:text-slate-400"
            />

            {/* optional collapsible code / error paste */}
            <button
              onClick={() => setShowExtra((v) => !v)}
              className="mt-2 w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100"
            >
              <span>{extra.trim() ? "Code / error attached" : "Add code or error output (optional)"}</span>
              {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExtra && (
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={"Paste the code that fails, or the full error/traceback here…\n\nTraceback (most recent call last):\n  File \"train.py\", line 12, in <module>"}
                className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-[12.5px] leading-relaxed font-mono outline-none resize-y placeholder:text-slate-400 placeholder:font-sans"
              />
            )}

            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <span className="text-[11px] text-slate-400">{question.trim().length} characters{extra.trim() ? ` • code/error attached` : ""}</span>
              <button
                onClick={() => ask()}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Working through your doubt…
                  </>
                ) : (
                  <>Get Explanation <Send className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {reply && (
            <div className="card p-5 mt-4 pop-in">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">✨ Explanation</h3>
                <Link href="/ai-tutor" className="text-[12px] font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-1.5 hover:bg-indigo-100">
                  Ask follow-up in AI Tutor →
                </Link>
              </div>
              <MarkdownLite text={reply} className="text-slate-700" />
            </div>
          )}

          {/* Empty state */}
          {!reply && !error && !loading && (
            <div className="card p-8 mt-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-[28px] mb-2">🙋</div>
              <b className="text-[15px] text-[#101a3f]">No doubts solved yet</b>
              <p className="text-[13px] text-slate-500 mt-1 max-w-[420px] mx-auto">
                Type your question, pick a quick suggestion above, or attach the error output — and get a structured answer every time.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card p-6 mt-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-[13px] font-semibold text-slate-600">Analysing your doubt — problem, cause, fix, example, practice…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="card p-5 mt-4 border border-red-200 bg-red-50/60">
              <b className="text-[14px] text-red-600 flex items-center gap-2 mb-1">⚠️ Could not solve it</b>
              <div className="text-[13px] text-red-800 whitespace-pre-wrap mb-3">{error}</div>
              <button
                onClick={() => ask()}
                className="px-5 py-2 rounded-xl primary-gradient text-white text-[13px] font-bold hover:-translate-y-0.5 hover:shadow-md"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">🧭 Every answer follows</h3>
            <ol className="text-[12.5px] text-slate-600 space-y-1.5 list-decimal pl-4">
              <li><b>Problem</b> — what is actually going wrong</li>
              <li><b>Why it happened</b> — the root cause</li>
              <li><b>How to fix it</b> — the steps to resolve it</li>
              <li><b>Correct example</b> — working code you can run</li>
              <li><b>Practice question</b> — one question to check yourself</li>
            </ol>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">💡 Tip</h3>
            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              Paste the exact error message or traceback in the optional box — the fix is usually much more precise.
              Want a deeper conversation about it? <Link href="/ai-tutor" className="text-indigo-600 font-bold">Open the AI Tutor →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
