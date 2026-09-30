"use client";
import { useState, useEffect } from "react";
import TopHeader from "../../components/TopHeader";
import { User, Sliders, Cpu, Bell, Check } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "track" | "engine" | "notices">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("");
  const [digest, setDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("ai-path-profile");
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.track) setTrack(parsed.track);
      }
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    try {
      localStorage.setItem("ai-path-profile", JSON.stringify({ name, email, track }));
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <TopHeader title="Settings" subtitle="Manage your profile, track and AI engine" />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 max-w-5xl">
        <div className="card p-2 space-y-1 self-start">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "track", label: "Learning Track", icon: Sliders },
            { id: "engine", label: "AI Engine", icon: Cpu },
            { id: "notices", label: "Notifications", icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-[13px] transition ${on ? "primary-gradient text-white font-bold shadow" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="card p-6 space-y-5">
          {activeTab === "profile" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-[26px]">👤</div>
                <div>
                  <div className="text-[14px] font-bold text-[#101a3f]">{name || "Add your name"}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> AI-Path Learner</div>
                </div>
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#101a3f] block mb-1">Full Name</label>
                <input value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#101a3f] block mb-1">Email</label>
                <input value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400" />
              </div>
            </>
          )}

          {activeTab === "track" && (
            <>
              <div>
                <label className="text-[13px] font-bold text-[#101a3f] block mb-1">Enrolled Track</label>
                <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none bg-white focus:border-indigo-400">
                  <option value="">Select your track</option>
                  <option>Python Systems & Machine Learning</option>
                  <option>Data Structures & Algorithms</option>
                  <option>Deep Learning Specialization</option>
                </select>
              </div>
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[12px] text-slate-600">
                Your tutor and quizzes adapt to this track automatically.
              </div>
            </>
          )}

          {activeTab === "engine" && (
            <>
              <div className="text-[13px] font-bold text-[#101a3f]">AI Engine — cloud key pools (automatic failover)</div>
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[12px] text-slate-600 space-y-1.5">
                <p><b className="text-[#101a3f]">Groq pool</b> (llama-3.3-70b) answers first. A key hitting its limit cools down 90s and the next key takes over instantly.</p>
                <p><b className="text-[#101a3f]">Gemini pool</b> (2.0-flash) is the backup if all Groq keys are busy.</p>
                <p className="font-mono text-[11px]">Owner: Vercel → Settings → Environment Variables → GROQ_KEYS=gsk_...,gsk_... and GEMINI_KEYS=AI...,AI...</p>
              </div>
            </>
          )}

          {activeTab === "notices" && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="text-[13px] font-bold text-[#101a3f]">Weekly Performance Summary</div>
                <div className="text-[12px] text-slate-500">Streak reminders and quiz recap for your learning week</div>
              </div>
              <input type="checkbox" checked={digest} onChange={(e) => setDigest(e.target.checked)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button onClick={save} className="px-6 py-2.5 rounded-xl primary-gradient text-white font-bold text-[13px] shadow">
              Save Changes
            </button>
            {saved && (
              <span className="text-[12px] font-semibold text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
