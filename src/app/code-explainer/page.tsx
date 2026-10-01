"use client";
import { useState } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import Markdown from "../../components/Markdown";
import { toast } from "../../components/Toaster";
import { ClipboardList, Copy, Check, Eraser, Play, Sparkles, Code2, Loader2 } from "lucide-react";

const LANGS = ["Python", "JavaScript", "Java", "C++", "SQL"] as const;
type Lang = (typeof LANGS)[number];

// Real, short, runnable-ish samples — one per language.
const SAMPLES: Record<Lang, string> = {
  Python: `def average(nums):
    if not nums:
        return 0
    return sum(nums) / len(nums)

scores = [85, 92, 78, 90]
print(f"Average: {average(scores):.1f}")`,
  JavaScript: `function topStudent(students) {
  const passed = students.filter(s => s.score >= 60);
  passed.sort((a, b) => b.score - a.score);
  return passed[0];
}

const class1 = [{ name: "Ali", score: 88 }, { name: "Sara", score: 72 }];
console.log(topStudent(class1));`,
  Java: `public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 7, 2, 9};
        int max = nums[0];
        for (int n : nums) {
            if (n > max) max = n;
        }
        System.out.println("Max: " + max);
    }
}`,
  "C++": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> v = {4, 1, 9, 3};
    int sum = 0;
    for (int x : v) sum += x;
    cout << "Sum: " << sum << endl;
    return 0;
}`,
  SQL: `SELECT department,
       COUNT(*)            AS employees,
       ROUND(AVG(salary),2) AS avg_salary
FROM employees
WHERE hired_date >= '2023-01-01'
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;`,
};

export default function CodeExplainerPage() {
  const [lang, setLang] = useState<Lang>("Python");
  const [code, setCode] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadSample = () => {
    setCode(SAMPLES[lang]);
    setReply("");
    setError(null);
    toast(`${lang} example loaded`, "info");
  };

  const clear = () => {
    setCode("");
    setReply("");
    setError(null);
  };

  const copy = async () => {
    if (!reply) return;
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast("Explanation copied ✓");
    } catch {
      toast("Copy failed", "err");
    }
  };

  const explain = async () => {
    const src = code.trim();
    if (!src) {
      toast("Paste some code first (or load the example)", "err");
      return;
    }
    setLoading(true);
    setError(null);
    setReply("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "review",
          profile: `Student learning ${lang} wants a clear explanation of pasted code`,
          messages: [{
            role: "user",
            content:
              `Explain this ${lang} code: 1) What it does 2) Line-by-line 3) Important concepts ` +
              `4) Possible errors 5) Improvements 6) Example output. ` +
              `Use markdown structure with bold headers and bullet points.\n\n` +
              "```" + lang.toLowerCase().replace("+", "p") + "\n" + src + "\n```",
          }],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d?.reply && !d.error) {
        setReply(d.reply);
      } else if (d?.reply) {
        setError(d.reply);
      } else {
        setError("The AI returned no explanation. Check your connection and try again.");
      }
    } catch {
      setError("Request failed — the AI service could not be reached. Your code is still here, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <TopHeader title="AI Code Explainer" subtitle="Paste code — get a line-by-line explanation, concepts and fixes" back="/dashboard" />

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        <div>
          {/* Banner */}
          <div className="card p-5 flex items-center gap-4 mb-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300">
              <Code2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="font-extrabold text-[18px] text-[#101a3f] dark:text-slate-50">Understand any code, line by line</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">What it does • concepts • possible errors • improvements • expected output</div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setReply(""); setError(null); }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition border ${lang === l ? "bg-white text-indigo-700 border-indigo-200 dark:border-white/15 shadow-sm" : "bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-indigo-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/20"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <label htmlFor="code-input" className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Your {lang} code
              </label>
              <div className="flex gap-2">
                <button
                  onClick={loadSample}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-[12px] font-bold flex items-center gap-1.5 hover:bg-indigo-100"
                >
                  <Play className="w-3.5 h-3.5" /> Paste example
                </button>
                <button
                  onClick={clear}
                  disabled={!code && !reply && !error}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[12px] font-bold flex items-center gap-1.5 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>
            <textarea
              id="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={`Paste your ${lang} code here — or press "Paste example" to try it right away.`}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] leading-relaxed font-mono outline-none resize-y placeholder:text-slate-400 placeholder:font-sans"
            />
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <span className="text-[11px] text-slate-400">{code.trim() ? `${code.split("\n").length} lines • ${code.length} characters` : "Nothing pasted yet"}</span>
              <button
                onClick={explain}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Explaining…
                  </>
                ) : (
                  <>Explain this code <Sparkles className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {reply && (
            <div className="card p-5 mt-4 pop-in">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">✨ Explanation</h3>
                <button
                  onClick={copy}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[12px] font-bold flex items-center gap-1.5 hover:bg-slate-100"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy answer"}
                </button>
              </div>
              <Markdown text={reply} className="text-slate-700" />
            </div>
          )}

          {/* Empty state */}
          {!reply && !error && !loading && (
            <div className="card p-8 mt-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-[28px] mb-2">🧩</div>
              <b className="text-[15px] text-[#101a3f]">No explanation yet</b>
              <p className="text-[13px] text-slate-500 mt-1 max-w-[420px] mx-auto">
                Paste any {lang} code above, or press <b>Paste example</b> to load a real sample and see how it works.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card p-6 mt-4 flex items-center gap-3 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-[13px] font-semibold">The AI is reading your {lang} code…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="card p-5 mt-4 border border-red-200 bg-red-50/60">
              <b className="text-[14px] text-red-600 flex items-center gap-2 mb-1">⚠️ Explanation failed</b>
              <div className="text-[13px] text-red-800 whitespace-pre-wrap mb-3">{error}</div>
              <button
                onClick={explain}
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
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">🎯 What you get</h3>
            <ul className="text-[12.5px] text-slate-600 space-y-1.5 list-disc pl-4">
              <li><b>What it does</b> — the purpose in one look</li>
              <li><b>Line-by-line</b> — every statement explained</li>
              <li><b>Important concepts</b> — the ideas behind the code</li>
              <li><b>Possible errors</b> — what can break and why</li>
              <li><b>Improvements</b> — cleaner, safer, faster</li>
              <li><b>Example output</b> — what it prints</li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">💡 Tip</h3>
            <p className="text-[12.5px] text-slate-600 leading-relaxed">
              Paste only the part you don&apos;t understand — a function or an error trace beats a whole file.
              For a quick fix rather than a lesson, try the <Link href="/doubt" className="text-indigo-600 font-bold">AI Doubt Solver</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
