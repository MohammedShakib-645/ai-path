"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import { logActivity, recordStudy, useProgress, recordQuiz } from "../../lib/store";
import { runCode, availableLanguages } from "../../lib/runner";
import { PRACTICE_CATS, PRACTICE_BANK, PracticeQ } from "../../lib/curriculum";
import { Play, Send, Lightbulb, ScanSearch, Copy, Check, ListChecks } from "lucide-react";

const LANGS = [
  { id: "python", label: "Python", lang: "python", starter: "# Write your solution\ndef solve():\n    pass\n\nprint(solve())" },
  { id: "javascript", label: "JavaScript", lang: "javascript", starter: "// Write your solution\nfunction solve() {\n}\nconsole.log(solve());" },
  { id: "c", label: "C", lang: "c", starter: "#include <stdio.h>\nint main() {\n    return 0;\n}" },
  { id: "cpp", label: "C++", lang: "c++", starter: "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}" },
  { id: "java", label: "Java", lang: "java", starter: "public class Main {\n    public static void main(String[] args) {\n    }\n}" },
];

/** C / C++ / Java only appear when the deployment has a RUNNER_URL configured. */

const PROBLEMS = [
  { id: "p1", title: "Sum of list", topic: "Python Basics", desc: "Read n then n integers. Print their sum.", ex: "Input:\n3\n1 2 3\nOutput:\n6", tests: [{ stdin: "3\n1 2 3", out: "6" }, { stdin: "2\n10 20", out: "30" }] },
  { id: "p2", title: "Even or Odd", topic: "Control Flow", desc: "Read an integer. Print Even or Odd.", ex: "Input:\n7\nOutput:\nOdd", tests: [{ stdin: "7", out: "Odd" }, { stdin: "8", out: "Even" }] },
  { id: "p3", title: "Factorial", topic: "Functions", desc: "Read n. Print n! using a function.", ex: "Input:\n5\nOutput:\n120", tests: [{ stdin: "5", out: "120" }, { stdin: "0", out: "1" }] },
  { id: "p4", title: "Reverse string", topic: "Data Structures", desc: "Read a line. Print it reversed.", ex: "Input:\nhello\nOutput:\nolleh", tests: [{ stdin: "hello", out: "olleh" }, { stdin: "AI", out: "IA" }] },
];

export default function PracticePage() {
  // useSearchParams must live under a Suspense boundary — otherwise the whole
  // route stalls on the loading skeleton during streamed SSR (dev + prod).
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4 py-5">
          <div className="h-8 w-72 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded mt-2" />
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">
            <div className="h-52 bg-white rounded-[1.25rem] shadow-sm" />
            <div className="h-72 bg-white rounded-[1.25rem] shadow-sm" />
          </div>
        </div>
      }
    >
      <PracticeInner />
    </Suspense>
  );
}

