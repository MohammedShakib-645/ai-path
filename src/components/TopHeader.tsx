"use client";
import { useState } from "react";
import {
  Search,
  Menu,
  Bell,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { useMenu } from "../app/MenuContext";
import Link from "next/link";

export default function TopHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const onMenu = useMenu();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    {
      id: 1,
      title: "Unit 04 Available: Functions & Scopes",
      desc: "New laboratory exercises and automated unit tests published.",
      time: "2h ago",
    },
    {
      id: 2,
      title: "Diagnostic Exam Graded (Score: 82%)",
      desc: "Grade posted to transcript. Verified by Automated Assessor.",
      time: "1d ago",
    },
  ];

  return (
    <header className="pro-card px-4 sm:px-6 py-3.5 mb-6 sticky top-3 z-30 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu Trigger & Academic Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="md:hidden w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              <span>Curriculum</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>CS-101 Python Systems</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-blue-600">Unit 02</span>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate leading-tight">
              {title ?? "Student Coursework Dashboard"}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search, Term Status & Student Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 w-[220px] xl:w-[260px] focus-within:ring-1 focus-within:ring-blue-600 focus-within:border-blue-600 focus-within:bg-white transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search syllabus, code, exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-xs w-full bg-transparent text-slate-800 placeholder:text-slate-400 font-normal"
            />
            <kbd className="text-[10px] text-slate-400 border border-slate-200 bg-white px-1.5 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Academic Term Status Tag */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Term: Fall 2026</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
              aria-label="Academic notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                  <span>Academic Notices</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5">
                      <div className="text-xs font-semibold text-slate-900 leading-snug">
                        {n.title}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile */}
          <Link
            href="/settings"
            className="flex items-center gap-2 pl-1 hover:opacity-90 transition"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700">
              MS
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Mohammed Shakib
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ID: #CS-89241
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
