"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import { toast } from "../../../components/Toaster";
import { useProgress, toggleLesson } from "../../../lib/store";
import { LEVELS, coursePct, levelDone, levelTotal } from "../../../lib/curriculum";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";

export default function LevelPage() {
  const params = useParams();
  const levelId = Number(typeof params.levelId === "string" ? params.levelId : 0);
  const level = LEVELS.find((l) => l.id === levelId);
  const s = useProgress();

  if (!level) {
    return (
      <div>
        <TopHeader title="Level not found" subtitle="This course level doesn't exist" />
        <div className="card p-10 text-center max-w-[520px] mx-auto">
          <div className="text-[46px] mb-2">🧭</div>
          <b className="text-[16px] text-[#101a3f]">We couldn&apos;t find that level</b>
          <p className="text-[13px] text-slate-500 mt-1">It may have been renamed. Browse all 10 levels in the course catalog.</p>
          <Link href="/courses" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-xl primary-gradient text-white font-bold text-[14px]">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const pct = coursePct(s, level);
  const done = levelDone(s, level);
  const total = levelTotal(level);
  const doneSet = new Set(s.lessons ?? []);

  const onToggle = (lessonId: string, title: string) => {
    const nowDone = toggleLesson(lessonId);
    toast(nowDone ? `"${title}" marked complete ✓` : `"${title}" marked incomplete`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/courses" className="text-[#101a3f] hover:text-indigo-600" aria-label="Back to courses">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader
            title={`${level.icon} ${level.title}`}
            subtitle={`Level ${level.id} • ${level.subtitle}`}
          />
        </div>
      </div>

      {/* Level progress */}
      <div className="card p-5 mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative w-[84px] h-[84px] shrink-0">
          <svg width="84" height="84" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="34" fill="none" stroke="#eef1f7" strokeWidth="8" />
            <circle
              cx="42" cy="42" r="34" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - pct / 100)}
              transform="rotate(-90 42 42)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <div className="font-extrabold text-[18px] text-[#101a3f]">{pct}%</div>
            <div className="text-[8px] text-slate-500 mt-0.5">Completed</div>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="font-extrabold text-[15px] text-[#101a3f]">{done} of {total} lessons completed</div>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {level.modules.length} modules • {total} lessons • progress is saved on this device
          </p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3 max-w-[420px]">
            <div className={`h-full rounded-full bg-gradient-to-br ${level.grad} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link href="/courses" className="text-[12px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-100 transition">
          All courses
        </Link>
      </div>

      {/* Modules → lessons */}
      <div className="space-y-4">
        {level.modules.map((mod) => (
          <div key={mod.id} className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[20px] shrink-0">{mod.icon}</span>
              <div>
                <h3 className="font-extrabold text-[15px] text-[#101a3f]">{mod.title}</h3>
                <p className="text-[11px] text-slate-500">{mod.lessons.length} lessons</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {mod.lessons.map((lesson) => {
                const isDone = doneSet.has(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition ${
                      isDone ? "border-green-200 bg-green-50/60" : "border-slate-100 bg-white hover:border-indigo-200"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </span>

                    <div className="flex-1 min-w-[180px]">
                      <Link href={`/lesson/${lesson.id}`} className={`font-bold text-[13.5px] hover:text-indigo-600 ${isDone ? "text-green-700" : "text-[#101a3f]"}`}>
                        {isDone && "✓ "}{lesson.title}
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {lesson.topics.map((t) => (
                          <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.mins} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onToggle(lesson.id, lesson.title)}
                        className={`text-[11.5px] font-bold px-3 py-1.5 rounded-lg border transition ${
                          isDone ? "bg-green-100 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600"
                        }`}
                      >
                        {isDone ? "Completed ✓" : "Mark complete"}
                      </button>
                      <Link
                        href={`/lesson/${lesson.id}`}
                        className="text-[11.5px] font-bold px-3 py-1.5 rounded-lg primary-gradient text-white flex items-center gap-1"
                      >
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
