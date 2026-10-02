"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { MenuProvider } from "./MenuContext";
import AiFab from "../components/AiFab";
import CommandPalette from "../components/CommandPalette";
import { Home, BookOpen, BotMessageSquare, FlaskConical, BarChart3 } from "lucide-react";
const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/ai-tutor", label: "Tutor", icon: BotMessageSquare },
  { href: "/practice", label: "Code", icon: FlaskConical },
  { href: "/progress", label: "Stats", icon: BarChart3 },
];

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Marketing landing at "/" is full-bleed: no app shell (palette still global).
  if (pathname === "/") {
    return (
      <>
        {children}
        <CommandPalette />
      </>
    );
  }

  // AI Tutor = full-width content: sidebar stays, main area goes edge-to-edge.
  const immersive = pathname === "/ai-tutor";

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={open} onClose={() => setOpen(false)} />
      <main className={immersive ? "flex-1 min-w-0 w-full pb-20 md:pb-0" : "flex-1 min-w-0 px-4 md:px-8 py-5 pb-24 md:pb-8 max-w-[1400px] mx-auto w-full"}>
        {/* keyed by route: replays the page-enter animation on navigation */}
        <div key={pathname} className="page-enter">
          <MenuProvider onMenu={() => setOpen(true)}>{children}</MenuProvider>
        </div>
      </main>
      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex justify-around">
        {TABS.map((t) => {
          const active = t.href === "/dashboard" ? pathname.startsWith("/dashboard") : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold ${active ? "text-indigo-600" : "text-slate-400"}`}
            >
              <Icon className="w-5 h-5" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* Floating AI bot — tap to open a small chat screen right here */}
      <AiFab />
      {/* Ctrl/⌘+K command palette — global navigation + search */}
      <CommandPalette />
    </div>
  );
}
