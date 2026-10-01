"use client";
import { useState, useEffect } from "react";
import TopHeader from "../../components/TopHeader";
import { saveProfileName } from "../../lib/store";
import { User, Sliders, Cpu, Bell, Check, KeyRound, Loader2, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "track" | "engine" | "notices">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("");
  const [digest, setDigest] = useState(true);
  const [saved, setSaved] = useState(false);
  const [myGroq, setMyGroq] = useState("");
  const [myGemini, setMyGemini] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingRes, setPingRes] = useState<{ ok: boolean; msg: string } | null>(null);
  const [live, setLive] = useState<{ ok: boolean; groq: number; gemini: number } | null>(null);

  // Live engine status — real key counts + reachability, checked on mount.
  useEffect(() => {
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLive({ ok: !!d.ok, groq: d.pools?.groqKeys ?? 0, gemini: d.pools?.geminiKeys ?? 0 }))
      .catch(() => setLive({ ok: false, groq: 0, gemini: 0 }));
  }, []);

  useEffect(() => {
    const tid = window.setTimeout(() => {
      try {
        const k = localStorage.getItem("ai-path-my-keys");
        if (k) {
          const p = JSON.parse(k);
          setMyGroq(p.groq || "");
          setMyGemini(p.gemini || "");
          setKeySaved(!!(p.groq || p.gemini));
        }
      } catch { /* ignore */ }
    }, 0);
    return () => window.clearTimeout(tid);
  }, []);

  useEffect(() => {
    const tid = window.setTimeout(() => {
      try {
        const p = localStorage.getItem("ai-path-profile");
        if (p) {
          const parsed = JSON.parse(p);
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.track) setTrack(parsed.track);
        }
      } catch { /* ignore */ }
    }, 0);
    return () => window.clearTimeout(tid);
  }, []);

  const save = () => {
    saveProfileName(name);
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
          {([
            { id: "profile", label: "Profile", icon: User },
            { id: "track", label: "Learning Track", icon: Sliders },
            { id: "engine", label: "AI Engine", icon: Cpu },
            { id: "notices", label: "Notifications", icon: Bell },
          ] as const).map((t) => {
            const Icon = t.icon;
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
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
                <input value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#101a3f] block mb-1">Email</label>
                <input value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
              </div>
            </>
          )}

          {activeTab === "track" && (
            <>
              <div>
                <label className="text-[13px] font-bold text-[#101a3f] block mb-1">Enrolled Track</label>
                <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none bg-white">
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
              {live && (
                <div className={`flex items-center gap-2 p-3.5 rounded-xl text-[12.5px] font-bold ${live.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${live.ok ? "bg-green-500" : "bg-red-500"}`} />
                  {live.ok
                    ? `LIVE — AI is ON and answering now (${live.groq} Groq + ${live.gemini} Gemini keys, auto failover)`
                    : "Offline — no keys found in server env"}
                </div>
              )}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[12px] text-slate-600 space-y-1.5">
                <p><b className="text-[#101a3f]">Groq pool</b> (gpt-oss-120b) answers first. A key hitting its limit cools down 90s and the next key takes over instantly.</p>
                <p><b className="text-[#101a3f]">Gemini pool</b> (2.5-flash) is the backup if all Groq keys are busy.</p>
                <p className="font-mono text-[11px]">Owner: Vercel → Settings → Environment Variables → GROQ_KEYS=gsk_...,gsk_... and GEMINI_KEYS=AI...,AI...</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#101a3f]">
                  <KeyRound className="w-4 h-4 text-indigo-600" /> Use your own API key (optional)
                {keySaved && <span className="ml-auto text-[10.5px] font-bold text-green-600 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> active on this device</span>}
                </div>
                <p className="text-[11.5px] text-slate-500">Testing with your own key? Paste it below. It stays <b>only in this browser</b> (localStorage), is sent straight to the server for your requests, and is never shared, logged or committed.</p>
                <div>
                  <label className="text-[12px] font-bold text-[#101a3f] block mb-1">Groq key (gsk_…)</label>
                  <input type="password" value={myGroq} onChange={(e) => setMyGroq(e.target.value)} placeholder="gsk_..." autoComplete="off" className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-mono" />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-[#101a3f] block mb-1">Gemini key (AIza…)</label>
                  <input type="password" value={myGemini} onChange={(e) => setMyGemini(e.target.value)} placeholder="AIza..." autoComplete="off" className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-mono" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const groq = myGroq.trim(), gemini = myGemini.trim();
                      if (!groq && !gemini) { localStorage.removeItem("ai-path-my-keys"); setKeySaved(false); setPingRes({ ok: true, msg: "Removed — app pool is in use" }); return; }
                      localStorage.setItem("ai-path-my-keys", JSON.stringify({ groq, gemini }));
                      setKeySaved(true);
                      setPingRes(null);
                    }}
                    className="px-4 py-2 rounded-xl primary-gradient text-white font-bold text-[12.5px] shadow"
                  >{keySaved ? "Update keys" : "Save keys"}</button>
                  <button
                    onClick={async () => {
                      setPinging(true); setPingRes(null);
                      try {
                        const r = await fetch("/api/ai/ping", { method: "POST" });
                        const d = await r.json();
                        setPingRes(d.ok ? { ok: true, msg: `Live ✓ (${d.engine})` } : { ok: false, msg: d.error || "failed" });
                      } catch (e) { setPingRes({ ok: false, msg: e instanceof Error ? e.message : String(e) }); }
                      setPinging(false);
                    }}
                    disabled={pinging}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-[12.5px] text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition disabled:opacity-50 flex items-center gap-1.5"
                  >{pinging ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing…</> : "Test connection"}</button>
                  {keySaved && (
                    <button onClick={() => { localStorage.removeItem("ai-path-my-keys"); setMyGroq(""); setMyGemini(""); setKeySaved(false); setPingRes(null); }} className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-[12.5px] text-red-500 hover:border-red-300 transition">Remove</button>
                  )}
                </div>
                {pingRes && (
                  <div className={`text-[12px] font-semibold p-2.5 rounded-lg ${pingRes.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{pingRes.msg}</div>
                )}
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
