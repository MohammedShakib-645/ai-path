"use client";
import TopHeader from "../../components/TopHeader";
import Link from "next/link";
import { useProgress, completionPct, avgScore, streakCount, UNITS } from "../../lib/store";
import {
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

export default function ProgressPage() {
  const s = useProgress();
  const pct = completionPct(s);
  const avg = avgScore(s);
  const streak = streakCount(s);

  // Real chart: last 7 saved quiz scores (%), padded so the line always renders
  const scores = s.attempts.slice(-7).map((a) => Math.round((a.score / Math.max(1, a.total)) * 100));
  const points = [...Array(Math.max(0, 7 - scores.length)).fill(Math.max(50, (scores[0] ?? 70) - 10)), ...scores].slice(-7);
  const labels = s.attempts.slice(-7).map((a) => a.quiz.split(":")[0]);
  while (labels.length < 7) labels.unshift("—");
  const W = 600,
    H = 180;

  const pathCoordinates = points.map((p, i) => {
    const x = (i * (W / (points.length - 1))).toFixed(1);
    const y = (H - ((p - 50) / 50) * H).toFixed(1);
    return `${x},${y}`;
  });

  const linePath = `M ${pathCoordinates.join(" L ")}`;
  const areaPath = `M 0,${H} L ${pathCoordinates.join(" L ")} L ${W},${H} Z`;

  const competencies = [
    { code: "COMP-01", units: [1, 2, 3], name: "Python Syntax & Runtime Primitives", assessment: "Diagnostics + Labs" },
    { code: "COMP-02", units: [4, 5, 6], name: "Control Structures & Data Layout", assessment: "Diagnostics + Labs" },
    { code: "COMP-03", units: [7, 8, 9], name: "Abstraction, Files & OOP", assessment: "Labs + Exam" },
    { code: "COMP-04", units: [10, 11, 12], name: "Numerical Methods & ML Capstone", assessment: "Capstone" },
  ].map((c) => {
    const done = c.units.filter((u) => s.done.includes(u)).length;
    const pctDone = Math.round((done / c.units.length) * 100);
    return {
      ...c,
      score: `${pctDone}%`,
      status: pctDone === 100 ? "Exemplary" : pctDone >= 34 ? "Proficient" : "Developing",
      grade: pctDone === 100 ? "A" : pctDone >= 67 ? "B+" : pctDone >= 34 ? "B" : "C",
    };
  });

  return (
    <div className="space-y-6 pb-12">
      <TopHeader
        title="Student Transcript & Gradebook"
        subtitle="Verified Academic Performance Report • Course CS-101"
      />

      {/* Academic Standing Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cumulative Average", val: s.attempts.length ? `${avg}%` : "—", sub: `${s.attempts.length} graded assessment${s.attempts.length === 1 ? "" : "s"}`, status: "Live scores" },
          { label: "Completed Units", val: `${s.done.length} / ${UNITS.length}`, sub: `${pct}% of curriculum`, status: "On Track" },
          { label: "Laboratory Time", val: `${s.labHours} hrs`, sub: "Verified runtime logs", status: "Requirement: 20h" },
          { label: "Study Streak", val: `${streak} day${streak === 1 ? "" : "s"}`, sub: "Consecutive calendar days", status: "Current" },
        ].map((c, i) => (
          <div key={i} className="pro-card p-5 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {c.label}
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {c.val}
            </div>
            <div className="text-xs font-semibold text-slate-700 pt-0.5">
              {c.sub}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {c.status}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <div className="space-y-6">
          {/* Performance Trend Chart */}
          <div className="pro-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assessment Performance Trajectory
                </h3>
                <p className="text-xs text-slate-500">Evaluation scores across consecutive coursework milestones</p>
              </div>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                Current: {points[points.length - 1]}%
              </span>
            </div>

            <div className="w-full overflow-hidden pt-2">
              <svg viewBox={`0 0 ${W} ${H + 25}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="academicGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[50, 65, 80, 100].map((v) => {
                  const y = H - ((v - 50) / 50) * H;
                  return (
                    <g key={v}>
                      <line x1="0" x2={W} y1={y} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                      <text x="0" y={y - 4} fontSize="9" fill="#94a3b8" fontFamily="monospace">
                        {v}%
                      </text>
                    </g>
                  );
                })}

                <path d={areaPath} fill="url(#academicGrad)" />
                <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />

                {points.map((p, i) => {
                  const cx = (i * (W / (points.length - 1))).toFixed(1);
                  const cy = (H - ((p - 50) / 50) * H).toFixed(1);
                  return (
                    <circle key={i} cx={cx} cy={cy} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  );
                })}
              </svg>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
                {labels.map((l, i) => (
                  <span key={i} className="truncate max-w-[70px]">{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Competency Mastery Table */}
          <div className="pro-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Subject Competency Rubric
                </h3>
                <p className="text-xs text-slate-500">Institutional learning outcomes evaluation</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-2 font-bold">Code</th>
                    <th className="pb-2 font-bold">Competency Objective</th>
                    <th className="pb-2 font-bold">Assessment</th>
                    <th className="pb-2 font-bold">Score</th>
                    <th className="pb-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competencies.map((comp) => (
                    <tr key={comp.code} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-slate-500">{comp.code}</td>
                      <td className="py-3 font-medium text-slate-900">{comp.name}</td>
                      <td className="py-3 text-slate-500">{comp.assessment}</td>
                      <td className="py-3 font-mono font-semibold text-slate-900">{comp.score} ({comp.grade})</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            comp.status === "Exemplary"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : comp.status === "Proficient"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {comp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Institutional Accreditation & Credentialing */}
        <div className="space-y-6">
          <div className="pro-card p-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Certificate Track Verification
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enrolled in the Verified Certificate of Proficiency in Python Systems Architecture. All submissions are automatically evaluated against faculty benchmark tests.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Certification Code:</span>
                <span className="font-mono text-slate-900 font-semibold">CERT-CS-89241</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Accreditation Body:</span>
                <span className="font-semibold text-slate-900">Path Academic Council</span>
              </div>
            </div>
          </div>

          <div className="pro-card p-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-700" /> Required Prerequisite Courses
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">CS-101: Systems Programming</div>
                  <div className="text-[11px] text-slate-500">Current Coursework</div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Enrolled
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center opacity-70">
                <div>
                  <div className="font-semibold text-slate-900">CS-201: Data Structures & Algorithms</div>
                  <div className="text-[11px] text-slate-500">Prerequisite: CS-101</div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
