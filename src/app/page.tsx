"use client";
import { useState } from "react";
import Link from "next/link";
import TopHeader from "../components/TopHeader";
import {
  useProgress, completionInt, catPct, CATEGORIES, UNITS, nextUnit,
  relTime, setGoal, streakCount, learnerLevel,
} from "../lib/store";
import {
  BookOpen, BotMessageSquare, ClipboardList, BarChart3,
  CheckCircle2, ArrowRight, Target, Zap, Clock, ChevronRight,
} from "lucide-react";

function Ring({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e8edf7" strokeWidth="11" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#dashg)" strokeWidth="11"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 60 60)"
        />
        <defs>
          <linearGradient id="dashg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold text-[#101a3f]">{pct}%</span>
        <span className="text-[10px] text-slate-500">Overall Completion</span>
      </div>
    </div>
  );
}

const STEPPER_ICONS = ["🐍", "🗄️", "</>", "ƒx", "🔗", "🚀"];

export default function Dashboard() {
  const s = useProgress();
  const pct = completionInt(s);
  const upcoming = nextUnit(s);
  const week = Math.min(5, Math.max(streakCount(s), 1));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.goal);

  const activityIcon = (kind: string) => {
    if (kind === "quiz") return { bg: "bg-purple-100 text-purple-600", icon: <ClipboardList className="w-4 h-4" /> };
    if (kind === "started") return { bg: "bg-blue-100 text-blue-600", icon: <BookOpen className="w-4 h-4" /> };
    return { bg: "bg-green-100 text-green-600", icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  return (
    <div>
      <TopHeader />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_0.85fr] gap-4 mb-4">
        {/* Hero */}
        <div className="card hero-gradient !border-0 p-6 text-white relative overflow-hidden min-h-[212px] flex">
          <div className="flex-1 relative z-10">
            <h2 className="text-[22px] font-extrabold">Your AI Learning Companion</h2>
            <p className="text-[13px] text-white/90 mt-2 max-w-[320px]">
              Get personalized learning paths, interactive quizzes, progress tracking and expert guidance — all in one place.
            </p>
            <Link
              href="/learning-path"
              className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 rounded-full text-[13px] font-bold shadow-lg hover:opacity-95"
            >
              Continue Learning <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="hidden sm:flex items-center justify-center w-[130px] relative z-10">
            <div className="w-[104px] h-[104px] rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-[64px] shadow-xl">🤖</div>
          </div>
          <span className="absolute top-6 right-28 text-white/70 text-lg">✦</span>
          <span className="absolute top-8 right-10 text-white/70 text-xl">✦</span>
          <span className="absolute bottom-12 left-[46%] text-white/70">✦</span>
        </div>

        {/* Progress */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Your Learning Progress</h3>
          <div className="flex gap-4 items-center">
            <Ring pct={pct} />
            <div className="flex-1 space-y-3">
              {CATEGORIES.map((c) => {
                const p = catPct(s, c);
                return (
                  <div key={c.id}>
                    <div className="flex justify-between items-center text-[11px] font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className={`w-6 h-6 rounded-full ${c.iconBg} inline-flex items-center justify-center text-[12px]`}>{c.icon}</span>
                        {c.label}
                      </span>
                      <span className="text-slate-500">{p}%</span>
                    </div>
                    <div className="h-[6px] bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Level + Goal */}
        <div className="flex flex-col gap-4">
          <div className="card !p-0 overflow-hidden">
            <div className="hero-gradient p-4 flex items-center gap-3 text-white">
              <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] opacity-90">Current Level</div>
                <div className="font-extrabold text-[18px]">{learnerLevel(s)}</div>
              </div>
              <span className="text-[11px] font-semibold bg-white/25 px-2.5 py-1 rounded-full">Level 1</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[13px] text-[#101a3f] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" /> Learning Goal
                </span>
                <button onClick={() => { if (editing) { setGoal(draft); } else { setDraft(s.goal); } setEditing(!editing); }} className="text-[12px] text-indigo-600 font-semibold">
                  {editing ? "Save" : "Edit"}
                </button>
              </div>
              {editing ? (
                <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-[13px] outline-none mt-1" />
              ) : (
                <p className="text-[13px] text-slate-600">{s.goal}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { t: "Continue Learning", d: "Go to your next lesson", href: "/learning-path", bg: "bg-blue-50", icon: <BookOpen className="w-6 h-6 text-blue-600" />, btn: "bg-blue-500", tc: "text-blue-700" },
              { t: "Ask AI Tutor", d: "Get instant help & explanations", href: "/ai-tutor", bg: "bg-green-50", icon: <BotMessageSquare className="w-6 h-6 text-green-600" />, btn: "bg-green-500", tc: "text-green-700" },
              { t: "Take a Quiz", d: "Test your knowledge", href: "/quizzes", bg: "bg-purple-50", icon: <ClipboardList className="w-6 h-6 text-purple-600" />, btn: "bg-purple-500", tc: "text-purple-700" },
              { t: "View Progress", d: "Track your performance", href: "/progress", bg: "bg-orange-50", icon: <BarChart3 className="w-6 h-6 text-orange-500" />, btn: "bg-orange-400", tc: "text-orange-700" },
            ].map((a) => (
              <Link key={a.t} href={a.href} className={`${a.bg} rounded-2xl p-4 block hover:shadow-md transition`}>
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm">{a.icon}</div>
                <div className={`font-bold text-[13px] ${a.tc}`}>{a.t}</div>
                <div className="text-[11px] text-slate-500 mb-3">{a.d}</div>
                <span className={`w-8 h-8 rounded-full ${a.btn} text-white inline-flex items-center justify-center`}>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activity
            </h3>
            <Link href="/progress" className="text-[12px] text-indigo-600 font-medium">View All</Link>
          </div>
          <div className="space-y-3.5 text-[13px]">
            {s.activity.slice(0, 4).map((a, i) => {
              const ic = activityIcon(a.kind);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full ${ic.bg} flex items-center justify-center shrink-0`}>{ic.icon}</span>
                  <span className="flex-1 font-medium text-slate-700">{a.text}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{relTime(a.at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* Learning Path stepper */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Your Learning Path
            </h3>
            <Link href="/learning-path" className="text-[12px] text-indigo-600 font-medium flex items-center gap-1">
              View Full Path <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {UNITS.slice(0, 6).map((u, i) => {
              const done = s.done.includes(u.id);
              const current = !done && (i === 0 || s.done.includes(UNITS[i - 1].id));
              const status = done ? "Completed" : current ? "In Progress" : "Not Started";
              return (
                <div key={u.id} className="relative">
                  <div className={`rounded-xl border p-2.5 text-center h-full ${done ? "bg-green-50 border-green-200" : current ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"}`}>
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mb-1 ${done ? "bg-green-500 text-white" : current ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {u.id}
                    </div>
                    <div className="text-[20px] leading-none">{STEPPER_ICONS[i]}</div>
                    <div className="text-[11px] font-bold mt-1 leading-tight text-slate-700">{u.title}</div>
                    <div className={`text-[9px] mt-1.5 inline-flex px-1.5 py-0.5 rounded-full font-semibold ${done ? "bg-green-100 text-green-700" : current ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                      {done ? "✓ " : current ? "◉ " : "○ "}{status}
                    </div>
                  </div>
                  {i < 5 && <span className="hidden sm:block absolute top-1/2 -right-2.5 text-slate-300 text-[12px] z-10">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly goal */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] text-[#101a3f] mb-1 flex items-center gap-2">📅 Weekly Study Goal</h3>
          <p className="text-[12px] font-semibold text-slate-600 mb-2">Study 5 days this week</p>
          <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all" style={{ width: `${(week / 5) * 100}%` }} />
          </div>
          <div className="text-right text-[11px] text-slate-500 mb-3">{week}/5</div>
          <div className="bg-purple-50 rounded-xl p-3 text-[12px] text-slate-600">
            <span className="text-[18px] text-indigo-500 font-serif">❝</span>
            <span className="italic"> The expert in anything was once a beginner. </span>
            <br />
            <span className="text-[11px] text-slate-400">— Helen Hayes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