function PracticeInner() {
  const topic = useSearchParams().get("topic") || "";
  const s = useProgress();
  const [tab, setTab] = useState<"solve" | "analyze" | "drill">("solve");
  const [prob, setProb] = useState(PROBLEMS[0]);
  const [lang, setLang] = useState(LANGS[0]);
  const [code, setCode] = useState(LANGS[0].starter);
  const [stdin, setStdin] = useState("");
  const [out, setOut] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ pass: boolean; got: string; want: string }[] | null>(null);
  interface Analysis {
    kind?: string;
    text?: string;
    explanation?: string;
    bugs?: string[];
    time?: string;
    space?: string;
    improvements?: string[];
    fixedCode?: string;
  }
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [engine, setEngine] = useState("");
  const [status, setStatus] = useState("");
  const [supported, setSupported] = useState<string[]>(["python", "javascript"]);
  const langs = LANGS.filter((l) => supported.includes(l.id));

  // ── Concept drill (§9): category × difficulty, real scoring ──
  const [drillCat, setDrillCat] = useState("python");
  const [drillDiff, setDrillDiff] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillPicks, setDrillPicks] = useState<Record<number, number>>({});
  const drillSet: PracticeQ[] = PRACTICE_BANK.filter((q) => q.cat === drillCat && q.diff === drillDiff);
  const drillQ = drillSet[drillIdx];
  const drillRight = Object.entries(drillPicks).filter(([i, p]) => drillSet[Number(i)]?.answer === p).length;
  const drillDone = Object.keys(drillPicks).length;

  const drillAnswer = (o: number) => {
    if (!drillQ || drillPicks[drillIdx] !== undefined) return;
    setDrillPicks((p) => ({ ...p, [drillIdx]: o }));
  };
  const drillNext = () => {
    if (drillIdx < drillSet.length - 1) setDrillIdx(drillIdx + 1);
    else if (drillSet.length > 0 && drillDone === drillSet.length) {
      // session finished → record the real score once
      recordQuiz(`Practice: ${PRACTICE_CATS.find((c) => c.id === drillCat)?.label} (${drillDiff})`, drillRight, drillSet.length, 0);
      logActivity(`Practice drill: ${PRACTICE_CATS.find((c) => c.id === drillCat)?.label}`, `${drillRight}/${drillSet.length} correct • ${drillDiff}`, "practice");
      toast(`Drill complete: ${drillRight}/${drillSet.length} ✓`);
      setDrillIdx(0);
      setDrillPicks({});
    }
  };
  const drillSwitch = (cat: string, diff: "Easy" | "Medium" | "Hard") => {
    setDrillCat(cat); setDrillDiff(diff); setDrillIdx(0); setDrillPicks({});
  };

  useEffect(() => {
    availableLanguages().then(setSupported).catch(() => setSupported(["python", "javascript"]));
  }, []);

  useEffect(() => {
    if (!topic) return;
    const tid = window.setTimeout(() => {
      const hit = PROBLEMS.find((p) => p.topic.toLowerCase().includes(topic.toLowerCase().split(" ")[0]));
      if (hit) setProb(hit);
    }, 0);
    return () => window.clearTimeout(tid);
  }, [topic]);

  const run = async (submit: boolean) => {
    const t0 = Date.now();
    setRunning(true);
    setOut("");
    setResults(null);
    setStatus("Starting…");
    const exec = (stdinStr: string) =>
      runCode({ language: lang.lang, code, stdin: stdinStr, timeoutMs: 5000, onStatus: setStatus });
    const norm = (t: string) => t.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
    try {
      if (!submit) {
        const r = await exec(stdin);
        setEngine(r.engine);
        setOut(r.timedOut ? r.stderr : r.stdout || r.stderr || "(no output)");
      } else {
        const rows: { pass: boolean; got: string; want: string }[] = [];
        for (const t of prob.tests) {
          setStatus("Running tests…");
          const r = await exec(t.stdin);
          setEngine(r.engine);
          const got = norm(r.timedOut ? r.stderr : r.stdout || r.stderr);
          rows.push({ pass: !r.timedOut && got === norm(t.out), got, want: t.out });
          setResults([...rows]);
        }
        setResults(rows);
        const passed = rows.filter((x) => x.pass).length;
        if (passed === rows.length && rows.length > 0) {
          logActivity(`Solved: ${prob.title}`, `${lang.label} • all tests passed`, "practice");
          toast("All tests passed ✓ logged to activity");
        } else {
          toast(`${passed}/${rows.length} tests passed`, "info");
        }
      }
    } catch (e) {
      setOut(`Execution failed: ${e instanceof Error ? e.message : String(e)}`);
      toast("Execution failed", "err");
    }
    setStatus("");
    // honest study time: only the seconds this run actually took
    recordStudy((Date.now() - t0) / 1000);
    setRunning(false);
  };

  const hint = async (kind: "hint" | "solution" | "optimize") => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: kind === "hint" ? "practice" : kind === "solution" ? "teach" : "review",
          profile: `level=${s.done.length}/12 units`,
          messages: [{ role: "user", content: `${kind === "hint" ? "Give ONLY a hint (not the solution)" : kind === "solution" ? "Explain the solution step by step" : "How to optimize this"} for '${prob.title}' (${lang.label}):\n${prob.desc}\nMy code:\n${code.slice(0, 2000)}` }],
        }),
      });
      const d = await res.json();
      setAnalysis({ kind, text: d.reply });
    } catch {
      toast("AI unavailable", "err");
    }
    setAnalyzing(false);
  };

  const analyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang.label }),
      });
      const d = await res.json();
      setAnalysis({ kind: "analysis", ...d.analysis });
    } catch {
      toast("AI unavailable", "err");
    }
    setAnalyzing(false);
  };

  return (
    <div>
      <TopHeader title="Coding Practice" subtitle="Real execution (Piston sandbox) + AI analyzer — never runs on our server" />
      <div className="flex gap-2 mb-4 flex-wrap">
        {([["solve", "🧩 Solve Problems"], ["analyze", "🔍 AI Code Analyzer"], ["drill", "📚 Concept Drill"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-[13px] font-bold transition ${tab === t ? "primary-gradient text-white shadow" : "card text-slate-500"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "drill" ? (
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4">
          {/* Category + difficulty selector */}
          <div className="space-y-3">
            <div className="card p-4">
              <b className="text-[13px] text-[#101a3f] flex items-center gap-1.5 mb-2"><ListChecks className="w-4 h-4 text-indigo-500" /> Category</b>
              <div className="space-y-1">
                {PRACTICE_CATS.map((c) => (
                  <button key={c.id} onClick={() => drillSwitch(c.id, drillDiff)} className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-semibold transition ${drillCat === c.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <b className="text-[13px] text-[#101a3f] block mb-2">Difficulty</b>
              <div className="flex gap-1.5">
                {(["Easy", "Medium", "Hard"] as const).map((d) => (
                  <button key={d} onClick={() => drillSwitch(drillCat, d)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition ${drillDiff === d ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{d}</button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{drillSet.length} question{drillSet.length === 1 ? "" : "s"} in this set • attempts are logged.</p>
            </div>
          </div>

          {/* Question card */}
          <div className="card p-6">
            {drillSet.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-[36px] mb-2">🗂️</div>
                <b className="text-[15px] text-[#101a3f]">No questions in this set yet</b>
                <p className="text-[13px] text-slate-500 mt-1">Pick another category or difficulty — the bank grows as the curriculum expands.</p>
              </div>
            ) : !drillQ ? (
              <div className="text-center py-10">
                <div className="text-[36px] mb-2">🎉</div>
                <b className="text-[15px] text-[#101a3f]">Drill finished: {drillRight}/{drillSet.length} correct</b>
                <p className="text-[13px] text-slate-500 mt-1">Score saved to your progress. Retry or switch categories.</p>
                <button onClick={() => { setDrillIdx(0); setDrillPicks({}); }} className="mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold">Retry this set</button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <span className="text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                    {PRACTICE_CATS.find((c) => c.id === drillCat)?.icon} {PRACTICE_CATS.find((c) => c.id === drillCat)?.label} • {drillDiff}
                  </span>
                  <span className="text-[12px] text-slate-500">Q {drillIdx + 1} / {drillSet.length} {drillDone > 0 && `• ${drillRight} correct`}</span>
                </div>
                <div className="h-[7px] bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all" style={{ width: `${((drillIdx + 1) / drillSet.length) * 100}%` }} />
                </div>
                <div key={drillQ.id} className="pop-in">
                  <h2 className="font-extrabold text-[16px] text-[#101a3f] mb-3">{drillQ.q}</h2>
                  {drillQ.code && <pre className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-[12.5px] font-mono text-slate-700 mb-4 whitespace-pre-wrap">{drillQ.code}</pre>}
                  <div className="space-y-2.5">
                    {drillQ.options.map((op, o) => {
                      const pick = drillPicks[drillIdx];
                      const revealed = pick !== undefined;
                      const state = revealed
                        ? o === drillQ.answer ? "border-green-400 bg-green-50" : o === pick ? "border-red-300 bg-red-50" : "border-slate-200"
                        : "border-slate-200 hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-md";
                      return (
                        <button key={o} onClick={() => drillAnswer(o)} disabled={revealed} className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left text-[13.5px] transition ${state}`}>
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 ${revealed && o === drillQ.answer ? "border-green-500 bg-green-500 text-white" : revealed && o === pick ? "border-red-400 bg-red-400 text-white" : "border-slate-300 text-slate-500"}`}>
                            {["A", "B", "C", "D"][o]}
                          </span>
                          <span className="text-slate-700">{op}</span>
                        </button>
                      );
                    })}
                  </div>
                  {drillPicks[drillIdx] !== undefined && (
                    <div className="mt-4 rounded-xl p-3.5 bg-indigo-50/70 border border-indigo-100 text-[13px] text-slate-700 pop-in">
                      <b className="text-indigo-700">💡 Why: </b>{drillQ.why}
                    </div>
                  )}
                  <div className="flex justify-between mt-5">
                    <button onClick={() => setDrillIdx(Math.max(0, drillIdx - 1))} disabled={drillIdx === 0} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold disabled:opacity-50">← Previous</button>
                    <button onClick={drillNext} disabled={drillPicks[drillIdx] === undefined} className="px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold disabled:opacity-50">
                      {drillIdx === drillSet.length - 1 ? "Finish & Save ✓" : "Next →"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : tab === "solve" ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">
          <div className="space-y-3">
            {PROBLEMS.map((p) => (
              <button key={p.id} onClick={() => { setProb(p); setResults(null); setOut(""); }} className={`card p-4 text-left w-full transition ${prob.id === p.id ? "!border-indigo-400" : "hover:shadow-md"}`}>
                <b className="text-[14px] text-[#101a3f]">{p.title}</b>
                <p className="text-[12px] text-slate-500 mt-0.5">{p.topic} • {p.tests.length} tests</p>
              </button>
            ))}
            <div className="card p-4">
              <b className="text-[14px] text-[#101a3f]">{prob.title}</b>
              <p className="text-[12px] text-slate-600 mt-1">{prob.desc}</p>
              <pre className="bg-slate-50 rounded-lg p-3 text-[11px] font-mono text-slate-600 mt-2 whitespace-pre-wrap">{prob.ex}</pre>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-wrap">
              <select title={supported.length < LANGS.length ? "Python & JavaScript run instantly in your browser." : "Language"} value={lang.id} onChange={(e) => { const l = LANGS.find((x) => x.id === e.target.value)!; setLang(l); setCode(l.starter); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold bg-white outline-none">
                {langs.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <div className="ml-auto flex gap-2">
                <button onClick={() => hint("hint")} disabled={analyzing} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> AI Hint
                </button>
                <button onClick={() => run(false)} disabled={running} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white flex items-center gap-1 disabled:opacity-50">
                  <Play className="w-3.5 h-3.5" /> {running ? status || "Running…" : "Run"}
                </button>
                <button onClick={() => run(true)} disabled={running} className="text-[12px] font-bold px-3 py-1.5 rounded-lg primary-gradient text-white flex items-center gap-1 disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> Submit
                </button>
              </div>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="w-full h-[280px] bg-[#0e1530] text-slate-100 font-mono text-[12.5px] p-4 outline-none resize-y" />
            <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Custom input (stdin)</label>
                <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} className="mt-1 w-full h-[70px] border border-slate-200 rounded-lg p-2 font-mono text-[12px] outline-none" placeholder="3&#10;1 2 3" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                  <span>Output</span>
                  {engine && <span className="font-mono text-[10px] text-indigo-500">{engine}</span>}
                </label>
                <pre className="mt-1 w-full h-[70px] bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[12px] overflow-auto whitespace-pre-wrap">{out || status || "—"}</pre>
              </div>
            </div>
            {results && (
              <div className="px-4 pb-4 space-y-2">
                <div className={`text-[12.5px] font-bold rounded-lg px-3 py-2 border ${results.filter((r) => r.pass).length === results.length ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                  {results.filter((r) => r.pass).length}/{results.length} tests passed
                </div>
                {results.map((r, i) => (
                  <div key={i} className={`text-[12px] rounded-lg px-3 py-2 border ${r.pass ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    Test {i + 1}: {r.pass ? "✓ Passed" : `✗ got "${r.got}" want "${r.want}"`}
                  </div>
                ))}
              </div>
            )}
            {(analysis || analyzing) && (
              <div className="mx-4 mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[12px] text-slate-600 whitespace-pre-wrap">
                {analyzing ? "AI thinking…" : analysis?.text}
                {!analyzing && analysis && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => hint("solution")} className="text-[11px] font-bold text-indigo-600">Explain solution</button>
                    <button onClick={() => hint("optimize")} className="text-[11px] font-bold text-indigo-600">Optimize my code</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <select value={lang.id} onChange={(e) => setLang(LANGS.find((x) => x.id === e.target.value)!)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold bg-white outline-none">
                {langs.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <button onClick={analyze} disabled={analyzing || !code.trim()} className="ml-auto text-[12px] font-bold px-4 py-2 rounded-lg primary-gradient text-white flex items-center gap-1.5 disabled:opacity-50">
                <ScanSearch className="w-4 h-4" /> {analyzing ? "Analyzing…" : "Analyze"}
              </button>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="w-full h-[320px] bg-[#0e1530] text-slate-100 font-mono text-[12.5px] p-4 rounded-xl outline-none resize-y" placeholder="Paste code here…" />
          </div>
          <div className="space-y-3">
            {!analysis && !analyzing && <div className="card p-10 text-center text-slate-400 text-[13px]">Paste code + Analyze — bugs, complexity, improvements.</div>}
            {analyzing && <div className="card p-6 animate-pulse text-[13px] text-slate-500">AI is reviewing your code…</div>}
            {analysis?.explanation && (
              <>
                <div className="card p-5"><b className="text-[14px]">📖 Explanation</b><p className="text-[12px] text-slate-600 mt-1">{analysis.explanation}</p></div>
                {analysis.bugs && analysis.bugs.length > 0 && <div className="card p-5"><b className="text-[14px]">🐞 Bugs</b><ul className="text-[12px] text-slate-600 list-disc pl-4 mt-1">{analysis.bugs.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul></div>}
                <div className="card p-5 text-[12px] text-slate-600"><b className="text-[14px] text-[#101a3f]">⏱ Complexity</b><p className="mt-1">Time: <b className="font-mono">{analysis.time}</b> • Space: <b className="font-mono">{analysis.space}</b></p></div>
                {analysis.improvements && analysis.improvements.length > 0 && <div className="card p-5"><b className="text-[14px]">✨ Improvements</b><ul className="text-[12px] text-slate-600 list-disc pl-4 mt-1">{analysis.improvements.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul></div>}
                {analysis.fixedCode && (
                  <div className="card p-5">
                    <div className="flex justify-between items-center mb-2"><b className="text-[14px]">✅ Fixed version</b>
                      <button onClick={() => { navigator.clipboard.writeText(analysis.fixedCode ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">{copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} copy</button>
                    </div>
                    <pre className="bg-[#0e1530] text-slate-100 text-[12px] p-3 rounded-xl overflow-x-auto font-mono whitespace-pre">{analysis.fixedCode}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
