"use client";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import { useProgress, toggleBookmark } from "../../lib/store";
import { Bookmark, Trash2 } from "lucide-react";

function href(b: { kind: string; ref: string }) {
  if (b.kind === "lesson") return `/learn/${b.ref}`;
  if (b.kind === "quiz") return "/quizzes";
  if (b.kind === "note") return "/notes";
  return "/ai-tutor";
}

export default function SavedPage() {
  const s = useProgress();
  return (
    <div>
      <TopHeader title="Saved" subtitle="Lessons, answers and notes you bookmarked" />
      {s.bookmarks.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[40px] mb-2">🔖</div>
          <b className="text-[15px] text-[#101a3f]">Nothing saved yet</b>
          <p className="text-[13px] text-slate-500 mt-1">Bookmark lessons, AI answers and code examples to find them here.</p>
          <Link href="/learning-path" className="inline-block mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold">Browse lessons</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.bookmarks.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start gap-2">
                <Bookmark className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <b className="text-[14px] text-[#101a3f]">{b.title}</b>
                  <p className="text-[12px] text-slate-500 mt-0.5">{b.snippet}</p>
                  <div className="text-[11px] text-slate-400 mt-1">{b.kind} • {new Date(b.at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <Link href={href(b)} className="text-[12px] font-bold text-indigo-600">Open original →</Link>
                <button onClick={() => { toggleBookmark(b.kind, b.ref, "", ""); toast("Removed"); }} className="ml-auto text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
