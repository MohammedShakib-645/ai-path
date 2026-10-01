"use client";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import SearchBox from "../../components/SearchBox";
import ProfileName from "../../components/ProfileName";
import {
  useProgress, completionInt, avgScore, streakCount, CATEGORIES, catPct,
  UNITS, nextUnit, relTime, learnerLevel,
} from "../../lib/store";
import { SKILL_DOMAINS, domainPct, totalDone, TOTAL_LESSONS, PROJECTS, ACHIEVEMENTS, unlockedIds } from "../../lib/curriculum";
import {
  Search, Sun, ArrowLeft, BookOpen, CheckCircle2, Clock, Flame,
  Lightbulb, AlertTriangle, Trophy, Folder,
} from "lucide-react";

export default function ProgressPage() {
  const s = useProgress();
  const pct = completionInt(s);
  const avg = avgScore(s);
  const streak = streakCount(s);
  const upcoming = nextUnit(s);
  const level = learnerLevel(s);

  // Real chart: only actual quiz scores — never a padded/fake point.
  const chartAttempts = s.attempts.slice(-7);
  const points = chartAttempts.map((a) => Math.round((a.score / Math.max(1, a.total)) * 100));
  const dayLabels = chartAttempts.map((a) => new Date(a.at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }));
  const W = 520, H = 180;
  const nPts = points.length;
  const xAt = (i: number) => (nPts <= 1 ? 30 + (W - 30) / 2 : 30 + i * ((W - 30) / (nPts - 1)));
  const coords = points.map((p, i) => `${xAt(i).toFixed(1)},${(H - (p / 100) * H).toFixed(1)}`);
  const line = `M ${coords.join(" L ")}`;
  const area = nPts ? `M 30,${H} L ${coords.join(" L ")} L ${W},${H} Z` : "";

  const weakAll = SKILL_DOMAINS.map((d) => ({ ...d, pct: domainPct(s, d.levelIds) })).sort((a, b) => a.pct - b.pct);
  const hasEvidence = totalDone(s) > 0 || s.attempts.length > 0;
  // Weak = attempted but low (0<pct<60); untouched-but-progressed = 0%. Never random.
  const weak = weakAll.filter((d) => d.pct < 60).slice(0, 3);
  const projectsDone = (s.projects ?? []).length;
  const badges = unlockedIds(s).length;

  const actIcon = (kind: string) =>
    kind === "quiz"
      ? { bg: "bg-green-100", icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> }
      : kind === "started"
      ? { bg: "bg-purple-100", icon: <span className="text-purple-600 text-[14px]">▶</span> }
      : kind === "tutor"
      ? { bg: "bg-yellow-100", icon: <span className="text-[14px]">⭐</span> }
      : { bg: "bg-blue-100", icon: <BookOpen className="w-5 h-5 text-blue-600" /> };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">Progress Dashboard</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Track your learning journey and see how far you&apos;ve come!</p>
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

      <div className="stagger grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="stagger grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { t: "Course Lessons", v: `${totalDone(s)}`, sub: `Completed ${totalDone(s)} / ${TOTAL_LESSONS}`, w: TOTAL_LESSONS ? Math.round((totalDone(s) / TOTAL_LESSONS) * 100) : 0, icon: <BookOpen className="w-5 h-5 text-white" />, bg: "bg-indigo-500" },
              { t: "Quizzes Taken", v: `${s.attempts.length}`, sub: s.attempts.length ? `Avg. Score ${avg}%` : "No quizzes yet", w: avg, icon: <CheckCircle2 className="w-5 h-5 text-white" />, bg: "bg-green-500" },
              { t: "Study Time", v: `${s.labHours} hrs`, sub: "Real time studied", w: Math.min(100, Math.round((s.labHours / 20) * 100)), icon: <Clock className="w-5 h-5 text-white" />, bg: "bg-blue-500" },
              { t: "Current Streak", v: `${streak} days`, sub: streak === 0 ? "Start with any task" : "Keep it up!", w: Math.min(100, streak * 20), icon: <Flame className="w-5 h-5 text-white" />, bg: "bg-orange-400" },
            ].map((c, i) => (
              <div key={i} className="card p-4">
                <div className="flex gap-2 items-center">
                  <span className={`w-10 h-10 rounded-2xl ${c.bg} flex items-center justify-center shrink-0`}>{c.icon}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{c.t}</span>
                </div>
                <div className="font-extrabold text-[22px] text-[#101a3f] mt-1">{c.v}</div>
                <div className="text-[11px] text-slate-400">{c.sub}</div>
                <div className="h-[6px] bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-green-400 rounded-full transition-all" style={{ width: `${c.w}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            {/* Chart — real quiz scores only; honest empty state before the first quiz */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-[15px] text-[#101a3f]">Learning Progress Overview</h3>
                <span className="text-[11px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-500">{nPts ? `Last ${nPts} Quiz${nPts > 1 ? "zes" : ""}` : "No quiz data yet"}</span>
              </div>
              {nPts === 0 ? (
                <div className="flex flex-col items-center justify-center py-9 text-center">
                  <span className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center mb-2"><BookOpen className="w-5 h-5 text-indigo-400" /></span>
                  <p className="text-[12.5px] text-slate-500 max-w-[240px]">Your trend appears here after your first real quiz — nothing is shown before you actually use it.</p>
                  <Link href="/quizzes" className="mt-3 text-[12px] font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 rounded-lg hover:-translate-y-0.5 transition">Take a quiz →</Link>
                </div>
              ) : (
                <>
              <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full">
                <defs>
                  <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 25, 50, 75, 100].map((v) => (
                  <g key={v}>
                    <line x1="30" x2={W} y1={H - (v / 100) * H} y2={H - (v / 100) * H} stroke="#eef2f7" />
                    <text x="0" y={H - (v / 100) * H + 4} fontSize="10" fill="#94a3b8">{v}%</text>
                  </g>
                ))}
                <path d={area} fill="url(#pgrad)" />
                {nPts > 1 && <polyline points={coords.join(" ")} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                {coords.map((pt, i) => {
                  const [cx, cy] = pt.split(",");
                  return <circle key={i} cx={cx} cy={cy} r="4.5" fill="#6366f1" stroke="white" strokeWidth="2" />;
                })}
                <g>
                  <rect x={Math.max(30, W - 52)} y={Math.max(4, H - (points[nPts - 1] / 100) * H - 30)} width="46" height="22" rx="6" fill="#4f46e5" />
                  <text x={Math.max(30, W - 52) + 23} y={Math.max(4, H - (points[nPts - 1] / 100) * H - 30) + 15} fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">{points[nPts - 1]}%</text>
                </g>
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 px-7">
                {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
              </div>
                </>
              )}
            </div>

            {/* Ring */}
            <div className="card p-5 flex flex-col items-center">
              <div className="relative w-[132px] h-[132px]">
                <svg width="132" height="132" viewBox="0 0 132 132">
                  <circle cx="66" cy="66" r="54" fill="none" stroke="#eef1f7" strokeWidth="13" />
                  <circle
                    cx="66" cy="66" r="54" fill="none" stroke="#22c55e" strokeWidth="13" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - pct / 100)}
                    transform="rotate(-90 66 66)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[24px] text-[#101a3f]">{pct}%</b>
                  <span className="text-[10px] text-slate-500">Overall Progress</span>
                </div>
              </div>
              <div className="bg-blue-50/60 rounded-xl p-3 mt-4 text-left text-[12px] text-slate-600 w-full">
                {s.done.length === 0 ? (
                  <>🚀 <b className="text-[#101a3f]">Just getting started!</b>
                  <br />
                  Complete your first unit and it will show up here — nothing is faked before you do.</>
                ) : (
                  <>🚀 <b className="text-[#101a3f]">Great Progress!</b>
                  <br />
                  {s.done.length} of {UNITS.length} units done — keep it up!</>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            {/* Skill development — 10 AI domains from real course completion */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[15px] text-[#101a3f]">Skill Development</h3>
                <span className="text-[11px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-500">{totalDone(s)} / {TOTAL_LESSONS} lessons</span>
              </div>
              {totalDone(s) === 0 ? (
                <p className="text-[12.5px] text-slate-500 py-2">Complete your first course lesson and every skill bar below fills in from real progress — nothing is pre-filled.</p>
              ) : (
                SKILL_DOMAINS.map((d) => {
                  const p = domainPct(s, d.levelIds);
                  const st = p === 100 ? "Completed" : p > 0 ? "In Progress" : "Not Started";
                  return (
                    <div key={d.id} className="flex items-center gap-3 mb-3">
                      <span className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[18px] shrink-0">{d.icon}</span>
                      <span className="w-[120px] text-[13px] font-semibold text-slate-700 shrink-0">{d.label}</span>
                      <div className="flex-1 h-[8px] bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all" style={{ width: `${p}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-500 w-[44px] text-right shrink-0">{p}%</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${st === "Completed" ? "bg-green-100 text-green-700" : st === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {st}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Weak topics — real evidence only */}
            <div className="card p-5">
              <div className="flex justify-between mb-3 items-center">
                <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Weak Topics
                </h3>
                <Link href="/doubt" className="text-[11px] text-indigo-600 font-medium">Ask AI →</Link>
              </div>
              {!hasEvidence ? (
                <p className="text-[12px] text-slate-500">No evidence yet — finish a lesson or take a quiz and your weak areas appear here (computed only from real results).</p>
              ) : weak.length === 0 ? (
                <p className="text-[12px] text-green-600 font-semibold">🎉 No weak topics under 60% — every started skill is strong. Keep going!</p>
              ) : weak.map((d) => (
                <div key={d.id} className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-[16px] shrink-0">{d.icon}</span>
                  <span className="flex-1">
                    <b className="text-[13px] text-[#101a3f] block">{d.label}</b>
                    <span className="text-[11px] text-slate-400">Mastery: {d.pct}%</span>
                  </span>
                  <Link href={`/quizzes`} className={`text-[10px] font-bold px-2 py-1 rounded-full ${d.pct === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                    {d.pct === 0 ? "Needs Practice" : "Practice More"}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Projects + Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><Folder className="w-4 h-4 text-purple-500" /> Projects Completed</h3>
              <div className="flex items-center gap-4">
                <b className="text-[28px] text-[#101a3f]">{projectsDone}<span className="text-[15px] text-slate-400">/{PROJECTS.length}</span></b>
                <div className="flex-1 h-[9px] bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full" style={{ width: `${(projectsDone / PROJECTS.length) * 100}%` }} />
                </div>
              </div>
              <Link href="/projects" className="mt-3 inline-block text-[12px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-500 px-4 py-2 rounded-lg">
                {projectsDone ? "Continue projects →" : "Browse projects →"}
              </Link>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Achievements</h3>
              <div className="flex items-center gap-4">
                <b className="text-[28px] text-[#101a3f]">{badges}<span className="text-[15px] text-slate-400">/{ACHIEVEMENTS.length}</span></b>
                <div className="flex-1 h-[9px] bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${(badges / ACHIEVEMENTS.length) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {badges === 0 ? (
                  <span className="text-[11.5px] text-slate-500">Earn your first badge — complete a lesson or a 7-day streak.</span>
                ) : (
                  unlockedIds(s).map((id) => <span key={id} title={ACHIEVEMENTS.find((a) => a.id === id)?.desc} className="text-[20px]">{ACHIEVEMENTS.find((a) => a.id === id)?.icon}</span>)
                )}
              </div>
              <Link href="/achievements" className="mt-2 inline-block text-[12px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg">
                View all badges →
              </Link>
            </div>
          </div>

          {/* Quote bar */}
          <div className="card quote-bar p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Lightbulb className="w-5 h-5 text-indigo-600" /></span>
            <div>
              <b className="text-[13px] text-[#101a3f]">&ldquo;Progress, not perfection. Keep going!&rdquo;</b>
              <p className="text-[11px] text-slate-500">Every concept you learn builds your future.</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="card p-5 text-center">
            <div className="w-[64px] h-[64px] mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-[36px]">🤖</div>
            <div className="text-[12px] text-slate-500 mt-1">Your Level</div>
            <div className="font-extrabold text-[20px] text-[#101a3f]">{level}</div>
            <div className="text-[11px] text-slate-400">Keep learning, you&apos;re doing great!</div>
            <div className="h-[10px] bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1"><span>Level 1</span><span>Next Level</span></div>
          </div>

          <div className="card p-5">
            <div className="flex justify-between mb-3 items-center">
              <h3 className="font-bold text-[15px] text-[#101a3f]">🕐 Recent Activity</h3>
              <span className="text-[11px] text-indigo-600 font-medium">View All</span>
            </div>
            <div className="space-y-3 text-[12px]">
              {s.activity.length === 0 && (
                <p className="text-[12px] text-slate-500">No activity yet — every action you take shows up here in real time.</p>
              )}
              {s.activity.slice(0, 4).map((a, i) => {
                const ic = actIcon(a.kind);
                return (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className={`w-9 h-9 rounded-xl ${ic.bg} flex items-center justify-center shrink-0`}>{ic.icon}</span>
                    <span className="flex-1"><b className="text-[#101a3f]">{a.text}</b><br /><span className="text-slate-400">{a.detail}</span></span>
                    <span className="text-slate-400 text-[10px] shrink-0">{relTime(a.at)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">💡 Recommended Next</h3>
            <div className="bg-purple-50/70 rounded-xl p-3 text-[13px]">
              <b className="text-[#101a3f]">{upcoming.title}</b>
              <p className="text-slate-500 text-[12px]">Unit {upcoming.id} of 12 — picked from your live progress.</p>
              <Link href="/learning-path" className="mt-2 inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg">
                Continue Learning →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
