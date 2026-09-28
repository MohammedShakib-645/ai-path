"use client";
import Link from "next/link";
import TopHeader from "../components/TopHeader";
import { useProgress, completionPct, avgScore, streakCount, relTime, greeting, nextUnit, UNITS } from "../lib/store";
import {
  Terminal,
  CheckCircle2,
  Clock,
  Play,
  ChevronRight,
  Calendar,
  ArrowRight,
} from "lucide-react";

const MODULES = [
  { title: "Syntax Architecture & Runtime Model", units: [1, 2] },
  { title: "Linear Data Structures & Memory References", units: [3, 4] },
  { title: "Control Flow, Scopes & Branching Logic", units: [5, 6] },
  { title: "Functional Decomposition & Recursion", units: [7, 8] },
  { title: "Hash Tables, Dictionaries & Set Theory", units: [9, 10] },
  { title: "Applied Numerical Methods & ML Foundations", units: [11, 12] },
];

export default function Dashboard() {
  const s = useProgress();
  const pct = completionPct(s);
  const avg = avgScore(s);
  const streak = streakCount(s);
  const upcoming = nextUnit(s);
  const remaining = UNITS.length - s.done.length;

  return (
    <div className="space-y-6 pb-12">
      <TopHeader
        title="Student Coursework Overview"
        subtitle="Enrolled in CS-101: Systems Programming & Applied Artificial Intelligence"
      />

      <p className="text-sm text-slate-600 -mt-3">
        {greeting()}, Mohammed —{" "}
        <span className="font-semibold text-slate-900">
          {remaining === 0 ? "course complete. Capstone time!" : `${remaining} of ${UNITS.length} units to go. Keep the streak alive.`}
        </span>
      </p>

      {/* Primary Course Status Banner */}
      <div className="pro-card p-6 sm:p-7 border-slate-700 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 uppercase">
                COURSE CS-101
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Department of Computer Science & Engineering
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              Python Systems Programming & Applied Machine Learning
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Currently working on{" "}
              <span className="font-semibold text-white">
                Unit {String(upcoming.id).padStart(2, "0")}: {upcoming.title}
              </span>
              . Complete the remaining exercises before the upcoming checkpoint.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/learning-path"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume Lesson {upcoming.id}.3</span>
              </Link>
              <Link
                href="/ai-tutor"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Code Lab</span>
              </Link>
              <Link
                href="/learning-path"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <span>View Full Syllabus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Course Summary Box */}
          <div className="lg:w-80 p-4 rounded-lg bg-slate-800/90 border border-slate-700/80 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <span className="text-slate-400 font-semibold">Academic Pace</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> On Schedule
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center text-slate-300 mb-1.5 font-medium">
                <span>Curriculum Progress</span>
                <span className="font-bold text-white">{pct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{s.done.length} of {UNITS.length} Units Finished</span>
                <span>{remaining} Units Remaining</span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-700 flex justify-between">
              <span>Next Checkpoint:</span>
              <span className="text-slate-200 font-semibold">Oct 04, 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Course Completion", val: `${pct}%`, sub: `${s.done.length} of ${UNITS.length} Units`, change: "Live from your progress" },
          { label: "Average Quiz Score", val: s.attempts.length ? `${avg}%` : "—", sub: `${s.attempts.length} assessment${s.attempts.length === 1 ? "" : "s"} taken`, change: "Updates on every submit" },
          { label: "Laboratory Hours", val: `${s.labHours} hrs`, sub: "Logged this semester", change: "Grows as you work" },
          { label: "Study Streak", val: `${streak} day${streak === 1 ? "" : "s"}`, sub: streak > 0 ? "Keep it burning" : "Do one unit today", change: "Real calendar days" },
        ].map((kpi, idx) => (
          <div key={idx} className="pro-card p-5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.val}</div>
            <div className="text-xs font-semibold text-slate-700 pt-0.5">{kpi.sub}</div>
            <div className="text-[11px] text-slate-400 font-medium">{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Curriculum Syllabus + Deadlines */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <div className="pro-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Curriculum Units</h3>
              <p className="text-xs text-slate-500">Live status — tick units off in the syllabus</p>
            </div>
            <Link href="/learning-path" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Course Outline <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {MODULES.map((m, i) => {
              const doneCount = m.units.filter((u) => s.done.includes(u)).length;
              const status = doneCount === m.units.length ? "Completed" : doneCount > 0 ? "In Progress" : "Upcoming";
              const isDone = status === "Completed";
              const isCurrent = status === "In Progress";
              const hours = m.units.map((u) => UNITS[u - 1].hours).join(" + ");
              return (
                <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{m.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {hours}
                        </span>
                        <span>•</span>
                        <span>{doneCount}/{m.units.length} units done</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isCurrent ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {status}
                    </span>
                    <Link href="/learning-path" className="text-slate-400 hover:text-slate-700 text-xs font-semibold">Open →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="pro-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Assessment Deadlines
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Week 04</span>
            </div>
            <div className="space-y-3">
              {[
                { title: "Diagnostic Exam: Linear Structures", date: "Oct 02, 2026", weight: "15% Weight" },
                { title: "Lab Exercise 2.4: Tuple Slicing", date: "Oct 05, 2026", weight: "10% Weight" },
                { title: "Mid-Term Examination: Foundations", date: "Oct 18, 2026", weight: "25% Weight" },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-md bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{item.title}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-100/60 font-bold px-1.5 py-0.5 rounded shrink-0 ml-2">{item.weight}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Due: {item.date}</span>
                    <Link href="/quizzes" className="text-blue-600 font-semibold hover:underline">Enter Exam →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pro-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" /> Recent Activity
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
            </h3>
            <div className="space-y-2.5 text-xs">
              {s.activity.length === 0 && <p className="text-slate-400">No activity yet — finish a quiz to start the log.</p>}
              {s.activity.slice(0, 5).map((log, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0 border-slate-100">
                  <div>
                    <div className="font-mono font-semibold text-slate-900">{log.text}</div>
                    <div className="text-[11px] text-emerald-600 font-medium">{log.detail}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">{relTime(log.at)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link href="/ai-tutor" className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Launch Laboratory Environment <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
