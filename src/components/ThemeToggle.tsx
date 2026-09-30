"use client";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ai-path-theme", next ? "dark" : "light");
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:border-indigo-200 transition"
    >
      {ready && dark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-slate-500" />}
    </button>
  );
}
