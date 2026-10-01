"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  GraduationCap,
  BookOpen,
  Map,
  BotMessageSquare,
  Mic,
  Lightbulb,
  FileCode,
  ClipboardList,
  FlaskConical,
  Folder,
  BarChart3,
  Trophy,
  Activity,
  FileText,
  Bookmark,
  CalendarCheck,
  Settings,
  Brain,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: typeof Home }
interface NavGroup { label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/courses", label: "Courses", icon: GraduationCap },
      { href: "/learning-path", label: "Learning Path", icon: BookOpen },
      { href: "/roadmap", label: "AI Roadmap", icon: Map },
    ],
  },
  {
    label: "AI Tutor",
    items: [
      { href: "/ai-tutor", label: "AI Tutor", icon: BotMessageSquare },
      { href: "/interview", label: "AI Interview", icon: Mic },
      { href: "/doubt", label: "Doubt Solver", icon: Lightbulb },
      { href: "/code-explainer", label: "Code Explainer", icon: FileCode },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
      { href: "/practice", label: "Practice", icon: FlaskConical },
      { href: "/projects", label: "Projects", icon: Folder },
    ],
  },
  {
    label: "Track",
    items: [
      { href: "/progress", label: "Progress", icon: BarChart3 },
      { href: "/achievements", label: "Achievements", icon: Trophy },
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/notes", label: "Notes", icon: FileText },
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/planner", label: "Study Planner", icon: CalendarCheck },
    ],
  },
];

const RAIL_KEY = "ai-path-ui-rail";

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [rail, setRail] = useState(false);

  useEffect(() => {
    // Stored preference wins; otherwise auto-rail between 768–1100px so content keeps its width.
    const autoRail = () => window.innerWidth >= 768 && window.innerWidth < 1100;
    try {
      const stored = localStorage.getItem(RAIL_KEY);
      setRail(stored === null ? autoRail() : stored === "1");
    } catch { /* first visit */ }
    const onResize = () => {
      try {
        if (localStorage.getItem(RAIL_KEY) !== null) return; // user chose explicitly
      } catch { /* ignore */ }
      setRail(autoRail());
    };
    window.addEventListener("resize", onResize);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setRail((r) => {
          const next = !r;
          try { localStorage.setItem(RAIL_KEY, next ? "1" : "0"); } catch { /* ignore */ }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
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

  const toggle = () =>
    setRail((r) => {
      const next = !r;
      try { localStorage.setItem(RAIL_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });

  return (
    <>
      {/* desktop */}
      <aside
        className={`hidden md:flex sidebar-gradient text-white flex-col h-dvh sticky top-0 p-4 shrink-0 overflow-x-hidden transition-[width] duration-[250ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
          rail ? "w-[76px]" : "w-[240px]"
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
  return (
    <>
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
                  className={`flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all ${
                    rail ? "w-11 h-11 justify-center px-0 my-0.5" : "px-4 py-2"
                  } ${
                    active
                      ? "bg-gradient-to-r from-indigo-600/80 to-indigo-500/50 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/20"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
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
          className={`flex items-center gap-3 rounded-xl text-[14px] font-medium transition-all ${
            rail ? "w-11 h-11 justify-center" : "px-4 py-2"
          } ${
            pathname.startsWith("/settings")
              ? "bg-gradient-to-r from-indigo-600/80 to-indigo-500/50 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/20"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!rail && <span className="truncate">Settings</span>}
        </Link>
      </div>

      {!rail && (
        <div className="mt-3 shrink-0 rounded-2xl p-3 bg-black/40 border border-indigo-500/20 relative overflow-hidden [@media(max-height:640px)]:hidden">
          <Sparkles className="w-4 h-4 text-indigo-300 mb-1.5" />
          <p className="text-[12px] leading-snug text-slate-200">
            Small steps every day lead to big achievements!
          </p>
        </div>
      )}
    </>
  );
}
