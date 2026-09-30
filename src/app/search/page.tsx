"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import { useProgress, UNITS } from "../../lib/store";
import { BookOpen, FileText, Bookmark, BotMessageSquare } from "lucide-react";

export default function SearchPage() {
  const q = (useSearchParams().get("q") || "").toLowerCase().trim();
  const s = useProgress();

  const results = useMemo(() => {
    if (!q) return null;
    const has = (t: string) => t.toLowerCase().includes(q);
    return {
      lessons: UNITS.filter((u) => has(u.title)).map((u) => ({ id: u.id, title: `Unit ${u.id}: ${u.title}`, sub: `${u.hours} • ${s.done.includes(u.id) ? "Completed" : "Not started"}` })),
      notes: s.notes.filter((n) => has(n.title) || has(n.body) || has(n.tag)),
      bookmarks: s.bookmarks.filter((b) => has(b.title) || has(b.snippet)),
      chats: s.chats.filter((c) => has(c.title) || c.msgs.some((m) => has(m.content))),
    };
  }, [q, s]);

  return (
    <div>
      <TopHeader title={`Results for "${q || "..."}"`} subtitle="Across lessons, notes, bookmarks and chats" />
      {!results ? (
        <div className="card p-10 text-center text-slate-500 text-[14px]">Type in the search bar above to find lessons, notes and chats.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lessons ({results.lessons.length})</h3>
            {results.lessons.length === 0 && <Empty />}
            {results.lessons.map((l) => (
              <Link key={l.id} href={`/learn/${l.id}`} className="block py-2 border-b last:border-0 border-slate-100">
                <b className="text-[13px] text-indigo-700">{l.title}</b>
                <p className="text-[11px] text-slate-400">{l.sub}</p>
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
