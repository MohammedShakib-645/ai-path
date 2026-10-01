"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import {
  useProgress, useHydrated, completionInt, UNITS, nextUnit, relTime, setGoal,
  streakCount, learnerLevel, avgScore,
} from "../../lib/store";
import { nextAction, weakTopics, dailyBrief } from "../../lib/engine";
import { selectSkills } from "../../lib/selectors";
import { SkeletonStat } from "../../components/ui";
import {
  nextLesson, ALL_LESSONS, PROJECTS, ACHIEVEMENTS,
  unlockedIds, LEVELS, coursePct, totalDone, TOTAL_LESSONS,
} from "../../lib/curriculum";
import {
  BookOpen, BotMessageSquare, ClipboardList, FlaskConical,
  CheckCircle2, ArrowRight, Target, Zap, Clock, Flame, Sparkles,
  Trophy, Folder, BarChart3,
} from "lucide-react";

function Ring({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e8edf7" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#dashg)" strokeWidth="11"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 60 60)" />
        <defs>
          <linearGradient id="dashg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold text-[#101a3f]">{pct}%</span>
        <span className="text-[10px] text-slate-500">Overall</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const s = useProgress();
  const ready = useHydrated();
  const [rec, setRec] = useState<{ focus: string; why: string } | null>(null);
  const [recEngine, setRecEngine] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const pct = completionInt(s);
  const act = nextAction(s);
  const weak = weakTopics(s, 1)[0];
  const brief = dailyBrief(s);
  const streak = streakCount(s);
  const week = Math.min(5, streak);

  // AI daily recommendation from REAL profile (falls back to heuristic silently)
  useEffect(() => {
    if (!s.onboarded) return;
    fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: `done ${s.done.length}/12, avg ${s.attempts.slice(-5).map((a) => `${a.quiz}:${a.score}/${a.total}`).join(",") || "none"}, weak ${weak?.label} ${weak?.mastery}%, streak ${streak}d, goal ${s.goal}`,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.recommendation?.focus) {
          setRec(d.recommendation);
          setRecEngine(String(d.engine ?? ""));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.onboarded]);

  // Hydration gate: render skeletons until localStorage state is loaded —
  // never a flash of empty/0 values for returning users.
  if (!ready) {
    return (
      <div>
        <TopHeader />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      </div>
    );
  }

  if (!s.onboarded) {
    return (
      <div>
        <TopHeader title="Welcome to AI-PATH 👋" subtitle="Your personal AI learning system" />
        <div className="card p-10 text-center max-w-[560px] mx-auto">
          <div className="text-[52px] mb-2">🚀</div>
          <h2 className="text-[20px] font-extrabold text-[#101a3f]">You haven&apos;t started a learning path yet</h2>
          <p className="text-[13px] text-slate-500 mt-1">Tell us your goal — your path, tutor and plan build themselves.</p>
          <Link href="/start" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl primary-gradient text-white font-bold text-[14px]">
            Create My Learning Path <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const actIcon = (kind: string) => {
    if (kind === "quiz") return { bg: "bg-purple-100 text-purple-600", icon: <ClipboardList className="w-4 h-4" /> };
    if (kind === "practice") return { bg: "bg-green-100 text-green-600", icon: <FlaskConical className="w-4 h-4" /> };
    if (kind === "tutor") return { bg: "bg-indigo-100 text-indigo-600", icon: <BotMessageSquare className="w-4 h-4" /> };
    return { bg: "bg-green-100 text-green-600", icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  return (
    <div>
      <TopHeader />

      {/* Continue learning — the core action */}
      <div className="card hero-gradient !border-0 p-6 text-white relative overflow-hidden mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">Continue Learning</div>
          <h2 className="text-[22px] font-extrabold mt-0.5">{act.title}</h2>
          <p className="text-[13px] text-white/90 mt-1">
            {rec ? rec.why : act.why}
            {recEngine.includes("offline") && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold bg-white/25 border border-white/40 rounded-full px-2 py-0.5 align-middle">
                ⚡ Offline — from your real progress
              </span>
            )}
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link href={act.href} className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-full text-[13px] font-bold shadow">
              {act.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/ai-tutor" className="inline-flex items-center gap-2 bg-white/20 border border-white/40 px-5 py-2.5 rounded-full text-[13px] font-bold">
              <BotMessageSquare className="w-4 h-4" /> Ask AI Tutor
            </Link>
          </div>
        </div>
        <Ring pct={pct} />
      </div>

      <div className="stagger grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 mb-4">
        {/* Today's briefing */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Today&apos;s Briefing</h3>
          <p className="text-[12px] text-slate-500 mb-2">From your real progress • {brief.focus}</p>
          <div className="space-y-2">
            {brief.steps.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2 text-[13px] text-slate-700">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
            {[
              { t: "Ask AI Tutor", d: "Explain my weak spots", href: "/ai-tutor", bg: "bg-green-50", tc: "text-green-700" },
              { t: "Take a Quiz", d: "Test yourself", href: "/quizzes", bg: "bg-purple-50", tc: "text-purple-700" },
              { t: "Practice Code", d: "Run real code", href: "/practice", bg: "bg-blue-50", tc: "text-blue-700" },
              { t: "View Progress", d: "Analytics", href: "/progress", bg: "bg-orange-50", tc: "text-orange-700" },
            ].map((a) => (
              <Link key={a.t} href={a.href} className={`${a.bg} rounded-xl p-3 block hover:shadow-md transition`}>
                <div className={`font-bold text-[12px] ${a.tc}`}>{a.t}</div>
                <div className="text-[11px] text-slate-500">{a.d}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Streak + weak topic + goal */}
        <div className="space-y-4">
          <div className="card p-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-[24px]">🔥</span>
            <div className="flex-1">
              <div className="font-extrabold text-[20px] text-[#101a3f]">{streak} day{streak === 1 ? "" : "s"}</div>
              <div className="text-[11px] text-slate-500">Current streak • goal {s.prefs.dailyMins} min/day</div>
            </div>
            <Link href="/activity" className="text-[12px] text-indigo-600 font-semibold">History →</Link>
          </div>

          {weak && weak.mastery < 100 && (
            <div className="card p-5">
              <h3 className="font-bold text-[14px] mb-1">⚠️ One weak topic</h3>
              <b className="text-[13px]">{weak.label} — {weak.mastery}% ({weak.stage})</b>
              <div className="flex gap-2 mt-2">
                <Link href="/quizzes" className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">Practice Now</Link>
                <Link href={`/ai-tutor?topic=${encodeURIComponent(weak.label)}`} className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700">Ask AI</Link>
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-[13px] flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-600" /> Learning Goal</span>
              <button onClick={() => { if (editing) { setGoal(draft); toast("Goal updated ✓"); } else setDraft(s.goal); setEditing(!editing); }} className="text-[12px] text-indigo-600 font-semibold">
                {editing ? "Save" : "Edit"}
              </button>
            </div>
            {editing ? (
              <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-[13px] outline-none" />
            ) : (
              <p className="text-[13px] text-slate-600">{s.goal || "Set your goal"}</p>
            )}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Weekly target — study 5 days</div>
              <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${(Math.min(5, streak) / 5) * 100}%` }} />
              </div>
              <div className="text-right text-[11px] text-slate-500 mt-0.5">{Math.min(5, streak)}/5</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skill mastery + quiz performance + achievements */}
      <div className="stagger grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Topic mastery from real course progress */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] mb-1 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> Topic Mastery</h3>
          <p className="text-[11px] text-slate-500 mb-3">Course completion per skill — computed only from lessons you actually finished.</p>
          <div className="space-y-2.5">
            {selectSkills(s).slice(0, 6).map((d) => {
              const pct = d.pct;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-[11.5px] mb-1">
                    <span className="font-semibold text-slate-600">{d.icon} {d.label}</span>
                    <span className={`font-bold ${pct >= 60 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {pct > 0 ? `${pct}%` : "Not started"}
                    </span>
                  </div>
                  {pct > 0 ? (
                    <div className="h-[7px] bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct >= 60 ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <div className="h-[7px] rounded-full border border-dashed border-slate-200 dark:border-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz performance + AI skill level */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-purple-500" /> Quiz Performance</h3>
          {s.attempts.length === 0 ? (
            <p className="text-[12.5px] text-slate-500">No quizzes yet — your first attempt sets the baseline.</p>
          ) : (
            <>
              <div className="flex items-end gap-1.5 h-[70px] mb-2">
                {s.attempts.slice(-8).map((a, i) => {
                  const p = Math.round((a.score / Math.max(1, a.total)) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${a.quiz}: ${p}%`}>
                      <div className={`w-full rounded-t ${p >= 60 ? "bg-green-400" : "bg-amber-400"}`} style={{ height: `${Math.max(6, p * 0.66)}px` }} />
                      <span className="text-[9px] text-slate-400">{p}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-500">Average (last 5)</span>
                <b className="text-[#101a3f]">{avgScore(s)}%</b>
              </div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-slate-500">AI Skill Level</span>
                <b className="text-indigo-600">{learnerLevel(s)}</b>
              </div>
            </>
          )}
          <div className="mt-3 rounded-xl bg-indigo-50/70 border border-indigo-100 p-3">
            <div className="text-[11px] font-bold text-indigo-700 mb-1">🏆 Achievements</div>
            <div className="flex flex-wrap gap-1.5">
              {unlockedIds(s).length === 0 ? (
                <span className="text-[11px] text-slate-500">None yet — finish lessons & streaks to earn badges.</span>
              ) : (
                unlockedIds(s).slice(0, 6).map((id) => {
                  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                  return <span key={id} title={a.desc} className="text-[16px]">{a.icon}</span>;
                })
              )}
            </div>
            <Link href="/achievements" className="text-[11px] text-indigo-600 font-semibold inline-block mt-1.5">View all {ACHIEVEMENTS.length} →</Link>
          </div>
        </div>

        {/* Recommended lessons + projects from real progress */}
        <div className="card p-5">
          <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Recommended For You</h3>
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-1.5">Next lessons</div>
          <div className="space-y-1.5 mb-3">
            {(() => {
              const doneSet = new Set(s.lessons ?? []);
              const picks = ALL_LESSONS.filter((x) => !doneSet.has(x.lesson.id)).slice(0, 3);
              if (!picks.length) return <p className="text-[12px] text-slate-500">Every curriculum lesson completed — incredible! 🎉</p>;
              return picks.map((x) => (
                <Link key={x.lesson.id} href={`/lesson/${x.lesson.id}`} className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl px-3 py-2 transition group">
                  <span className="text-[15px]">{x.level.icon}</span>
                  <span className="text-[12.5px] font-semibold text-slate-700 group-hover:text-indigo-700 truncate flex-1">{x.lesson.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{x.lesson.mins}m</span>
                </Link>
              ));
            })()}
          </div>
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-1.5">Projects to build</div>
          <div className="space-y-1.5">
            {PROJECTS.filter((p) => !(s.projects ?? []).includes(p.id)).slice(0, 2).map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-2 bg-purple-50/60 hover:bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 transition group">
                <Folder className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="text-[12.5px] font-semibold text-slate-700 group-hover:text-purple-700 truncate flex-1">{p.title}</span>
                <span className="text-[10px] font-bold text-purple-500 shrink-0">{p.level}</span>
              </Link>
            ))}
            {(s.projects?.length ?? 0) > 0 && (
              <div className="text-[11px] text-green-600 font-semibold">✓ {s.projects!.length}/{PROJECTS.length} projects completed</div>
            )}
          </div>
        </div>
      </div>

      {/* Course progress strip */}
      <div className="card p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-[15px] flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /> My Courses <span className="text-[11px] font-normal text-slate-400">({totalDone(s)}/{TOTAL_LESSONS} lessons)</span></h3>
          <Link href="/learn?view=catalog" className="text-[12px] text-indigo-600 font-medium">All courses →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {LEVELS.map((lv) => {
            const p = coursePct(s, lv);
            return (
              <Link key={lv.id} href={`/courses/${lv.id}`} className="border border-slate-100 rounded-xl p-3 hover:border-indigo-300 hover:shadow-md transition bg-white block">
                <div className="flex items-center justify-between">
                  <span className="text-[18px]">{lv.icon}</span>
                  <span className={`text-[11px] font-bold ${p === 100 ? "text-green-600" : p > 0 ? "text-indigo-600" : "text-slate-400"}`}>{p}%</span>
                </div>
                <div className="text-[12px] font-bold text-[#101a3f] mt-1 truncate">{lv.short}</div>
                <div className="h-[5px] bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full" style={{ width: `${Math.max(p, 1)}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity preview */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-[15px] flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Activity</h3>
          <Link href="/activity" className="text-[12px] text-indigo-600 font-medium">View All →</Link>
        </div>
        {s.activity.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-3">No activity yet — finish your first lesson and it appears here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {s.activity.slice(0, 4).map((a, i) => {
              const ic = actIcon(a.kind);
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className={`w-8 h-8 rounded-full ${ic.bg} flex items-center justify-center shrink-0`}>{ic.icon}</span>
                  <span className="flex-1 font-medium text-[13px] text-slate-700 truncate">{a.text}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{relTime(a.at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Level line */}
      <p className="text-[12px] text-slate-400 mt-3 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" /> Level: <b className="text-slate-600">{learnerLevel(s)}</b> • {s.done.length}/{UNITS.length} units • next: {nextUnit(s).title}
      </p>
    </div>
  );
}
