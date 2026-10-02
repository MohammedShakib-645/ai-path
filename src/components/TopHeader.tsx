"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, ArrowLeft, LogOut, LogIn, User, Sliders, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { useMenu } from "../app/MenuContext";
import { greeting, useProgress, useProfileName, learnerLevel } from "../lib/store";
import { useAuth, signOut } from "../lib/auth";
import { toast } from "./Toaster";

const ACCOUNT_ITEMS = [
  { label: "Profile", href: "/settings", icon: User },
  { label: "Learning Preferences", href: "/settings", icon: Sliders },
  { label: "Account", href: "/settings", icon: Settings },
] as const;

export default function TopHeader({ title, subtitle, back, actions }: { title?: string; subtitle?: string; back?: string; actions?: ReactNode }) {
  const onMenu = useMenu();
  const s = useProgress();
  const level = learnerLevel(s);
  const name = useProfileName();
  const auth = useAuth();
  const [menuOpen, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // close the account menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const first = (auth?.name || name).split(" ")[0] || "Learner";

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
        <div ref={menuRef} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {auth?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auth.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-lg">
                {auth ? <span className="text-[15px] font-extrabold text-indigo-700">{first[0]}</span> : "👤"}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="text-[13px] font-bold text-[#101a3f] dark:text-slate-200">{auth?.name || name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {auth ? auth.provider === "google" ? "Google" : "Member" : level}
              </div>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} aria-hidden="true" />
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 overflow-hidden py-1.5">
                <div className="px-3.5 pt-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[13px] font-bold text-[#101a3f] dark:text-slate-100 truncate">{auth?.name || name}</div>
                  <div className="text-[11.5px] text-slate-500 truncate">{auth?.email || "Guest session · this device"}</div>
                </div>
                {ACCOUNT_ITEMS.map((it) => (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <it.icon className="w-4 h-4 text-slate-400" />
                    {it.label}
                  </Link>
                ))}
                <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
                {auth ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      signOut();
                      toast("Signed out — your data stays on this device.", "info");
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/signin"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
