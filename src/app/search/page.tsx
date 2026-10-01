"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import { useProgress, UNITS } from "../../lib/store";
import { ALL_LESSONS, PROJECTS, PRACTICE_BANK, LEVELS } from "../../lib/curriculum";
import { BookOpen, FileText, Bookmark, BotMessageSquare, GraduationCap, Folder, FlaskConical } from "lucide-react";

export default function SearchPage() {
  const q = (useSearchParams().get("q") || "").toLowerCase().trim();
  const s = useProgress();

  const results = useMemo(() => {
    if (!q) return null;
    const has = (t: string) => t.toLowerCase().includes(q);
    const doneSet = new Set(s.lessons ?? []);
    return {
      courses: LEVELS.filter((l) => has(l.title) || has(l.subtitle)).map((l) => ({ id: l.id, title: `${l.icon} ${l.title}`, sub: l.subtitle })),
      lessons: ALL_LESSONS.filter((x) => has(x.lesson.title) || x.lesson.topics.some(has) || has(x.module.title)).map((x) => ({ id: x.lesson.id, title: x.lesson.title, sub: `${x.level.short} › ${x.module.title} • ${doneSet.has(x.lesson.id) ? "Completed" : "Not started"}` })),
      units: UNITS.filter((u) => has(u.title)).map((u) => ({ id: u.id, title: `Unit ${u.id}: ${u.title}`, sub: `${u.hours} • ${s.done.includes(u.id) ? "Completed" : "Not started"}` })),
      projects: PROJECTS.filter((p) => has(p.title) || p.tags.some(has) || has(p.problem)).map((p) => ({ id: p.id, title: p.title, sub: `${p.level} • ${p.tags.join(", ")}` })),
      practice: PRACTICE_BANK.filter((p) => has(p.q) || has(p.cat)).map((p) => ({ id: p.id, title: p.q, sub: `${p.cat} • ${p.diff}` })),
      notes: s.notes.filter((n) => has(n.title) || has(n.body) || has(n.tag)),
      bookmarks: s.bookmarks.filter((b) => has(b.title) || has(b.snippet)),
      chats: s.chats.filter((c) => has(c.title) || c.msgs.some((m) => has(m.content))),
    };
  }, [q, s]);

  return (
    <div>
      <TopHeader title={`Results for "${q || "..."}"`} subtitle="Across courses, lessons, projects, practice, notes and chats" />
      {!results ? (
        <div className="card p-10 text-center text-slate-500 text-[14px]">Type in the search bar above to find lessons, notes and chats.</div>
      ) : (
        <div className="stagger grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Courses ({results.courses.length})</h3>
            {results.courses.length === 0 && <Empty />}
            {results.courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{c.title}</b>
                <p className="text-[11px] text-slate-400">{c.sub}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lessons ({results.lessons.length + results.units.length})</h3>
            {(results.lessons.length + results.units.length) === 0 && <Empty />}
            {results.lessons.map((l) => (
              <Link key={l.id} href={`/lesson/${l.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{l.title}</b>
                <p className="text-[11px] text-slate-400">{l.sub}</p>
              </Link>
            ))}
            {results.units.map((l) => (
              <Link key={`u${l.id}`} href={`/learn/${l.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{l.title}</b>
                <p className="text-[11px] text-slate-400">{l.sub}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><Folder className="w-4 h-4" /> Projects ({results.projects.length})</h3>
            {results.projects.length === 0 && <Empty />}
            {results.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{p.title}</b>
                <p className="text-[11px] text-slate-400">{p.sub}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Practice ({results.practice.length})</h3>
            {results.practice.length === 0 && <Empty />}
            {results.practice.map((p) => (
              <Link key={p.id} href="/practice" className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{p.title}</b>
                <p className="text-[11px] text-slate-400">{p.sub}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Notes ({results.notes.length})</h3>
            {results.notes.length === 0 && <Empty />}
            {results.notes.map((n) => (
              <Link key={n.id} href="/notes" className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{n.title}</b>
                <p className="text-[11px] text-slate-400">{n.tag} • {n.body.slice(0, 80)}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4" /> Saved ({results.bookmarks.length})</h3>
            {results.bookmarks.length === 0 && <Empty />}
            {results.bookmarks.map((b) => (
              <Link key={b.id} href="/saved" className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{b.title}</b>
                <p className="text-[11px] text-slate-400">{b.kind} • {b.snippet.slice(0, 80)}</p>
              </Link>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><BotMessageSquare className="w-4 h-4" /> Chats ({results.chats.length})</h3>
            {results.chats.length === 0 && <Empty />}
            {results.chats.map((c) => (
              <Link key={c.id} href={`/ai-tutor?chat=${c.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{c.title}</b>
                <p className="text-[11px] text-slate-400">{c.msgs.length} messages</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return <p className="text-[12px] text-slate-400 py-2">No matches.</p>;
}
