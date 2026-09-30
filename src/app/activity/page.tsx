"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress, relTime } from "../../lib/store";
import { Search, CheckCircle2, ClipboardList, BookOpen, BotMessageSquare, FlaskConical, FileText, Bookmark, Play } from "lucide-react";

const KINDS = ["all", "unit", "quiz", "practice", "tutor", "lesson", "note", "plan", "started", "lab"] as const;

function icon(kind: string) {
  if (kind === "quiz") return <ClipboardList className="w-4 h-4 text-purple-600" />;
  if (kind === "practice") return <FlaskConical className="w-4 h-4 text-green-600" />;
  if (kind === "tutor") return <BotMessageSquare className="w-4 h-4 text-indigo-600" />;
  if (kind === "note") return <FileText className="w-4 h-4 text-amber-600" />;
  if (kind === "plan") return <Play className="w-4 h-4 text-blue-600" />;
  if (kind === "started") return <BookOpen className="w-4 h-4 text-blue-600" />;
  return <CheckCircle2 className="w-4 h-4 text-green-600" />;
}

function groupOf(at: number) {
  const d = new Date(at);
  const today = new Date();
  const day = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (day(d) === day(today)) return "Today";
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (day(d) === day(y)) return "Yesterday";
  if (Date.now() - at < 7 * 86400e3) return "This Week";
  return "Older";
}

export default function ActivityPage() {
  const s = useProgress();
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState("all");

  const items = useMemo(() => {
    const now = Date.now();
    return s.activity.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (q && !(a.text + " " + a.detail).toLowerCase().includes(q.toLowerCase())) return false;
      if (range === "today" && groupOf(a.at) !== "Today") return false;
      if (range === "week" && now - a.at > 7 * 86400e3) return false;
      return true;
    });
  }, [s.activity, kind, q, range]);

  const groups: Record<string, typeof items> = {};
  items.forEach((a) => {
    const g = groupOf(a.at);
    (groups[g] = groups[g] || []).push(a);
  });

  return (
    <div>
      <TopHeader title="Activity History" subtitle="Every real learning event, newest first" />
      <div className="card p-4 mb-4 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity…" className="bg-transparent outline-none text-[13px] w-full" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold bg-white outline-none">
          {KINDS.map((k) => <option key={k} value={k}>{k === "all" ? "All types" : k}</option>)}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold bg-white outline-none">
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[40px] mb-2">📭</div>
          <b className="text-[15px] text-[#101a3f]">No activity yet</b>
          <p className="text-[13px] text-slate-500 mt-1">Complete a lesson or quiz — it will appear here with a real timestamp.</p>
          <Link href="/start" className="inline-block mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold">Start Learning</Link>
        </div>
      ) : (
        Object.entries(groups).map(([g, list]) => (
          <div key={g} className="mb-5">
            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">{g}</h3>
            <div className="card p-2">
              {list.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0 border-slate-100">
                  <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon(a.kind)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800 truncate">{a.text}</div>
                    <div className="text-[11px] text-slate-400">{a.detail} • {a.kind}</div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{relTime(a.at)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
