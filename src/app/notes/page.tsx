"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { toast } from "../../components/Toaster";
import { useProgress, saveNote, deleteNote, logActivity } from "../../lib/store";
import { Plus, Search, Pin, Trash2, Pencil, BotMessageSquare } from "lucide-react";

export default function NotesPage() {
  const s = useProgress();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Python");
  const [topic, setTopic] = useState("");

  const list = useMemo(() => {
    const f = s.notes.filter((n) => !q || (n.title + n.body + n.tag).toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [s.notes, q]);

  const openNew = () => {
    setEditing("new");
    setTitle("");
    setBody("");
    setTag("Python");
    setTopic("");
  };
  const openEdit = (id: string) => {
    const n = s.notes.find((x) => x.id === id)!;
    setEditing(id);
    setTitle(n.title);
    setBody(n.body);
    setTag(n.tag);
    setTopic(n.topic);
  };
  const save = () => {
    if (!title.trim() && !body.trim()) {
      toast("Note is empty", "err");
      return;
    }
    if (editing === "new") {
      saveNote({ title: title.trim() || "Untitled", body, tag, topic });
      logActivity(`Note created: ${title.trim() || "Untitled"}`, tag, "note");
      toast("Note saved ✓");
    } else if (editing) {
      saveNote({ id: editing, title: title.trim() || "Untitled", body, tag, topic });
      toast("Note updated ✓");
    }
    setEditing(null);
  };

  return (
    <div>
      <TopHeader title="Notes" subtitle="Your learning workspace — persists across refreshes" />
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 flex-1 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="bg-transparent outline-none text-[13px] w-full" />
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {editing && (
        <div className="card p-5 mb-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full font-bold text-[15px] outline-none mb-2 bg-transparent" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write…" rows={5} className="w-full text-[13px] outline-none bg-transparent resize-y" />
          <div className="flex gap-2 mt-2 flex-wrap">
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] w-[130px] outline-none" />
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Linked topic" className="border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] w-[160px] outline-none" />
            <button onClick={save} className="ml-auto px-5 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-bold">Save</button>
            <button onClick={() => setEditing(null)} className="px-4 py-1.5 rounded-lg text-[12px] font-bold text-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-[40px] mb-2">📝</div>
          <b className="text-[15px] text-[#101a3f]">No notes yet</b>
          <p className="text-[13px] text-slate-500 mt-1">Capture what you learn — it stays here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((n) => (
            <div key={n.id} className="card p-4 flex flex-col">
              <div className="flex items-start gap-2">
                <b className="text-[14px] text-[#101a3f] flex-1">{n.title}</b>
                {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <p className="text-[12px] text-slate-500 mt-1 flex-1 whitespace-pre-wrap line-clamp-4">{n.body || "—"}</p>
              <div className="text-[11px] text-slate-400 mt-2">{n.tag}{n.topic ? ` • ${n.topic}` : ""}</div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => saveNote({ id: n.id, pinned: !n.pinned })} title="Pin" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pin className="w-4 h-4" /></button>
                <button onClick={() => openEdit(n.id)} title="Edit" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                <Link href={`/ai-tutor?note=${n.id}`} title="Ask AI about this note" className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-500"><BotMessageSquare className="w-4 h-4" /></Link>
                <button onClick={() => { deleteNote(n.id); toast("Note deleted"); }} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 ml-auto"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
