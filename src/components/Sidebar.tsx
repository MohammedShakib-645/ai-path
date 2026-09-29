"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BotMessageSquare,
  ClipboardList,
  BarChart3,
  Settings,
  Brain,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/learning-path", label: "Learning Path", icon: BookOpen },
  { href: "/ai-tutor", label: "AI Tutor", icon: BotMessageSquare },
  { href: "/quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden md:flex w-[240px] shrink-0 sidebar-gradient text-white flex-col h-screen sticky top-0 p-5">
        <SidebarContent pathname={pathname} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 w-[250px] sidebar-gradient text-white flex-col h-full p-5 flex">
            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 mb-8 mt-1">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center border border-cyan-300/30">
          <Brain className="w-6 h-6 text-cyan-300" />
        </div>
        <div>
          <div className="font-extrabold text-[22px] leading-none tracking-wide">
            AI-<span className="text-indigo-300">PATH</span>
          </div>
          <div className="text-[11px] text-slate-300/90 mt-1">Your Personal AI Tutor</div>
        </div>
      </div>

      <nav className="space-y-1.5 flex-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-indigo-600/80 to-indigo-500/50 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/20"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl p-4 bg-[#131d45]/80 border border-indigo-500/20 relative overflow-hidden">
        <Sparkles className="w-4 h-4 text-indigo-300 mb-2" />
        <p className="text-[13px] leading-snug text-slate-200">
          Small steps
          <br />
          every day lead to
          <br />
          big achievements!
        </p>
        <div className="mt-3 flex justify-end opacity-80">
          <svg width="90" height="46" viewBox="0 0 90 46" fill="none">
            <path d="M5 42 L28 12 L45 30 L65 8 L85 42 Z" fill="#4f46e5" opacity="0.7" />
            <path d="M65 8 L65 2 L71 4 L65 6" fill="#a5b4fc" />
          </svg>
        </div>
      </div>
    </>
  );
}
