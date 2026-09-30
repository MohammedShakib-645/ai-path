"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";
import {
  useProgress, toggleUnit, completionInt, UNITS, nextUnit,
  studyTimeLabel, learnerLevel, setGoal, streakCount,
} from "../../lib/store";
import {
  Search, Sun, ArrowLeft, BookOpen, Clock, ChevronDown,
  Target, Star, Zap, Flame, Crown, Lightbulb,
} from "lucide-react";

export default function LearningPathPage() {
  const s = useProgress();
  const pct = completionInt(s);
  const upcoming = nextUnit(s);
  const level = learnerLevel(s);
  const [expanded, setExpanded] = useState<number | null>(4);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draft, setDraft] = useState(s.goal);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const studiedSet = new Set(s.streak);
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const monday = new Date();
  monday.setDate(monday.getDate() - todayIdx);
  const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">Learning Path</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Your personalized journey to master AI & Machine Learning</p>
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
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {level}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="space-y-4">
          {/* Banner */}
          <div className="card hero-gradient !border-0 p-6 text-white flex gap-4 items-center overflow-hidden relative">
            <div className="w-16 h-16 rounded-full bg-purple-600/60 border border-white/30 flex items-center justify-center shrink-0">
              <Target className="w-9 h-9" />
            </div>
            <div className="flex-1 relative z-10">
              <h2 className="text-[20px] font-extrabold">Your Learning Path</h2>
              <p className="text-[13px] text-white/90 mt-1">
                Based on your current level ({level}), we&apos;ve created a personalized roadmap to help you learn AI step by step.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                { [`${level} Level`, "Estimated: 4 Weeks", "12 Topics"].map((t) => (
                  <span key={t} className="bg-white/85 text-indigo-700 text-[11px] font-bold px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div className="hidden lg:block text-[13px] italic text-white/90 max-w-[180px] text-right relative z-10">
              <span className="text-white/60 text-[20px]">❝</span> Learn at your own pace, build your future. <span className="text-white/60 text-[20px]">❞</span>
            </div>
            <div className="hidden md:flex w-[90px] h-[90px] rounded-full bg-white/25 border border-white/40 items-center justify-center text-[56px] shrink-0 relative z-10">🤖</div>
          </div>

          {/* Stats */}
          <div className="card p-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-[72px] h-[72px] rounded-full border-[7px] border-slate-100 border-t-green-500 border-r-green-500 flex items-center justify-center">
                <div className="text-center leading-none">
                  <div className="font-extrabold text-[16px] text-[#101a3f]">{pct}%</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">Completed</div>
                </div>
              </div>
            </div>
            {[
              { v: `${s.done.length} / 12`, l: "Topics Completed", icon: <BookOpen className="w-5 h-5 text-blue-600" /> },
              { v: studyTimeLabel(s.studyMins), l: "Study Time", icon: <Clock className="w-5 h-5 text-indigo-600" /> },
              { v: level, l: "Current Level", icon: <Star className="w-5 h-5 text-amber-500" /> },
            ].map((x, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">{x.icon}</span>
                <span>
                  <span className="block font-extrabold text-[14px] text-[#101a3f]">{x.v}</span>
                  <span className="text-[11px] text-slate-500">{x.l}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Topics list */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-[16px] text-[#101a3f]">Learning Path (12 Topics)</h3>
              <button onClick={() => setExpanded(expanded === -1 ? null : -1)} className="text-[12px] text-indigo-600 font-semibold">
                Expand All ›
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-slate-100" />
              <div className="space-y-3">
                {UNITS.map((t) => {
                  const isDone = s.done.includes(t.id);
                  const status: string = isDone ? "Completed" : t.id === upcoming.id ? "In Progress" : "Not Started";
                  const open = expanded === t.id || expanded === -1;
                  return (
                    <div key={t.id} className="flex gap-3 items-start relative">
                      <button
                        onClick={() => toggleUnit(t.id)}
                        title="Click to mark complete / incomplete"
                        className={`w-9 h-9 rounded-full font-bold text-[13px] flex items-center justify-center shrink-0 z-10 transition ${
                          isDone ? "bg-green-500 text-white" : status === "In Progress" ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {isDone ? "✓" : t.id}
                      </button>
                      <div className="flex-1 border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
                        <div className="flex justify-between gap-3">
                          <div className="flex gap-3">
                            <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[22px] shrink-0">{t.icon}</span>
                            <div>
                              <div className="font-bold text-[14px] text-[#101a3f]">{t.title}</div>
                              <div className="text-[12px] text-slate-500">Unit {t.id} of 12 — core concepts, examples and practice.</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status === "Completed" ? "bg-green-100 text-green-700" : status === "In Progress" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                              {status}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" /> {t.hours}
                            </div>
                          </div>
                        </div>
                        {open && (
                          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                            <button onClick={() => toggleUnit(t.id)} className="text-[12px] text-indigo-600 font-semibold">
                              {isDone ? "Mark incomplete" : "Mark complete"}
                            </button>
                            <Link href="/quizzes" className="text-[12px] font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 rounded-lg">
                              Take Quiz →
                            </Link>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setExpanded(open && expanded !== -1 ? null : t.id)} className="mt-4 text-slate-400 hover:text-slate-600 shrink-0">
                        <ChevronDown className={`w-4 h-4 transition ${open && expanded !== -1 ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">🎯 Your Learning Goals</h3>
              <button onClick={() => { if (editingGoal) setGoal(draft); else setDraft(s.goal); setEditingGoal(!editingGoal); }} className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {editingGoal ? "Save" : "Edit"}
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-[13px]">
              <span className="text-[18px]">👑</span> <b className="text-[#101a3f]">{editingGoal ? <input value={draft} onChange={(e) => setDraft(e.target.value)} className="border rounded px-1 text-[12px] w-full mt-1" /> : s.goal}</b>
              <p className="text-slate-500 text-[12px] mt-1">Become confident in AI/ML and create useful applications.</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2">💡 Recommended Next</h3>
            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4">
              <div className="font-bold text-[14px] text-[#101a3f]">{upcoming.title}</div>
              <p className="text-[12px] text-slate-500">Picked from your live progress — continue where you left off.</p>
              <Link href="/quizzes" className="mt-3 inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg">
                Continue Learning →
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-600">
              {[
                ["Take a Quiz", "/quizzes"], ["Ask AI Tutor", "/ai-tutor"],
                ["View Progress", "/progress"], ["Change Level", "/settings"],
              ].map(([t, h]) => (
                <Link key={t as string} href={h as string} className="border border-slate-100 rounded-xl py-3 px-2 text-center hover:bg-slate-50 bg-white shadow-sm">{t}</Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-1 flex items-center gap-2">🔥 Study Streak</h3>
            <p className="text-[13px] font-extrabold text-[#101a3f]">{streakCount(s)} Days</p>
            <p className="text-[11px] text-slate-500 mb-3">Keep going!</p>
            <div className="flex justify-between">
              {weekDays.map((d, i) => {
                const dt = new Date(monday);
                dt.setDate(monday.getDate() + i);
                const hit = studiedSet.has(keyOf(dt));
                return (
                  <div key={d} className="text-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${hit ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {hit ? "✓" : "○"}
                    </div>
                    <div className="text-[10px] mt-1 text-slate-500">{d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
