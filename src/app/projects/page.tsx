"use client";
import { useState } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress } from "../../lib/store";
import { PROJECTS } from "../../lib/curriculum";
import { ArrowLeft, ArrowRight, Check, Folder, Filter, Sparkles } from "lucide-react";

type LevelFilter = "All" | "Beginner" | "Intermediate" | "Advanced";
const FILTERS: LevelFilter[] = ["All", "Beginner", "Intermediate", "Advanced"];

const LEVEL_BADGE: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function ProjectsPage() {
  const s = useProgress();
  const [filter, setFilter] = useState<LevelFilter>("All");

  const completed = s.projects ?? [];
  const doneCount = PROJECTS.filter((p) => completed.includes(p.id)).length;
  const pct = PROJECTS.length ? Math.round((doneCount / PROJECTS.length) * 100) : 0;
  const list = PROJECTS.filter((p) => filter === "All" || p.level === filter);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dashboard" className="text-[#101a3f] hover:text-indigo-600 mt-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader
            title="AI Projects"
            subtitle="12 real portfolio projects — from regression to autonomous agents."
          />
        </div>
      </div>

      {/* Header stats (real) */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6 text-indigo-600" />
          </span>
          <div className="flex-1 min-w-[200px]">
            <div className="font-extrabold text-[20px] text-[#101a3f] leading-tight">
              {doneCount} / {PROJECTS.length} completed
            </div>
            <div className="text-[12px] text-slate-500 mb-2">Tick a project off from its detail page — progress is saved locally.</div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full primary-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-[26px] font-extrabold text-indigo-600">{pct}%</div>
        </div>
      </div>

      {/* Filter chips (real client-side filter) */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 mr-1">
          <Filter className="w-4 h-4" /> Level:
        </span>
        {FILTERS.map((f) => {
          const n = f === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.level === f).length;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[12px] font-extrabold px-4 py-2 rounded-full border transition ${
                active
                  ? "primary-gradient text-white border-transparent shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
              }`}
            >
              {f} <span className={active ? "text-white/80" : "text-slate-400"}>({n})</span>
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="stagger grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((p) => {
          const done = completed.includes(p.id);
          return (
            <div
              key={p.id}
              className={`card p-5 flex flex-col transition hover:-translate-y-1 hover:shadow-lg ${
                done ? "border-green-300 dark:border-green-700" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${LEVEL_BADGE[p.level]}`}>
                  {p.level}
                </span>
                {done && (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-green-600">
                    <Check className="w-4 h-4" /> Done
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-[15.5px] text-[#101a3f] leading-snug">{p.title}</h3>
              <p className="text-[12.5px] text-slate-500 mt-1.5 flex-1 leading-relaxed">{p.problem}</p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10.5px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Sparkles className="w-3.5 h-3.5" /> {p.concepts.length} concepts
                </span>
                <Link
                  href={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-white primary-gradient px-4 py-2 rounded-lg hover:-translate-y-0.5 hover:shadow-md transition"
                >
                  View Project <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-[36px] mb-2">🔍</div>
          <b className="text-[15px] text-[#101a3f]">No {filter} projects</b>
          <p className="text-[13px] text-slate-500 mt-1">Try another level filter.</p>
        </div>
      )}
    </div>
  );
}
