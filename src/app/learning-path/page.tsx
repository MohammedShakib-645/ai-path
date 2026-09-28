"use client";
import { useState } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress, toggleUnit, completionPct, UNITS } from "../../lib/store";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileCheck,
  GraduationCap,
} from "lucide-react";

export default function LearningPathPage() {
  const s = useProgress();
  const [expanded, setExpanded] = useState<number | null>(4);
  const pct = completionPct(s);

  return (
    <div className="space-y-6 pb-12">
      <TopHeader
        title="Curriculum Syllabus & Course Units"
        subtitle="Department of Computer Science • CS-101: Systems Programming & Applied AI"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="pro-card p-6 border-slate-700 bg-slate-900 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-700/50">
                    SYLLABUS // CS-101
                  </span>
                  <span className="text-xs text-slate-400">4.0 Academic Credits</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Python Systems Programming & Applied Machine Learning
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  A rigorous introduction to algorithmic problem solving, procedural abstraction, data structures, and computational machine learning.
                </p>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-xs text-slate-400 font-semibold">Overall Course Progress</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">{pct}%</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">{s.done.length} of {UNITS.length} Units Complete</div>
              </div>
            </div>
          </div>

          <div className="pro-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Coursework Units ({UNITS.length} Total Units)</h3>
                <p className="text-xs text-slate-500">Tap the number badge to mark a unit complete — dashboard updates instantly</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">Live: {pct}%</span>
            </div>

            <div className="space-y-3">
              {UNITS.map((topic, index) => {
                const isDone = s.done.includes(topic.id);
                const isCurrent = !isDone && (index === 0 || s.done.includes(UNITS[index - 1].id));
                const isExpanded = expanded === topic.id;

                return (
                  <div
                    key={topic.id}
                    className={`rounded-lg border transition-all ${
                      isCurrent ? "border-blue-500 bg-blue-50/20" : isDone ? "border-emerald-200 bg-emerald-50/15" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          onClick={() => toggleUnit(topic.id)}
                          className={`w-7 h-7 rounded font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition ${
                            isDone ? "bg-emerald-600 text-white" : isCurrent ? "bg-blue-600 text-white" : "bg-slate-100 border border-slate-300 text-slate-500"
                          }`}
                          title="Toggle completion status"
                        >
                          {isDone ? "✓" : `${String(topic.id).padStart(2, "0")}`}
                        </button>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">Unit {topic.id}: {topic.title}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isCurrent ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                              {isDone ? "Completed" : isCurrent ? "Active Unit" : "Prerequisite Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {topic.hours}
                        </span>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : topic.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          aria-label="Expand unit details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100/80 bg-slate-50/50 space-y-3 text-xs">
                        <div className="font-semibold text-slate-800">Learning Outcomes & Laboratory Breakdown:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2.5 bg-white border border-slate-200 rounded"><span className="font-semibold text-slate-900">Lecture:</span> Core concepts + memory semantics</div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded"><span className="font-semibold text-slate-900">Lab:</span> Test suite + edge cases</div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded"><span className="font-semibold text-slate-900">Reading:</span> Official Python docs</div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded"><span className="font-semibold text-slate-900">Assessment:</span> Graded diagnostic exam</div>
                        </div>
                        <div className="pt-2 flex items-center justify-between">
                          <button onClick={() => toggleUnit(topic.id)} className="text-xs font-semibold text-blue-600 hover:underline">
                            {isDone ? "Mark Unit Incomplete" : "Mark Unit Completed"}
                          </button>
                          <Link href="/quizzes" className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition">
                            Launch Examination <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="pro-card p-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" /> Course Grading Distribution
            </h4>
            <p className="text-xs text-slate-500">Official weighted evaluation policy for CS-101:</p>
            <div className="space-y-2 text-xs pt-1">
              {[["Examinations & Diagnostics", "40%"], ["Laboratory Programming Exercises", "35%"], ["Final Machine Learning Capstone", "25%"]].map(([a, b]) => (
                <div key={a} className="flex justify-between pb-1 border-b border-slate-100">
                  <span className="text-slate-700">{a}</span>
                  <span className="font-bold text-slate-900 font-mono">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pro-card p-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-700" /> Academic Milestones
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">Mid-Term Assessment Window</div>
                <div className="text-[11px] text-slate-500">Scheduled: October 15–20, 2026</div>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">Capstone Proposal Submission</div>
                <div className="text-[11px] text-slate-500">Scheduled: November 05, 2026</div>
              </div>
            </div>
          </div>

          <div className="pro-card p-5 bg-slate-50 space-y-2">
            <div className="font-bold text-xs text-slate-900">Laboratory Assistance</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Stuck on an exercise? The AI tutor answers from your local model or the shared cloud engine.
            </p>
            <Link href="/ai-tutor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pt-1">
              Open AI Tutor →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
