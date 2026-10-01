"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, ArrowLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { useMenu } from "../app/MenuContext";
import { greeting, useProgress, useProfileName, learnerLevel } from "../lib/store";

export default function TopHeader({ title, subtitle, back, actions }: { title?: string; subtitle?: string; back?: string; actions?: ReactNode }) {
  const onMenu = useMenu();
  const s = useProgress();
  const level = learnerLevel(s);
  const name = useProfileName();
  const first = name.split(" ")[0] || "Learner";

  return (
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div className="flex items-center gap-3">
        {back ? (
          <Link href={back} aria-label="Back" className="text-[#101a3f] hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 mt-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        ) : (
          <button
            onClick={onMenu}
            className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          {title ? (
            <>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">{title}</h1>
              {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
            </>
          ) : (
            <>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] leading-tight">
                {greeting()}, {first}! <span>👋</span>
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Your personalized learning journey continues. Keep going!
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <SearchBox />
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👤</div>
          <div className="hidden lg:block">
            <div className="text-[13px] font-bold text-[#101a3f]">{name}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
