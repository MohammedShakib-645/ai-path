"use client";
import { Search } from "lucide-react";

/** Header search pill — opens the global Ctrl/⌘+K command palette. */
export default function SearchBox() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-cmdk"))}
      aria-label="Open search (Ctrl K)"
      className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2.5 w-[300px] shadow-sm text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="text-[13px] flex-1 text-left truncate">Search topics, concepts, or ask anything...</span>
      <kbd className="text-[10px] font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 shrink-0">Ctrl K</kbd>
    </button>
  );
}
