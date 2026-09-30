"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBox() {
  const [v, setV] = useState("");
  const r = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) r.push(`/search?q=${encodeURIComponent(v.trim())}`);
      }}
      className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2.5 w-[300px] shadow-sm focus-within:border-indigo-300"
    >
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Search topics, concepts, or ask anything..."
        className="outline-none text-[13px] w-full bg-transparent text-slate-700 placeholder:text-slate-400"
      />
    </form>
  );
}
