"use client";
import { useState } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import { useProgress, savePlan, toggleTask, logActivity } from "../../lib/store";
import { CalendarCheck, Sparkles } from "lucide-react";

export default function PlannerPage() {
  const s = useProgress();
  const [goal, setGoal] = useState(s.prefs.goal || s.goal || "Learn Python in 30 days");
  const [hours, setHours] = useState(1);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!goal.trim()) {
      toast("Enter a goal first", "err");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, hoursPerDay: hours, targetDate: target, level: s.prefs.level }),
      });
      const d = await res.json();
      savePlan({ goal, days: d.days, createdAt: Date.now() });
      logActivity(`Study plan: ${goal.slice(0, 40)}`, `${d.days.length} days`, "plan");
      toast("Study plan created ✓");
    } catch {
      toast("AI unavailable — try again", "err");
    }
    setLoading(false);
  };

  const doneCount = s.plan?.days.reduce((a, d) => a + d.tasks.filter((t) => t.done).length, 0) ?? 0;
  const totalCount = s.plan?.days.reduce((a, d) => a + d.tasks.length, 0) ?? 0;

  return (
    <div>
      <TopHeader title="Study Planner" subtitle="AI builds the plan from your goal — you check tasks off" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.6fr] gap-4">
        <div className="card p-5 space-y-3 self-start">
          <div>
            <label className="text-[13px] font-bold">Goal</label>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-indigo-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-bold">Hours / day</label>
              <input type="number" min={0.5} max={8} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[13px] font-bold">Target date</label>
              <input type="date" value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none" />
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-2.5 rounded-xl primary-gradient text-white font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50">
            <Sparkles className="w-4 h-4" /> {loading ? "Building your plan…" : "Generate Plan"}
          </button>
        </div>

        <div>
          {!s.plan ? (
            <div className="card p-12 text-center">
              <div className="text-[40px] mb-2">🗓️</div>
              <b className="text-[15px] text-[#101a3f]">No study plan yet</b>
              <p className="text-[13px] text-slate-500 mt-1">Set a goal — AI drafts day-by-day tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="card p-4 flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <b className="text-[14px] flex-1">{s.plan.goal}</b>
                <span className="text-[12px] text-slate-500 font-mono">{doneCount}/{totalCount} done</span>
              </div>
              {s.plan.days.map((d, di) => (
                <div key={di} className="card p-4">
                  <b className="text-[13px] text-[#101a3f]">{d.date}</b>
                  <div className="mt-2 space-y-1.5">
                    {d.tasks.map((t) => (
                      <label key={t.id} className="flex items-center gap-2.5 text-[13px] cursor-pointer bg-slate-50 rounded-lg px-3 py-2">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(di, t.id)} className="w-4 h-4 accent-indigo-600" />
                        <span className={t.done ? "line-through text-slate-400" : "text-slate-700"}>{t.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Link href="/learning-path" className="text-[12px] font-bold text-indigo-600">Open a task's lesson in Learning Path →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
