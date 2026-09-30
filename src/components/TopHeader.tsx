"use client";
import { Search, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useMenu } from "../app/MenuContext";
import { greeting, useProgress, learnerLevel } from "../lib/store";

export default function TopHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const onMenu = useMenu();
  const s = useProgress();
  const level = learnerLevel(s);

  return (
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          {title ? (
            <>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
            </>
          ) : (
            <>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">
                {greeting()}, Mohammed! <span>👋</span>
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Your personalized learning journey continues. Keep going!
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2.5 w-[300px] shadow-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            placeholder="Search topics, concepts, or ask anything..."
            className="outline-none text-[13px] w-full bg-transparent text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
          <div className="hidden lg:block">
            <div className="text-[13px] font-bold text-[#101a3f]">Mohammed Shakib</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
