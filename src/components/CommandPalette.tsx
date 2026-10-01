"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, BookOpen, BotMessageSquare, FlaskConical, ClipboardList, Folder, Mic,
  HelpCircle, Code2, FileText, Bookmark, BarChart3, Trophy, CalendarCheck,
  Settings, Search, Sparkles, CornerDownLeft,
} from "lucide-react";

type Item = { href: string; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; group: string };

const NAV: Item[] = [
  { href: "/", label: "Dashboard", hint: "Overview, streak & next action", icon: Home, group: "LEARN" },
  { href: "/learn", label: "Learn", hint: "Roadmap & course catalog", icon: BookOpen, group: "LEARN" },
  { href: "/ai-tutor", label: "AI Tutor", hint: "Chat that knows your level", icon: BotMessageSquare, group: "LEARN" },
  { href: "/practice", label: "Coding Practice", hint: "Real sandbox execution", icon: FlaskConical, group: "PRACTICE" },
  { href: "/quizzes", label: "Quizzes", hint: "Test yourself, track mistakes", icon: ClipboardList, group: "PRACTICE" },
  { href: "/projects", label: "Projects", hint: "Guided portfolio builds", icon: Folder, group: "PRACTICE" },
  { href: "/interview", label: "AI Interview", hint: "Graded 0–5 answers", icon: Mic, group: "PRACTICE" },
  { href: "/doubt", label: "Doubt Solver", hint: "Problem → cause → fix", icon: HelpCircle, group: "TOOLS" },
  { href: "/code-explainer", label: "Code Explainer", hint: "Line-by-line breakdown", icon: Code2, group: "TOOLS" },
  { href: "/notes", label: "Notes", hint: "Workspace with AI tools", icon: FileText, group: "TOOLS" },
  { href: "/saved", label: "Saved", hint: "Bookmarks & starred answers", icon: Bookmark, group: "TOOLS" },
  { href: "/progress", label: "Progress", hint: "Stats, skills, mastery", icon: BarChart3, group: "PROGRESS" },
  { href: "/achievements", label: "Achievements", hint: "Badges you've unlocked", icon: Trophy, group: "PROGRESS" },
  { href: "/planner", label: "Study Planner", hint: "AI-built schedule", icon: CalendarCheck, group: "PROGRESS" },
  { href: "/settings", label: "Settings", hint: "Profile, level & engine", icon: Settings, group: "PROGRESS" },
];

/** Global command palette — Ctrl/⌘+K anywhere, or the header search pill. */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matched = needle
      ? NAV.filter((n) => n.label.toLowerCase().includes(needle) || n.hint.toLowerCase().includes(needle) || n.href.includes(needle))
      : NAV;
    if (!needle) return matched;
    return [...matched, { href: `/search?q=${encodeURIComponent(q.trim())}`, label: `Search “${q.trim()}”`, hint: "Full search across the app", icon: Search, group: "SEARCH" }];
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && items[idx]) { e.preventDefault(); go(items[idx].href); }
    };
    const onOpen = () => { setQ(""); setIdx(0); setOpen(true); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmdk", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-cmdk", onOpen as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, items]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative w-full max-w-[560px] card !p-0 pop-in overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-white/10">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            placeholder="Jump to a page or search…"
            className="flex-1 bg-transparent outline-none text-[14px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            aria-label="Command palette search"
          />
          <kbd className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto py-1.5">
          {items.length === 0 && (
            <p className="text-[13px] text-slate-400 px-4 py-6 text-center">No matches — press Enter to search instead.</p>
          )}
          {items.map((it, i) => {
            const header = i === 0 || items[i - 1].group !== it.group ? it.group : null;
            const Icon = it.icon;
            const active = i === idx;
            return (
              <div key={it.href + it.label}>
                {header && (
                  <div className="px-4 pt-2.5 pb-1 text-[10px] font-extrabold tracking-wider text-slate-400">{header}</div>
                )}
                <button
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(it.href)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${active ? "bg-indigo-50 dark:bg-indigo-500/15" : ""}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300"}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-[#101a3f] dark:text-slate-100 truncate">{it.label}</span>
                    <span className="block text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{it.hint}</span>
                  </span>
                  {active && <CornerDownLeft className="w-3.5 h-3.5 ml-auto text-indigo-500 shrink-0" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/10 flex items-center gap-3 text-[10.5px] text-slate-400">
          <span><Sparkles className="w-3 h-3 inline -mt-0.5" /> AI-PATH command bar</span>
          <span className="ml-auto">↑↓ navigate · ↵ open · Esc close</span>
        </div>
      </div>
    </div>
  );
}
