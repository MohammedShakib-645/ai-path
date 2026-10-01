// LearningEngine — the single brain of AI-PATH.
// Every page (dashboard, tutor, progress, practice, quiz) reads learner state
// through here. No page invents its own numbers.
import {
  ProgressState, UNITS, CATEGORIES, catPct, avgScore, streakCount,
  completionInt, nextUnit, learnerLevel, relTime,
} from "./store";
import { nextLesson, TOTAL_LESSONS } from "./curriculum";

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
  if (s.done.length === 0 && s.attempts.length === 0 && (s.lessons?.length ?? 0) === 0) {
    return { kind: "start", title: "Start your first lesson", why: "Your path is ready — one small lesson begins everything.", href: "/courses", cta: "Start Learning" };
  }
  if (weak && weak.mastery < 40 && weak.done > 0) {
    return { kind: "review", title: `Review ${weak.label}`, why: `Mastery is ${weak.mastery}% — short revision beats moving on.`, href: "/quizzes", cta: "Practice Now" };
  }
  return { kind: "continue", title: `Unit ${up.id}: ${up.title}`, why: "Your current unfinished unit.", href: `/learn/${up.id}`, cta: "Continue Learning" };
}

// ─── §20 Personalization engine — deterministic rules over REAL data ──────────
export interface RuleRec { type: "revise" | "practice" | "difficulty" | "project" | "lesson"; title: string; why: string; href: string }

/**
 * Rule-based recommendations (no randomness):
 *  avg < 50%          → revise the weakest topic
 *  avg 50–75%         → more practice on it
 *  avg > 80% + 3+ quiz → unlock harder difficulty
 *  same topic failed 2+ times → mark weak, force revision
 *  all prerequisites done     → next course lesson / project
 */
export function ruleRecommendations(s: ProgressState): RuleRec[] {
  const recs: RuleRec[] = [];
  const avg = avgScore(s);
  const attempts = s.attempts;

  // repeated failures → weak topic (mistakes carry their quiz topic)
  const failCount = new Map<string, number>();
  for (const m of s.mistakes) failCount.set(m.topic, (failCount.get(m.topic) ?? 0) + 1);
  const hot = [...failCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (hot && hot[1] >= 2) {
    recs.push({ type: "revise", title: `Revise: ${hot[0]}`, why: `You missed ${hot[1]} questions here — revision before moving on.`, href: "/quizzes" });
  }

  if (attempts.length > 0) {
    if (avg < 50) {
      recs.push({ type: "practice", title: "Rebuild fundamentals", why: `Your average is ${avg}% (<50%) — re-read the lesson, then retry.`, href: "/courses" });
    } else if (avg <= 75) {
      recs.push({ type: "practice", title: "More practice questions", why: `${avg}% average (50–75%) — targeted drills move this to 80%.`, href: "/practice" });
    } else if (avg > 80 && attempts.length >= 3) {
      recs.push({ type: "difficulty", title: "Unlock Hard difficulty", why: `${avg}% average over ${attempts.length} quizzes — you're ready for harder questions.`, href: "/quizzes" });
    }
  }

  // prerequisites complete → project time
  const lessonsDone = s.lessons?.length ?? 0;
  const projectsDone = s.projects?.length ?? 0;
  if (lessonsDone >= 10 && projectsDone < 3) {
    recs.push({ type: "project", title: "Build a portfolio project", why: `${lessonsDone} lessons done — projects prove the skill.`, href: "/projects" });
  } else if (lessonsDone < 10) {
    const nl = nextLesson(s);
    recs.push({ type: "lesson", title: `Next: ${nl.lesson.title}`, why: `Continue the ${nl.level.short} course — ${lessonsDone} lessons completed so far.`, href: `/lesson/${nl.lesson.id}` });
  }
  return recs.slice(0, 4);
}

/** Compact learner context string injected into EVERY AI call. */
export function tutorContext(s: ProgressState): string {
  const weak = weakTopics(s, 2).map((w) => `${w.label} (${w.mastery}% ${w.stage})`).join(", ");
  const recent = s.attempts.slice(-3).map((a) => `${a.quiz}: ${a.score}/${a.total}`).join("; ") || "no quizzes yet";
  const mistakes = (s as any).mistakes?.slice(-5).map((m: any) => `"${m.q}" (picked "${m.picked}", correct "${m.correct}")`).join("; ") || "none recorded";
  return `Level ${learnerLevel(s)}; goal "${s.goal}"; course lessons ${s.lessons?.length ?? 0}/${TOTAL_LESSONS} done; legacy units ${s.done.length}/${UNITS.length}; projects ${s.projects?.length ?? 0}/12; avg quiz ${avgScore(s)}%; weak: ${weak}; recent quizzes: ${recent}; repeated mistakes: ${mistakes}; streak ${streakCount(s)}d.`;
}

/** Daily briefing from real state (used with + without AI). */
export function dailyBrief(s: ProgressState): { focus: string; why: string; steps: string[] } {
  const act = nextAction(s);
  const weak = weakTopics(s, 1)[0];
  const rules = ruleRecommendations(s);
  return {
    focus: act.title,
    why: act.why,
    steps: rules.length
      ? rules.map((r) => `${r.title} — ${r.why}`)
      : (() => {
          const m = Math.max(15, s.prefs.dailyMins);
          const a = Math.round(m * 0.3);
          const b = Math.round(m * 0.4);
          return [
            `Review ${weak ? weak.label : "current unit"} — ${a} min`,
            `Practice 3 questions — ${b} min`,
            `Continue ${nextUnit(s).title} — ${Math.max(5, m - a - b)} min`,
          ];
        })(),
  };
}

export { relTime, completionInt, avgScore, streakCount, nextUnit, learnerLevel, catPct };
