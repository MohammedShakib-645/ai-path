"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";
import ProfileName from "../../components/ProfileName";
import {
  useProgress, useHydrated, toggleUnit, completionInt, UNITS, nextUnit,
  studyTimeLabel, learnerLevel, setGoal, streakCount,
} from "../../lib/store";
import { UNIT_EXTRAS, LIBRARY_LINKS } from "../../lib/unitExtras";
import { relTime } from "../../lib/engine";
import { selectUnitEtaWeeks, isNewUser } from "../../lib/selectors";
import { EmptyState, Skeleton } from "../../components/ui";
import {
  ArrowLeft, BookOpen, Clock, ChevronDown,
  Target, Star, Zap, ExternalLink, FileText, Library, History,
} from "lucide-react";

export default function PathView({ embedded = false }: { embedded?: boolean } = {}) {
  const s = useProgress();
  const ready = useHydrated();
  const eta = selectUnitEtaWeeks(s);
  const pct = completionInt(s);
  const upcoming = nextUnit(s);
  const level = learnerLevel(s);
  const [expanded, setExpanded] = useState<number | null>(4);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draft, setDraft] = useState(s.goal);
  const [panel, setPanel] = useState<{ id: number; kind: "cheat" | "res" } | null>(null);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const studiedSet = new Set(s.streak);
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const monday = new Date();
  monday.setDate(monday.getDate() - todayIdx);
  const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div>
      {/* Header — hidden when embedded under /learn (TopHeader lives there) */}
      {!embedded && (
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
              <div className="text-[13px] font-bold text-[#101a3f]"><ProfileName /></div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {level}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="stagger grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="space-y-4">
          {/* Banner */}
          <div className="card p-6 flex gap-4 items-center overflow-hidden relative border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 dark:bg-indigo-500/20 dark:border-white/10">
              <Target className="w-9 h-9 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="flex-1 relative z-10">
              <h2 className="text-[20px] font-extrabold text-[#101a3f] dark:text-slate-50">Your Learning Path</h2>
              <p className="text-[13px] text-slate-600 mt-1 dark:text-slate-400">
                Based on your current level ({level}), we&apos;ve created a personalized roadmap to help you learn AI step by step.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                { [`${level} Level`, UNITS.length - s.done.length <= 0 ? "All topics done" : `Estimated: ${eta} Week${eta === 1 ? "" : "s"}`, `${UNITS.length} Topics`].map((t) => (
                  <span key={t} className="bg-white/85 text-indigo-700 text-[11px] font-bold px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div className="hidden lg:block text-[13px] italic text-slate-500 max-w-[180px] text-right relative z-10 dark:text-slate-400">
              <span className="text-indigo-300 text-[20px]">❝</span> Learn at your own pace, build your future. <span className="text-indigo-300 text-[20px]">❞</span>
            </div>
            <div className="hidden md:flex w-[90px] h-[90px] rounded-full bg-indigo-100 border border-indigo-200 items-center justify-center text-[56px] shrink-0 relative z-10 dark:bg-white/5 dark:border-white/10">🤖</div>
          </div>

          {/* Stats — skeleton while hydrating; honest "Start here" for new users */}
          {!ready ? (
            <div className="card p-4 flex items-center gap-3 flex-wrap">
              <Skeleton className="h-[72px] w-[72px] rounded-full" />
              <Skeleton className="h-[54px] flex-1 min-w-[140px]" />
              <Skeleton className="h-[54px] flex-1 min-w-[140px]" />
              <Skeleton className="h-[54px] flex-1 min-w-[140px]" />
            </div>
          ) : isNewUser(s) ? (
            <div className="card p-4">
              <EmptyState
                icon="🎯"
                title="Start here — take your first lesson"
                body="Your progress numbers fill in from real activity. Nothing is shown before you actually learn."
                cta={{ label: "Take your first lesson", href: "/learn/1" }}
                className="py-6"
              />
            </div>
          ) : (
          <div className="card p-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative w-[72px] h-[72px] shrink-0">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#eef1f7" strokeWidth="7" className="lp-ring-track" />
                  <circle
                    cx="36" cy="36" r="30" fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - pct / 100)}
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <div className="font-extrabold text-[16px] text-[#101a3f]">{pct}%</div>
                  <div className="text-[8px] text-slate-500 mt-0.5">Completed</div>
                </div>
              </div>
            </div>
            {[
              { v: `${s.done.length} / ${UNITS.length}`, l: "Topics Completed", icon: <BookOpen className="w-5 h-5 text-blue-600" /> },
              { v: studyTimeLabel(s.studyMins), l: "Study Time", icon: <Clock className="w-5 h-5 text-indigo-600" /> },
              { v: level, l: "Current Level", icon: <Star className="w-5 h-5 text-amber-500" /> },
            ].map((x, i) => (
              <div key={i} className="stat-tile flex items-center gap-2 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                <span className="stat-icon w-9 h-9 rounded-full flex items-center justify-center">{x.icon}</span>
                <span>
                  <span className="block font-extrabold text-[14px] text-[#101a3f]">{x.v}</span>
                  <span className="text-[11px] text-slate-500">{x.l}</span>
                </span>
              </div>
            ))}
          </div>
          )}

          {/* Topics list */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-[16px] text-[#101a3f]">Learning Path ({UNITS.length} Topics)</h3>
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
                              <div className="text-[12px] text-slate-500">Unit {t.id} of 12 — lesson, cheat sheet, resources &amp; quiz.</div>
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
                        {open && UNIT_EXTRAS[t.id] && (
                          <>
                            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link href={`/learn/${t.id}`} className="text-[12px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 hover:-translate-y-0.5 transition flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5" /> Lesson
                                </Link>
                                <button
                                  onClick={() => setPanel(panel?.id === t.id && panel.kind === "cheat" ? null : { id: t.id, kind: "cheat" })}
                                  className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 hover:-translate-y-0.5 ${panel?.id === t.id && panel.kind === "cheat" ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"}`}
                                >
                                  <FileText className="w-3.5 h-3.5" /> Cheat Sheet
                                </button>
                                <button
                                  onClick={() => setPanel(panel?.id === t.id && panel.kind === "res" ? null : { id: t.id, kind: "res" })}
                                  className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 hover:-translate-y-0.5 ${panel?.id === t.id && panel.kind === "res" ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"}`}
                                >
                                  <Library className="w-3.5 h-3.5" /> Resources
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleUnit(t.id)} className="text-[12px] text-indigo-600 font-semibold hover:text-indigo-400">
                                  {isDone ? "Mark incomplete" : "Mark complete"}
                                </button>
                                <Link href="/quizzes" className="text-[12px] font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition">
                                  Take Quiz →
                                </Link>
                              </div>
                            </div>
                            {panel?.id === t.id && panel.kind === "cheat" && (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 pop-in">
                                <div className="text-[12px] font-extrabold text-amber-700 mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {t.title} — Cheat Sheet</div>
                                <div className="grid sm:grid-cols-2 gap-2.5">
                                  {UNIT_EXTRAS[t.id].cheat.map((sec, si) => (
                                    <div key={si} className="rounded-lg bg-white border border-slate-100 p-2.5">
                                      <div className="text-[11px] font-bold text-[#101a3f] mb-1">{sec.h}</div>
                                      {sec.rows.map((r, ri) => (
                                        <div key={ri} className="text-[11px] font-mono text-slate-600 leading-relaxed whitespace-pre-wrap">{r}</div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {panel?.id === t.id && panel.kind === "res" && (
                              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 pop-in">
                                <div className="text-[12px] font-extrabold text-blue-700 mb-2 flex items-center gap-1.5"><Library className="w-3.5 h-3.5" /> {t.title} — Resources</div>
                                <div className="space-y-1.5">
                                  {UNIT_EXTRAS[t.id].resources.map((r, ri) => (
                                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12.5px] text-slate-600 hover:text-indigo-600 hover:-translate-y-0.5 transition bg-white border border-slate-100 rounded-lg px-2.5 py-2">
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                      <span className="font-semibold truncate">{r.label}</span>
                                      <span className="ml-auto text-[10px] uppercase font-extrabold text-slate-400 shrink-0">{r.kind}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
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
              <Link href={`/learn/${upcoming.id}`} className="mt-3 inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition">
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

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Recent Activity</h3>
            {s.activity.length === 0 ? (
              <p className="text-[12px] text-slate-500">No activity yet — mark a unit complete or take a quiz to start your feed.</p>
            ) : (
              <div className="space-y-2.5">
                {s.activity.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.kind === "quiz" ? "bg-green-500" : a.kind === "unit" ? "bg-indigo-500" : "bg-amber-500"}`} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#101a3f] truncate">{a.text}</div>
                      <div className="text-[11px] text-slate-500">{a.detail} • {relTime(a.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><Library className="w-4 h-4" /> Resource Library</h3>
            <div className="space-y-1.5">
              {LIBRARY_LINKS.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12.5px] text-slate-600 hover:text-indigo-600 hover:-translate-y-0.5 transition bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold truncate">{r.label}</span>
                  <span className="ml-auto text-[10px] uppercase font-extrabold text-slate-400 shrink-0">{r.kind}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
