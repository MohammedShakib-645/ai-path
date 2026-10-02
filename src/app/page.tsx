import Link from "next/link";
import {
  Route, BotMessageSquare, FlaskConical, BookOpen, ClipboardList, BarChart3,
  ArrowRight, PlayCircle, Sparkles, CheckCircle2, Terminal, ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Route,
    title: "Adaptive roadmap",
    body: "A 12-unit Python → AI path that rebuilds around your goal, level and daily time budget.",
  },
  {
    icon: BotMessageSquare,
    title: "AI Tutor that knows you",
    body: "Every answer is grounded in your real level, weak topics and history — not generic copy-paste.",
  },
  {
    icon: FlaskConical,
    title: "Real code execution",
    body: "Run Python in a sandbox, get AI analysis of your output. No fake runners, no fake scores.",
  },
  {
    icon: BookOpen,
    title: "Editorial + AI lessons",
    body: "Authored deep-dive lessons render instantly; anything else is generated for your level on demand.",
  },
  {
    icon: ClipboardList,
    title: "Quizzes & AI interview",
    body: "Quizzes track real mistakes; interview mode grades your answers 0–5, one question at a time.",
  },
  {
    icon: BarChart3,
    title: "Honest progress",
    body: "Stats only appear after real activity — minimum 3 answered questions, zero vanity numbers.",
  },
];

const STEPS = [
  { n: "01", title: "Answer 4 quick questions", body: "Goal, level, language, daily time — your path builds itself." },
  { n: "02", title: "Follow your path", body: "Lessons, practice and quizzes sequenced for exactly where you are." },
  { n: "03", title: "Prove it", body: "Real attempts, real execution, real streaks — progress you earned." },
];

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen bg-[#0b1233] text-white">
      {/* Nav */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[17px]">🤖</span>
            <span className="font-extrabold tracking-tight text-[16px]">AI-PATH</span>
          </div>
          <nav className="flex items-center gap-2.5">
            <Link href="/signup" className="text-[13px] font-bold text-slate-300 hover:text-white px-3 py-2">Get started</Link>
            <Link href="/dashboard" className="text-[13px] font-bold bg-white/10 border border-white/15 hover:bg-white/20 rounded-xl px-4 py-2.5">Open dashboard</Link>
          </nav>
        </div>
      </header>

      {/* Hero — the single landing hero: dark glow + gradient CTA (gradient CTAs are allowed) */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute top-20 right-[-120px] w-[420px] h-[420px] rounded-full bg-purple-600/15 blur-[110px]" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 text-[12px] font-bold text-indigo-200 bg-indigo-500/15 border border-indigo-400/30 rounded-full px-3.5 py-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Build Fast with AI 2026 · Personalised AI Tutor
          </span>
          <h1 className="mt-6 font-extrabold tracking-tight text-[40px] md:text-[60px] leading-[1.05] max-w-3xl mx-auto">
            The tutor that actually <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">knows where you are</span>
          </h1>
          <p className="mt-5 text-[16px] md:text-[17px] text-slate-300 max-w-2xl mx-auto leading-relaxed">
            AI-PATH builds a learning path from your goal, then teaches, quizzes and drills you with AI —
            while keeping every number honest. Your progress stays on your device.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup" className="primary-gradient text-white font-bold text-[14.5px] rounded-xl px-6 py-3.5 inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5">
              Start free — build my path <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/start?demo=1" className="text-white font-bold text-[14.5px] rounded-xl px-6 py-3.5 inline-flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5">
              <PlayCircle className="w-4.5 h-4.5" /> Launch guided demo
            </Link>
          </div>

          {/* Real product facts — no invented vanity metrics */}
          <div className="mt-12 flex items-center justify-center gap-x-7 gap-y-3 flex-wrap text-[12.5px] text-slate-400">
            {[
              { Icon: CheckCircle2, label: "12-unit Python → AI curriculum" },
              { Icon: BookOpen, label: "10 authored deep-dive lessons" },
              { Icon: Terminal, label: "Real sandbox code execution" },
              { Icon: ShieldCheck, label: "Local-first — data stays yours" },
            ].map(({ Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-indigo-400" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 bg-[#0d1530]">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-extrabold text-[26px] md:text-[30px] tracking-tight text-center">Everything a learner needs, one app</h2>
          <p className="text-slate-400 text-center mt-2 text-[14.5px]">Learn → practise → get tested → see proof. No scattered tabs.</p>
          <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-indigo-400/40 hover:bg-white/[0.06] transition">
                  <span className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300">
                    <Icon className="w-5.5 h-5.5" />
                  </span>
                  <h3 className="font-bold text-[15.5px] mt-3.5">{f.title}</h3>
                  <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="font-extrabold text-[26px] md:text-[30px] tracking-tight text-center">From zero to a path in 60 seconds</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="font-mono text-[13px] font-bold text-indigo-400">{s.n}</div>
                <h3 className="font-bold text-[16px] mt-2">{s.title}</h3>
                <p className="text-[13.5px] text-slate-400 mt-1.5 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-[#0d1530]">
        <div className="max-w-6xl mx-auto px-5 py-14 text-center">
          <h2 className="font-extrabold text-[24px] md:text-[28px] tracking-tight">Ready to see your path?</h2>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/signup" className="primary-gradient text-white font-bold text-[14.5px] rounded-xl px-6 py-3.5 inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5">
              Create my learning path <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/start?demo=1" className="text-slate-200 font-bold text-[14px] underline underline-offset-4 hover:text-white px-2 py-3">
              or run the guided demo first
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-6 flex items-center justify-between gap-4 flex-wrap text-[12.5px] text-slate-500">
          <span>© 2026 AI-PATH — Personalised AI Tutor</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Built for Build Fast with AI 2026</span>
        </div>
      </footer>
    </div>
  );
}
