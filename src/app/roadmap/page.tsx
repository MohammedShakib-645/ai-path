"use client";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress, learnerLevel } from "../../lib/store";
import {
  LEVELS, coursePct, levelDone, levelTotal, totalDone,
  TOTAL_LESSONS, nextLesson,
} from "../../lib/curriculum";
import {
  ArrowLeft, ArrowRight, Check, Lock, Clock, BookOpen,
  Map, Target, Zap, Flag,
} from "lucide-react";

type NodeState = "completed" | "current" | "locked";

export default function RoadmapPage() {
  const s = useProgress();
  const level = learnerLevel(s);

  // Real per-level percentages from the shared curriculum store.
  const pcts = LEVELS.map((lv) => coursePct(s, lv));

  // Current = first level with 0 < pct < 100, else the first untouched level
  // whose predecessors are all at least half done. Everything else is locked.
  let currentIdx = -1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (pcts[i] > 0 && pcts[i] < 100) { currentIdx = i; break; }
  }
  if (currentIdx === -1) {
    for (let i = 0; i < LEVELS.length; i++) {
      if (pcts[i] === 0 && pcts.slice(0, i).every((p) => p >= 50)) { currentIdx = i; break; }
    }
  }

  const stateOf = (i: number): NodeState =>
    pcts[i] === 100 ? "completed" : i === currentIdx ? "current" : "locked";

  const doneLessons = totalDone(s);
  const remaining = Math.max(0, TOTAL_LESSONS - doneLessons);
  const etaWeeks = Math.ceil((remaining * 0.5) / 7);
  const overallPct = TOTAL_LESSONS ? Math.round((doneLessons / TOTAL_LESSONS) * 100) : 0;
  const levelsDone = pcts.filter((p) => p === 100).length;
  const next = nextLesson(s);

  const segGreen = "bg-green-500";
  const segSlate = "bg-slate-200 dark:bg-slate-700";

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader
            title="AI Learning Roadmap"
            subtitle="Python → Mathematics → Data Science → ML → Deep Learning → NLP/CV → Generative AI → LLMs → AI Agents → Real-world Projects"
          />
        </div>
      </div>

      <div className="stagger grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
        {/* ── Zigzag timeline ─────────────────────────────────────────── */}
        <div className="card p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <Map className="w-4.5 h-4.5 text-indigo-600" />
            <h2 className="font-extrabold text-[16px] text-[#101a3f]">Your journey — 10 levels, one path</h2>
            <span className="ml-auto text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {levelsDone}/10 levels done
            </span>
          </div>

          <div>
            {LEVELS.map((lv, i) => {
              const pct = pcts[i];
              const st = stateOf(i);
              const done = levelDone(s, lv);
              const total = levelTotal(lv);
              const isLast = i === LEVELS.length - 1;

              const pill =
                st === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : st === "current"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
              const nodeCls =
                st === "completed"
                  ? "bg-green-500 text-white shadow-[0_0_0_6px_rgba(34,197,94,0.15)]"
                  : st === "current"
                    ? "primary-gradient text-white shadow-[0_0_0_6px_rgba(99,102,241,0.18)]"
                    : "bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700";
              const barCls = st === "completed" ? "bg-green-500" : st === "current" ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600";

              return (
                <div key={lv.id} className="relative pb-7 last:pb-0">
                  {/* connector segments: green when the level above is completed */}
                  {i > 0 && (
                    <div
                      className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-0 h-12 w-[3px] rounded-full ${
                        pcts[i - 1] === 100 ? segGreen : segSlate
                      }`}
                    />
                  )}
                  {!isLast && (
                    <div
                      className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-12 bottom-0 w-[3px] rounded-full ${
                        pct === 100 ? segGreen : segSlate
                      }`}
                    />
                  )}

                  {/* node (always clickable — locked levels are never blocked) */}
                  <Link
                    href={`/courses/${lv.id}`}
                    title={
                      st === "locked"
                        ? `${lv.title} — Unlocks after previous level`
                        : `${lv.title} — ${pct}% complete`
                    }
                    className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-6 z-10 w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-[15px] transition hover:scale-110 ${nodeCls}`}
                  >
                    {st === "completed" ? (
                      <Check className="w-6 h-6" />
                    ) : st === "current" ? (
                      lv.icon
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </Link>

                  {/* card — left / right alternating on desktop (zigzag) */}
                  <div
                    className={`pl-14 md:pl-0 md:w-1/2 ${
                      i % 2 === 0 ? "md:pr-6" : "md:ml-[50%] md:pl-6"
                    }`}
                  >
                    <Link
                      href={`/courses/${lv.id}`}
                      className="block card p-4 border-l-4 transition hover:-translate-y-0.5 hover:shadow-md"
                      style={{
                        borderLeftColor:
                          st === "completed" ? "#22c55e" : st === "current" ? "#6366f1" : "#e2e8f0",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-[22px] shrink-0">
                          {lv.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-extrabold text-[15px] text-[#101a3f]">
                              {lv.title}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${pill}`}>
                              {st === "completed" && <Check className="w-3 h-3" />}
                              {st === "current" && <Zap className="w-3 h-3" />}
                              {st === "locked" && <Lock className="w-3 h-3" />}
                              {st === "completed" ? "Completed" : st === "current" ? "In Progress" : "Locked"}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-0.5">{lv.subtitle}</p>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {done}/{total} lessons
                            </span>
                            <span className="font-extrabold text-[#101a3f]">{pct}%</span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${barCls}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {st === "locked" && (
                            <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                              <Flag className="w-3 h-3" /> Unlocks after previous level — you can still open it.
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right rail: journey stats ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="card hero-gradient !border-0 p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5" />
              <h3 className="font-extrabold text-[16px]">Journey Stats</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[34px] font-extrabold leading-none">{overallPct}%</span>
              <span className="text-[13px] text-white/85 mb-1">of the full curriculum</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="text-[12px] text-white/90 mt-2">
              {doneLessons} of {TOTAL_LESSONS} lessons completed
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-[15px] text-[#101a3f] flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-600" /> Road ahead
            </h3>
            {[
              {
                icon: <BookOpen className="w-4 h-4 text-blue-600" />,
                v: `${doneLessons} / ${TOTAL_LESSONS}`,
                l: "Lessons completed",
              },
              {
                icon: <Map className="w-4 h-4 text-indigo-600" />,
                v: currentIdx >= 0 ? LEVELS[currentIdx].title : "All levels done",
                l: "Current level",
              },
              {
                icon: <Clock className="w-4 h-4 text-amber-500" />,
                v: remaining === 0 ? "Journey complete" : `≈ ${etaWeeks} week${etaWeeks === 1 ? "" : "s"}`,
                l:
                  remaining === 0
                    ? "Every lesson is finished"
                    : `${remaining} lessons × 0.5h at 7h/week`,
              },
              {
                icon: <Check className="w-4 h-4 text-green-600" />,
                v: `${levelsDone} / 10`,
                l: "Levels completed",
              },
            ].map((x, i) => (
              <div key={i} className="stat-tile flex items-center gap-3 rounded-xl px-3.5 py-3">
                <span className="stat-icon w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                  {x.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold text-[13.5px] text-[#101a3f] truncate">{x.v}</span>
                  <span className="text-[11px] text-slate-500">{x.l}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-1">Continue where you left off</h3>
            <p className="text-[12px] text-slate-500 mb-3">
              Next up: <b className="text-[#101a3f]">{next.lesson.title}</b> — {next.module.title} · {next.level.title}
            </p>
            <Link
              href={`/lesson/${next.lesson.id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold hover:-translate-y-0.5 hover:shadow-md transition"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Legend</h3>
            <div className="space-y-2 text-[12px] text-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </span>
                Completed — 100% of lessons done
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full primary-gradient" />
                In Progress — your active level right now
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" />
                Locked — unlocks after previous level (still open to browse)
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              You&apos;re currently at the <b className="text-[#101a3f]">{level}</b> level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
