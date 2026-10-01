"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TopHeader from "../../../components/TopHeader";
import { toast } from "../../../components/Toaster";
import { useProgress, toggleProject } from "../../../lib/store";
import { PROJECTS } from "../../../lib/curriculum";
import {
  ArrowLeft, Check, CheckCircle2, Copy, Target, ListChecks,
  Lightbulb, Code2, Megaphone, Terminal, AlertTriangle, ClipboardList,
  BotMessageSquare, Flag, Wrench,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const project = PROJECTS.find((p) => p.id === id);
  const s = useProgress();
  const [copied, setCopied] = useState(false);
  // Interactive checklist — purely local UI state, resets naturally per mount.
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const done = !!project && (s.projects ?? []).includes(project.id);

  const copyCode = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleComplete = () => {
    if (!project) return;
    const nowDone = toggleProject(project.id);
    toast(nowDone ? `${project.title} marked complete ✓` : `${project.title} marked incomplete`, nowDone ? "ok" : "info");
  };

  // ── Honest not-found card ────────────────────────────────────────────────
  if (!project) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/projects" className="text-[#101a3f] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <TopHeader title="Project not found" subtitle="That project id doesn't exist in the curriculum." />
          </div>
        </div>
        <div className="card p-10 text-center max-w-[520px] mx-auto">
          <div className="text-[44px] mb-2">🧭</div>
          <b className="text-[16px] text-[#101a3f]">We couldn&apos;t find this project</b>
          <p className="text-[13px] text-slate-500 mt-2">
            The link may be outdated or mistyped. Every real project lives on the projects page —
            pick one from the list of 12 and start building.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold hover:-translate-y-0.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all projects
          </Link>
        </div>
      </div>
    );
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/projects" className="text-[#101a3f] hover:text-indigo-600 mt-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader title={project.title} subtitle={`${project.level} • ${project.tags.join(" • ")}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 items-start">
        {/* ── Document body ───────────────────────────────────────────── */}
        <div className="stagger space-y-4">
          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-2 flex items-center gap-2">
              <Megaphone className="w-4.5 h-4.5 text-rose-500" /> Problem
            </h2>
            <p className="text-[13.5px] text-slate-600 leading-relaxed">{project.problem}</p>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-2 flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-indigo-600" /> Objective
            </h2>
            <p className="text-[13.5px] text-slate-600 leading-relaxed">{project.objective}</p>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-3 flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-blue-600" /> Requirements
            </h2>
            <ul className="space-y-2">
              {project.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-3 flex items-center gap-2">
              <Lightbulb className="w-4.5 h-4.5 text-amber-500" /> Concepts used
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.concepts.map((c) => (
                <span
                  key={c}
                  className="text-[12px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-4 flex items-center gap-2">
              <Flag className="w-4.5 h-4.5 text-emerald-600" /> Step-by-step implementation
            </h2>
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-4">
                {project.steps.map((st, i) => (
                  <div key={i} className="relative flex gap-4 items-start">
                    <span className="relative z-10 w-8 h-8 rounded-full primary-gradient text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 flex-1">
                      <div className="font-bold text-[13.5px] text-[#101a3f]">{st.t}</div>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">{st.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-3 flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-violet-600" /> Code
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                <span>python</span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-indigo-600 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-[#0e1530] text-slate-100 text-[12.5px] p-4 overflow-x-auto font-mono leading-relaxed">
                {project.code}
              </pre>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-2 flex items-center gap-2">
              <Lightbulb className="w-4.5 h-4.5 text-amber-500" /> Explanation
            </h2>
            <p className="text-[13.5px] text-slate-600 leading-relaxed">{project.explain}</p>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-3 flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-slate-500" /> Expected output
            </h2>
            <pre className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[12.5px] p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
              {project.output}
            </pre>
          </div>

          <div className="card p-6">
            <h2 className="font-extrabold text-[17px] text-[#101a3f] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-orange-500" /> Challenges
            </h2>
            <ul className="space-y-2">
              {project.challenges.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                  <span className="mt-0.5 text-orange-500">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-extrabold text-[17px] text-[#101a3f] flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-green-600" /> Final assessment
              </h2>
              <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {checkedCount}/{project.assessment.length} checked
              </span>
            </div>
            <div className="space-y-2">
              {project.assessment.map((a, i) => {
                const on = !!checked[i];
                return (
                  <button
                    key={i}
                    onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition ${
                      on
                        ? "border-green-300 bg-green-50 dark:bg-green-900/25 dark:border-green-800"
                        : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        on ? "bg-green-500 border-green-500" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {on && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className={`text-[13px] ${on ? "text-green-800 dark:text-green-300 font-semibold" : "text-slate-600"}`}>
                      {a}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sticky right sidebar ────────────────────────────────────── */}
        <div className="xl:sticky xl:top-4 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[15px] text-[#101a3f]">Project status</h3>
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${done ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                {done ? "Completed" : "In progress"}
              </span>
            </div>

            {done ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-500 text-white text-[13px] font-extrabold">
                  <CheckCircle2 className="w-4 h-4" /> Completed ✓
                </div>
                <button
                  onClick={toggleComplete}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[13px] font-bold hover:border-indigo-300 transition"
                >
                  Mark incomplete
                </button>
              </div>
            ) : (
              <button
                onClick={toggleComplete}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-extrabold hover:-translate-y-0.5 hover:shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Project Complete
              </button>
            )}

            <Link
              href={`/ai-tutor?topic=${encodeURIComponent(`Project: ${project.title}`)}`}
              className="mt-2.5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:-translate-y-0.5 transition"
            >
              <BotMessageSquare className="w-4 h-4" /> Ask AI Mentor
            </Link>

            <Link
              href="/projects"
              className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[13px] font-bold hover:border-indigo-300 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to projects
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-indigo-600" /> At a glance
            </h3>
            <div className="space-y-2 text-[12.5px]">
              {[
                ["Level", project.level],
                ["Steps", `${project.steps.length} implementation steps`],
                ["Concepts", `${project.concepts.length} core concepts`],
                ["Assessment", `${project.assessment.length} criteria`],
                ["Challenges", `${project.challenges.length} stretch goals`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-bold text-[#101a3f] text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.map((t) => (
                <span key={t} className="text-[10.5px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-rose-500" /> Why this matters
            </h3>
            <p className="text-[12.5px] text-slate-600 leading-relaxed">{project.problem}</p>
            <p className="text-[12.5px] text-slate-500 mt-2 leading-relaxed">
              <b className="text-[#101a3f]">Your goal: </b>{project.objective}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
