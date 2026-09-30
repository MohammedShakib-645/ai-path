"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import { logActivity, useProgress } from "../../lib/store";
import { Play, Send, Lightbulb, ScanSearch, Copy, Check } from "lucide-react";

const LANGS = [
  { id: "python", label: "Python", piston: "python", starter: "# Write your solution\ndef solve():\n    pass\n\nprint(solve())" },
  { id: "javascript", label: "JavaScript", piston: "javascript", starter: "// Write your solution\nfunction solve() {\n}\nconsole.log(solve());" },
  { id: "c", label: "C", piston: "c", starter: "#include <stdio.h>\nint main() {\n    return 0;\n}" },
  { id: "cpp", label: "C++", piston: "c++", starter: "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}" },
  { id: "java", label: "Java", piston: "java", starter: "public class Main {\n    public static void main(String[] args) {\n    }\n}" },
];

const PROBLEMS = [
  { id: "p1", title: "Sum of list", topic: "Python Basics", desc: "Read n then n integers. Print their sum.", ex: "Input:\n3\n1 2 3\nOutput:\n6", tests: [{ stdin: "3\n1 2 3", out: "6" }, { stdin: "2\n10 20", out: "30" }] },
  { id: "p2", title: "Even or Odd", topic: "Control Flow", desc: "Read an integer. Print Even or Odd.", ex: "Input:\n7\nOutput:\nOdd", tests: [{ stdin: "7", out: "Odd" }, { stdin: "8", out: "Even" }] },
  { id: "p3", title: "Factorial", topic: "Functions", desc: "Read n. Print n! using a function.", ex: "Input:\n5\nOutput:\n120", tests: [{ stdin: "5", out: "120" }, { stdin: "0", out: "1" }] },
  { id: "p4", title: "Reverse string", topic: "Data Structures", desc: "Read a line. Print it reversed.", ex: "Input:\nhello\nOutput:\nolleh", tests: [{ stdin: "hello", out: "olleh" }, { stdin: "AI", out: "IA" }] },
];

async function piston(language: string, code: string, stdin = "") {
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, version: "*", files: [{ content: code }], stdin }),
  });
  if (!res.ok) throw new Error(`Execution service HTTP ${res.status}`);
  return res.json();
}

export default function PracticePage() {
  const topic = useSearchParams().get("topic") || "";
  const s = useProgress();
  const [tab, setTab] = useState<"solve" | "analyze">("solve");
  const [prob, setProb] = useState(PROBLEMS[0]);
  const [lang, setLang] = useState(LANGS[0]);
  const [code, setCode] = useState(LANGS[0].starter);
  const [stdin, setStdin] = useState("");
  const [out, setOut] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ pass: boolean; got: string; want: string }[] | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (topic) {
      const hit = PROBLEMS.find((p) => p.topic.toLowerCase().includes(topic.toLowerCase().split(" ")[0]));
      if (hit) setProb(hit);
    }
  }, [topic]);

  const run = async (submit: boolean) => {
    setRunning(true);
    setOut("");
    setResults(null);
    try {
      if (!submit) {
        const r = await piston(lang.piston, code, stdin);
        setOut((r.run?.output ?? "") || (r.run?.stderr ?? "(no output)"));
      } else {
        const rows = [];
        for (const t of prob.tests) {
          const r = await piston(lang.piston, code, t.stdin);
          const got = (r.run?.output ?? "").trim();
          rows.push({ pass: got === t.out.trim(), got, want: t.out });
        }
        setResults(rows);
        const passed = rows.filter((x) => x.pass).length;
        if (passed === rows.length) {
          logActivity(`Solved: ${prob.title}`, `${lang.label} • all tests passed`, "practice");
          toast("All tests passed ✓ logged to activity");
        } else {
          toast(`${passed}/${rows.length} tests passed`, "info");
        }
      }
    } catch (e: any) {
      setOut(`Execution failed: ${e.message}`);
      toast("Execution service unavailable", "err");
    }
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
      <div className="flex gap-2 mb-4">
        {(["solve", "analyze"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-[13px] font-bold transition ${tab === t ? "primary-gradient text-white shadow" : "card text-slate-500"}`}>
            {t === "solve" ? "🧩 Solve Problems" : "🔍 AI Code Analyzer"}
          </button>
        ))}
      </div>

      {tab === "solve" ? (
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
              <select value={lang.id} onChange={(e) => { const l = LANGS.find((x) => x.id === e.target.value)!; setLang(l); setCode(l.starter); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] font-bold bg-white outline-none">
                {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <div className="ml-auto flex gap-2">
                <button onClick={() => hint("hint")} disabled={analyzing} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> AI Hint
                </button>
                <button onClick={() => run(false)} disabled={running} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white flex items-center gap-1 disabled:opacity-50">
                  <Play className="w-3.5 h-3.5" /> {running ? "Running…" : "Run"}
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
                <label className="text-[11px] font-bold text-slate-500">Output</label>
                <pre className="mt-1 w-full h-[70px] bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono text-[12px] overflow-auto whitespace-pre-wrap">{out || "—"}</pre>
              </div>
            </div>
            {results && (
              <div className="px-4 pb-4 space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`text-[12px] rounded-lg px-3 py-2 border ${r.pass ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    Test {i + 1}: {r.pass ? "✓ Passed" : `✗ got "${r.got}" want "${r.want}"`}
                  </div>
                ))}
              </div>
            )}
            {(analysis || analyzing) && (
              <div className="mx-4 mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[12px] text-slate-600 whitespace-pre-wrap">
                {analyzing ? "AI thinking…" : analysis.text}
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
                {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
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
                {analysis.bugs?.length > 0 && <div className="card p-5"><b className="text-[14px]">🐞 Bugs</b><ul className="text-[12px] text-slate-600 list-disc pl-4 mt-1">{analysis.bugs.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul></div>}
                <div className="card p-5 text-[12px] text-slate-600"><b className="text-[14px] text-[#101a3f]">⏱ Complexity</b><p className="mt-1">Time: <b className="font-mono">{analysis.time}</b> • Space: <b className="font-mono">{analysis.space}</b></p></div>
                {analysis.improvements?.length > 0 && <div className="card p-5"><b className="text-[14px]">✨ Improvements</b><ul className="text-[12px] text-slate-600 list-disc pl-4 mt-1">{analysis.improvements.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul></div>}
                {analysis.fixedCode && (
                  <div className="card p-5">
                    <div className="flex justify-between items-center mb-2"><b className="text-[14px]">✅ Fixed version</b>
                      <button onClick={() => { navigator.clipboard.writeText(analysis.fixedCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">{copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />} copy</button>
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
