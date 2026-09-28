"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Terminal,
  FileCheck,
  LineChart,
  Settings,
  Layers,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_SECTIONS = [
  {
    title: "ACADEMICS",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/learning-path", label: "Curriculum Syllabus", icon: BookOpen },
      { href: "/ai-tutor", label: "Code Mentor Lab", icon: Terminal, badge: "Interactive" },
      { href: "/quizzes", label: "Examinations", icon: FileCheck, badge: "3 Due" },
    ],
  },
  {
    title: "REPORTS & ACCOUNT",
    items: [
      { href: "/progress", label: "Gradebook & Analytics", icon: LineChart },
      { href: "/settings", label: "Preferences & API", icon: Settings },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-[250px] shrink-0 pro-sidebar text-slate-300 flex-col min-h-screen sticky top-0 h-screen p-4 overflow-y-auto">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-[270px] max-w-[85vw] pro-sidebar text-slate-300 flex flex-col h-full p-4 z-10 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                aria-label="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Institution Branding */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-white tracking-tight leading-tight flex items-center gap-1.5">
            PATH ACADEMY
          </div>
          <div className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            CS Cohort 2026
          </div>
        </div>
      </div>

      {/* Structured Nav Sections */}
      <div className="space-y-6 flex-1">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                        active
                          ? "bg-blue-700 text-blue-100 border-blue-500"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cohort Status Box */}
      <div className="p-3 my-4 rounded-lg bg-slate-850 border border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Term Progression</span>
          <span className="text-white font-bold">25%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }} />
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
          <span>3 of 12 Units Complete</span>
          <span className="text-emerald-400 font-medium">On Schedule</span>
        </div>
      </div>

      {/* Student Profile Footer */}
      <div className="pt-3 border-t border-slate-800">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 transition group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
            MS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate group-hover:text-blue-300">
              Mohammed Shakib
            </div>
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
              Verified Student
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
        </Link>
      </div>
    </div>
  );
}
