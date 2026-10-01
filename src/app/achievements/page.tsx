"use client";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import { useProgress } from "../../lib/store";
import { ACHIEVEMENTS, unlockedIds } from "../../lib/curriculum";
import { ArrowLeft, Trophy, Check, BookOpen, Flame, ClipboardList, Sparkles } from "lucide-react";

/** Where each badge's "how to unlock" action actually lives in this app. */
function badgeLink(id: string): { href: string; label: string } {
  if (id.startsWith("streak")) return { href: "/activity", label: "Open activity" };
  if (id === "quiz-master") return { href: "/quizzes", label: "Go to quizzes" };
  if (id === "first-project") return { href: "/projects", label: "Open projects" };
  return { href: "/learn?view=catalog", label: "Start learning" };
}

function badgeIcon(id: string, href: string) {
  if (href === "/activity") return <Flame className="w-3.5 h-3.5" />;
  if (href === "/quizzes") return <ClipboardList className="w-3.5 h-3.5" />;
  if (href === "/projects") return <Sparkles className="w-3.5 h-3.5" />;
  return <BookOpen className="w-3.5 h-3.5" />;
}

export default function AchievementsPage() {
  const s = useProgress();
  const unlocked = new Set(unlockedIds(s));
  const count = unlocked.size;
  const total = ACHIEVEMENTS.length;
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/" className="text-[#101a3f] hover:text-indigo-600 mt-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <TopHeader
            title="Achievements"
            subtitle="Badges earned from real progress — lessons, quizzes and streaks."
          />
        </div>
      </div>

      {/* Header: real unlocked count + progress bar */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </span>
            <div>
              <div className="font-extrabold text-[20px] text-[#101a3f] leading-tight">
                {count} of {total} unlocked
              </div>
              <div className="text-[12px] text-slate-500">Every badge comes from a real action you took</div>
            </div>
          </div>
          <div className="text-[26px] font-extrabold text-indigo-600">{pct}%</div>
        </div>
        <div className="mt-4 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full primary-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Honest empty state */}
      {count === 0 && (
        <div className="card p-8 text-center mb-4 pop-in">
          <div className="text-[42px] mb-2">🏅</div>
          <b className="text-[16px] text-[#101a3f]">No badges yet — and that&apos;s honest.</b>
          <p className="text-[13px] text-slate-500 mt-1.5 max-w-[440px] mx-auto">
            Complete lessons, quizzes and streaks to unlock badges. Nothing here is handed out for free —
            each badge flips the moment your real progress crosses its threshold.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Link href="/learn?view=catalog" className="px-5 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold hover:-translate-y-0.5 transition">
              Start a course
            </Link>
            <Link href="/quizzes" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-bold hover:border-indigo-300 transition">
              Take a quiz
            </Link>
          </div>
        </div>
      )}

      {/* Badge medallion grid */}
      <div className="stagger grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          const link = badgeLink(a.id);
          return (
            <div
              key={a.id}
              className={`card p-5 flex flex-col items-center text-center transition ${
                got ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-80"
              }`}
            >
              {/* medallion */}
              <div className="relative mb-3">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-[36px] border-4 ${
                    got
                      ? "bg-gradient-to-br from-amber-100 to-orange-50 border-amber-300 shadow-[0_6px_18px_rgba(245,158,11,0.35)]"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 grayscale opacity-60"
                  }`}
                >
                  {a.icon}
                </div>
                {!got && (
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm text-[13px]">
                    🔒
                  </span>
                )}
                {got && (
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow">
                    <Check className="w-4 h-4 text-white" />
                  </span>
                )}
              </div>

              <div className={`font-extrabold text-[15px] ${got ? "text-[#101a3f]" : "text-slate-500"}`}>
                {a.title}
              </div>
              <p className="text-[12px] text-slate-500 mt-1 flex-1">{a.desc}</p>

              <div className="mt-3 w-full">
                {got ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-green-600 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Unlocked ✓
                  </span>
                ) : (
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:-translate-y-0.5 transition"
                  >
                    {badgeIcon(a.id, link.href)} {link.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
