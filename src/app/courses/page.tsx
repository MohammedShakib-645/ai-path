"use client";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress } from "../../lib/store";
import {
  LEVELS, coursePct, levelDone, levelTotal, nextLesson, totalDone, TOTAL_LESSONS,
} from "../../lib/curriculum";
import { ArrowRight, BookOpen, Clock, PlayCircle } from "lucide-react";

export default function CoursesPage() {
  const s = useProgress();

  if (!s.onboarded) {
    return (
      <div>
        <TopHeader title="Courses" subtitle="The complete AI-PATH curriculum, level by level" />
        <div className="card p-10 text-center max-w-[560px] mx-auto">
          <div className="text-[52px] mb-2">📚</div>
          <h2 className="text-[20px] font-extrabold text-[#101a3f]">You haven&apos;t started a learning path yet</h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Courses unlock once you create your personalized path — it takes under a minute.
          </p>
          <Link href="/start" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl primary-gradient text-white font-bold text-[14px]">
            Create My Learning Path <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const done = totalDone(s);
  const overallPct = TOTAL_LESSONS ? Math.round((done / TOTAL_LESSONS) * 100) : 0;
  const next = nextLesson(s);

  return (
    <div>
      <TopHeader title="Courses" subtitle={`${TOTAL_LESSONS} lessons across 10 levels — from Python basics to AI agents`} />

      {/* Hero banner — overall course progress */}
      <div className="card hero-gradient !border-0 p-6 text-white relative overflow-hidden mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative z-10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">Overall course progress</div>
          <h2 className="text-[22px] font-extrabold mt-0.5">
            {done} of {TOTAL_LESSONS} lessons completed
          </h2>
          <div className="mt-3 max-w-[420px]">
            <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-white/90 mt-1.5">
              <span>{overallPct}% complete</span>
              <span>{TOTAL_LESSONS - done} lessons to go</span>
            </div>
          </div>
          <Link
            href={`/lesson/${next.lesson.id}`}
            className="inline-flex items-center gap-2 mt-4 bg-white text-indigo-700 px-5 py-2.5 rounded-full text-[13px] font-bold shadow"
          >
            <PlayCircle className="w-4 h-4" /> Continue Learning: {next.lesson.title}
          </Link>
        </div>
        <div className="hidden md:flex w-[90px] h-[90px] rounded-full bg-white/25 border border-white/40 items-center justify-center text-[48px] shrink-0 relative z-10">
          🎓
        </div>
      </div>

      {/* Level grid */}
      <div className="stagger grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {LEVELS.map((lv) => {
          const pct = coursePct(s, lv);
          const d = levelDone(s, lv);
          const t = levelTotal(lv);
          return (
            <div key={lv.id} className="card p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lv.grad} flex items-center justify-center text-[26px] shrink-0 shadow-sm`}>
                  {lv.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Level {lv.id}</div>
                  <h3 className="font-extrabold text-[15px] text-[#101a3f] leading-tight">{lv.title}</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">{lv.subtitle}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                  <span>{pct}% complete</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {d}/{t} lessons</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-br ${lv.grad} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {lv.modules.length} modules
                </span>
                <Link
                  href={`/courses/${lv.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl primary-gradient text-white text-[12px] font-bold"
                >
                  Open level <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
