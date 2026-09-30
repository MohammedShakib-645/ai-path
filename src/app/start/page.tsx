"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, ArrowRight } from "lucide-react";
import { completeOnboarding, useProgress } from "../../lib/store";
import { toast } from "../../components/Toaster";

export default function StartPage() {
  const s = useProgress();
  const r = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Learn Python and build real AI projects");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("Python");
  const [dailyMins, setDailyMins] = useState(45);

  useEffect(() => {
    if (s.onboarded) r.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.onboarded]);

  const done = () => {
    if (!goal.trim()) {
      toast("Tell us your goal first", "err");
      return;
    }
    completeOnboarding({ name: name.trim() || "Learner", goal: goal.trim(), level, language, dailyMins });
    toast("Learning path created ✓");
    r.push("/");
  };

  const field = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] bg-white outline-none";

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card p-8 max-w-[560px] w-full">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </span>
          <div>
            <h1 className="text-[24px] font-extrabold text-[#101a3f]">Welcome to AI-PATH 👋</h1>
            <p className="text-[13px] text-slate-500">Answer 4 questions — your personal path builds itself.</p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div>
            <label className="text-[13px] font-bold">1. Your name</label>
            <input value={name} placeholder="e.g. Alex Johnson" onChange={(e) => setName(e.target.value)} className={`${field} mt-1`} />
          </div>
          <div>
            <label className="text-[13px] font-bold">2. What do you want to achieve?</label>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className={`${field} mt-1`} placeholder="e.g. Learn Python for AI/ML" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-bold">3. Current level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${field} mt-1`}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-bold">Focus language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${field} mt-1`}>
                <option>Python</option>
                <option>JavaScript</option>
                <option>Java</option>
                <option>C++</option>
                <option>SQL</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[13px] font-bold">4. Daily study time: {dailyMins} min</label>
            <input type="range" min={15} max={180} step={15} value={dailyMins} onChange={(e) => setDailyMins(Number(e.target.value))} className="w-full mt-2 accent-indigo-600" />
          </div>
          <button onClick={done} className="w-full py-3 rounded-xl primary-gradient text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow">
            Create My Learning Path <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
