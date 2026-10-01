"use client";
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  BotMessageSquare,
  FlaskConical,
  ClipboardList,
  Folder,
  Mic,
  Lightbulb,
  FileCode,
  FileText,
  Bookmark,
  BarChart3,
  Trophy,
  CalendarCheck,
  Settings,
  Brain,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useProgress, streakCount, learnerLevel } from "../lib/store";

interface NavItem { href: string; label: string; icon: typeof Home }
interface NavGroup { label: string; items: NavItem[] }

/** 14 links in 4 grouped sections (Courses/Learning Path/Roadmap merged into Learn). */
const GROUPS: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/learn", label: "Learn", icon: Map },
      { href: "/ai-tutor", label: "AI Tutor", icon: BotMessageSquare },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/practice", label: "Practice", icon: FlaskConical },
      { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
      { href: "/projects", label: "Projects", icon: Folder },
      { href: "/interview", label: "AI Interview", icon: Mic },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/doubt", label: "Doubt Solver", icon: Lightbulb },
      { href: "/code-explainer", label: "Code Explainer", icon: FileCode },
      { href: "/notes", label: "Notes", icon: FileText },
      { href: "/saved", label: "Saved", icon: Bookmark },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "/progress", label: "Progress", icon: BarChart3 },
      { href: "/achievements", label: "Achievements", icon: Trophy },
      { href: "/planner", label: "Study Planner", icon: CalendarCheck },
    ],
  },
];

/** Rail (collapsed) state = persisted UI state in localStorage (an external system),
 *  so it lives in useSyncExternalStore — SSR-safe, no setState-in-effect. */
const RAIL_KEY = "ai-path-ui-rail";
const RAIL_EVENT = "ai-path-rail-changed";

function readRail(): boolean {
  try {
    const stored = localStorage.getItem(RAIL_KEY);
    if (stored !== null) return stored === "1";
  } catch { /* ignore */ }
  // First visit: auto-rail between 768–1100px so content keeps its width.
  return window.innerWidth >= 768 && window.innerWidth < 1100;
}

function subscribeRail(onChange: () => void): () => void {
  const notify = () => onChange();
  window.addEventListener("resize", notify);
  window.addEventListener(RAIL_EVENT, notify);
  return () => {
    window.removeEventListener("resize", notify);
    window.removeEventListener(RAIL_EVENT, notify);
  };
}

/** Explicit choice: persist it (even the first click, which leaves auto-mode). */
function toggleRail(): void {
  try {
    localStorage.setItem(RAIL_KEY, readRail() ? "0" : "1");
    window.dispatchEvent(new Event(RAIL_EVENT));
  } catch { /* ignore */ }
}

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const rail = useSyncExternalStore(subscribeRail, readRail, () => false);

  useEffect(() => {
    // Ctrl/Cmd+B toggles the rail (writes localStorage → store notifies → re-render)
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleRail();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // mobile drawer: Esc + close on navigation
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = toggleRail;

  return (
    <>
      {/* desktop — 248px expanded / 72px collapsed (state persisted) */}
      <aside
        className={`hidden md:flex sidebar-gradient text-white flex-col h-dvh sticky top-0 p-4 shrink-0 overflow-x-hidden transition-[width] duration-[250ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
          rail ? "w-[72px]" : "w-[248px]"
        }`}
      >
        <SidebarContent pathname={pathname} rail={rail} onToggle={toggle} />
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/50 animate-[fadeIn_180ms_ease]" onClick={onClose} />
          <aside className="absolute left-0 top-0 w-[268px] max-w-[84vw] sidebar-gradient text-white flex flex-col h-full p-4 overflow-y-auto overscroll-contain drawer-in">
            <SidebarContent pathname={pathname} rail={false} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({
  pathname,
  rail,
  onToggle,
  onNavigate,
}: {
  pathname: string;
  rail?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const s = useProgress();

  return (
    <>
      {/* Header row: logo + product name + collapse, aligned in one row */}
      <div className={`flex items-center gap-2.5 mb-4 mt-0.5 ${rail ? "justify-center" : ""}`}>
        <div className="w-9 h-9 shrink-0 rounded-xl bg-cyan-400/20 flex items-center justify-center border border-cyan-300/30">
          <Brain className="w-5 h-5 text-cyan-300" />
        </div>
        {!rail && (
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[22px] leading-none tracking-wide">
              AI-<span className="text-indigo-300">PATH</span>
            </div>
            <div className="text-[11px] text-slate-300/90 mt-1 truncate">Your Personal AI Tutor</div>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
            title="Collapse / expand (Ctrl+B)"
            className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            {rail ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Grouped nav: 40px items, 4px gaps, active = tinted bg + 3px left accent */}
      <nav className={`space-y-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 ${rail ? "flex flex-col items-center" : ""}`}>
        {GROUPS.map((group) => (
          <div key={group.label} className={rail ? "contents" : "mb-2"}>
            {!rail && (
              <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 px-4 pt-3 pb-1.5">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={rail ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all border-l-[3px] ${
                    rail ? "w-11 h-11 justify-center px-0 my-0.5" : "min-h-10 px-3.5"
                  } ${
                    active
                      ? "bg-indigo-500/25 text-white border-indigo-300/90 shadow-sm"
                      : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!rail && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Settings pinned so it is always reachable without scrolling */}
      <div className={`pt-3 mt-2 border-t border-white/10 shrink-0 ${rail ? "flex justify-center" : ""}`}>
        <Link
          href="/settings"
          onClick={onNavigate}
          title={rail ? "Settings" : undefined}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all border-l-[3px] ${
            rail ? "w-11 h-11 justify-center" : "min-h-10 px-3.5"
          } ${
            pathname.startsWith("/settings")
              ? "bg-indigo-500/25 text-white border-indigo-300/90 shadow-sm"
              : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!rail && <span className="truncate">Settings</span>}
        </Link>
      </div>

      {/* Footer: avatar + level + streak — real state only */}
      <div className={`mt-3 pt-3 border-t border-white/10 shrink-0 flex items-center gap-2.5 ${rail ? "justify-center" : ""}`}>
        <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-[15px]">
          👤
        </div>
        {!rail && (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[12.5px] font-bold text-white truncate">{learnerLevel(s)}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400 shrink-0" /> {streakCount(s)} day streak
            </div>
          </div>
        )}
      </div>
    </>
  );
}
