"use client";
import { useState, useEffect } from "react";
import TopHeader from "../../components/TopHeader";
import {
  User,
  Sliders,
  Terminal,
  Bell,
  Check,
  Eye,
  EyeOff,
  Key,
  Shield,
  Building,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "academics" | "lab" | "notifications">("profile");
  const [name, setName] = useState("Mohammed Shakib");
  const [studentId, setStudentId] = useState("CS-89241");
  const [email, setEmail] = useState("mohammed.shakib@student.path.edu");
  const [track, setTrack] = useState("Python Systems & Machine Learning");
  const [compilerMode, setCompilerMode] = useState("cpython312");
  const [groqKey, setGroqKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [aiProvider, setAiProvider] = useState<"auto" | "groq" | "ollama">("auto");
  const [academicDigest, setAcademicDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("ai-path-profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setName(parsed.name);
      } catch {
        // fallback
      }
    }
    const savedProvider = localStorage.getItem("ai-path-provider");
    if (savedProvider === "groq" || savedProvider === "ollama" || savedProvider === "auto") {
      setAiProvider(savedProvider);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(
      "ai-path-profile",
      JSON.stringify({ name, studentId, email, track, compilerMode })
    );
    localStorage.setItem("ai-path-provider", aiProvider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <TopHeader
        title="Student Account & Laboratory Settings"
        subtitle="Manage academic credentials, runtime configurations, and institutional notifications"
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Navigation Tabs */}
        <div className="pro-card p-2 space-y-1 self-start">
          {[
            { id: "profile", label: "Student Profile", icon: User },
            { id: "academics", label: "Curriculum Track", icon: Sliders },
            { id: "lab", label: "Lab Runtime & API", icon: Terminal },
            { id: "notifications", label: "Academic Notices", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="pro-card p-6 sm:p-7 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Student Identity & Enrollment</h3>
                <p className="text-xs text-slate-500">Official student registration records for course transcripts</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-base border border-slate-700">
                  MS
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mohammed Shakib</div>
                  <div className="text-[11px] text-slate-500 font-mono">ID: {studentId} • Degree Candidate</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Student Legal Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Institutional Email (.edu)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Curriculum Tab */}
          {activeTab === "academics" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Curriculum Track & Department</h3>
                <p className="text-xs text-slate-500">Course requirements, prerequisites, and graduation pacing</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Enrolled Program Track
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option>Python Systems & Machine Learning (Track CS-101)</option>
                  <option>Data Structures & Algorithm Complexity (Track CS-201)</option>
                  <option>Distributed Systems & Deep Learning (Track CS-301)</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900">Academic Standing Notice:</div>
                <p>
                  Switching curriculum tracks requires approval from the faculty advisor. Current course progress in CS-101 will transfer automatically.
                </p>
              </div>
            </div>
          )}

          {/* Laboratory Runtime Tab */}
          {activeTab === "lab" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Code Mentor Diagnostic Engine Configuration</h3>
                <p className="text-xs text-slate-500">Configure language runtime, compiler flags, and API connectivity</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  AI Engine — who answers the tutor?
                </label>
                <div className="space-y-2">
                  {[
                    { id: "groq", title: "Cloud (Groq) — recommended", desc: "Works for EVERY user of your app, on any device. Owner sets one free GROQ_API_KEY on the server." },
                    { id: "auto", title: "Auto — local first, cloud fallback", desc: "Uses your Ollama on this PC when running, otherwise cloud. Best of both." },
                    { id: "ollama", title: "Local Ollama only", desc: "Only this PC. Other users will see an offline message — browsers can't reach your localhost." },
                  ].map((o) => (
                    <label key={o.id} className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition ${aiProvider === o.id ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input
                        type="radio"
                        name="ai-provider"
                        checked={aiProvider === o.id}
                        onChange={() => setAiProvider(o.id as any)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <span>
                        <span className="block text-xs font-bold text-slate-900">{o.title}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5">{o.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Compiler / Interpreter Runtime
                </label>
                <select
                  value={compilerMode}
                  onChange={(e) => setCompilerMode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white font-mono"
                >
                  <option value="cpython312">CPython 3.12 (Standard Faculty Sandbox)</option>
                  <option value="pypy3">PyPy3 JIT (High-Performance Numerical)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-600" /> Groq Cloud API Key
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional Custom Key</span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs font-mono border border-slate-300 rounded-md pl-3 pr-9 py-2 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Engine: LLaMA-3.3-70B-Versatile (Standard Sub-second inference endpoint)
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Academic Digest & Examination Alerts</h3>
                <p className="text-xs text-slate-500">Configure reminder channels for course deliverables</p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3.5 rounded border border-slate-200 bg-slate-50">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Weekly Performance Summary</div>
                    <div className="text-[11px] text-slate-500">
                      Email digest detailing completed laboratory assignments and upcoming examination deadlines
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={academicDigest}
                    onChange={(e) => setAcademicDigest(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
            >
              Save Account Changes
            </button>

            {saved && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Settings updated successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
