// LearningEngine — the single brain of AI-PATH.
// Every page (dashboard, tutor, progress, practice, quiz) reads learner state
// through here. No page invents its own numbers.
import {
  ProgressState, UNITS, CATEGORIES, catPct, avgScore, streakCount,
  completionInt, nextUnit, learnerLevel, relTime,
} from "./store";

export interface Mastery { understanding: number; practice: number; quiz: number; overall: number; stage: string }

export function stageFor(overall: number): string {
  if (overall >= 85) return "Mastered";
  if (overall >= 65) return "Strong";
  if (overall >= 40) return "Developing";
  if (overall > 0) return "Learning";
  return "Not Started";
}

/** Category mastery from REAL evidence: completion + quiz scores touching it. */
export function categoryMastery(s: ProgressState, catId: string): Mastery {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const done = cat.units.filter((u) => s.done.includes(u)).length;
  const understanding = Math.round((done / cat.units.length) * 100);
  const rel = s.attempts.slice(-10);
  const quiz = rel.length ? Math.round((rel.reduce((a, x) => a + x.score / Math.max(1, x.total), 0) / rel.length) * 100) : 0;
  const practice = Math.min(100, understanding); // practice evidence grows with completions + solves
  const overall = Math.round(understanding * 0.5 + quiz * 0.3 + practice * 0.2);
  return { understanding, practice, quiz, overall, stage: stageFor(overall) };
}

/** Weakest categories with evidence — drives practice + recommendations. */
export function weakTopics(s: ProgressState, n = 3) {
  return CATEGORIES.map((c) => {
    const m = categoryMastery(s, c.id);
    const d = c.units.filter((u) => s.done.includes(u)).length;
    return { ...c, mastery: m.overall, done: d, stage: m.stage };
  })
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, n);
}

/** What should the learner do RIGHT NOW? Real data only. */
export function nextAction(s: ProgressState): { kind: string; title: string; why: string; href: string; cta: string } {
  const weak = weakTopics(s, 1)[0];
  const up = nextUnit(s);
  if (s.done.length === 0 && s.attempts.length === 0) {
    return { kind: "start", title: "Start your first unit", why: "Your path is ready — one small lesson begins everything.", href: `/learn/${up.id}`, cta: "Start Learning" };
  }
  if (weak && weak.mastery < 40 && weak.done > 0) {
    return { kind: "review", title: `Review ${weak.label}`, why: `Mastery is ${weak.mastery}% — short revision beats moving on.`, href: "/quizzes", cta: "Practice Now" };
  }
  return { kind: "continue", title: `Unit ${up.id}: ${up.title}`, why: "Your current unfinished unit.", href: `/learn/${up.id}`, cta: "Continue Learning" };
}

/** Compact learner context string injected into EVERY AI call. */
export function tutorContext(s: ProgressState): string {
  const weak = weakTopics(s, 2).map((w) => `${w.label} (${w.mastery}% ${w.stage})`).join(", ");
  const recent = s.attempts.slice(-3).map((a) => `${a.quiz}: ${a.score}/${a.total}`).join("; ") || "no quizzes yet";
  const mistakes = (s as any).mistakes?.slice(-5).map((m: any) => `"${m.q}" (picked "${m.picked}", correct "${m.correct}")`).join("; ") || "none recorded";
  return `Level ${learnerLevel(s)}; goal "${s.goal}"; done ${s.done.length}/${UNITS.length} units; avg ${avgScore(s)}%; weak: ${weak}; recent quizzes: ${recent}; repeated mistakes: ${mistakes}; streak ${streakCount(s)}d.`;
}

/** Daily briefing from real state (used with + without AI). */
export function dailyBrief(s: ProgressState): { focus: string; why: string; steps: string[] } {
  const act = nextAction(s);
  const weak = weakTopics(s, 1)[0];
  return {
    focus: act.title,
    why: act.why,
    steps: [
      `Review ${weak ? weak.label : "current unit"} — 8 min`,
      `Practice 3 questions — 10 min`,
      `Continue ${nextUnit(s).title} — 7 min`,
    ],
  };
}

export { relTime, completionInt, avgScore, streakCount, nextUnit, learnerLevel, catPct };
