// ─── Single source of truth for every stat the UI displays ───────────────────
// Pages must compute numbers through these selectors — never inline — so the
// same fact always renders the same way (PS03 Phase 1: one selector layer).
import type { ProgressState } from "./store";
import { avgScore, streakCount, learnerLevel, UNITS } from "./store";
import {
  SKILL_DOMAINS, domainPct, LEVELS, TOTAL_LESSONS, PROJECTS, ACHIEVEMENTS,
  unlockedIds, coursePct, levelDone, levelTotal, nextLesson, type FlatLesson,
} from "./curriculum";

/** Course (10-level curriculum) completion. */
export function selectCourse(s: ProgressState) {
  const done = (s.lessons ?? []).length;
  return { done, total: TOTAL_LESSONS, pct: TOTAL_LESSONS ? Math.round((done / TOTAL_LESSONS) * 100) : 0 };
}

/** Per-level course stats for the dashboard strip / courses grid. */
export function selectLevelStats(s: ProgressState) {
  return LEVELS.map((lv) => ({ level: lv, done: levelDone(s, lv), total: levelTotal(lv), pct: coursePct(s, lv) }));
}

/** Quiz performance from real attempts only. */
export function selectQuiz(s: ProgressState) {
  const n = s.attempts.length;
  return {
    count: n,
    avg: avgScore(s),
    best: n ? Math.max(...s.attempts.map((a) => Math.round((a.score / Math.max(1, a.total)) * 100))) : 0,
    recent: s.attempts.slice(-8).map((a) => ({
      pct: Math.round((a.score / Math.max(1, a.total)) * 100),
      label: a.quiz,
      at: a.at,
    })),
    hasData: n > 0,
  };
}

/** Streak facts (current length; "active today" comes free from streakCount). */
export function selectStreak(s: ProgressState) {
  return { days: streakCount(s), active: streakCount(s) > 0 };
}

/** 10-domain skill bars with real per-domain mastery. */
export function selectSkills(s: ProgressState) {
  return SKILL_DOMAINS.map((d) => ({ ...d, pct: domainPct(s, d.levelIds) }));
}

export function selectProjects(s: ProgressState) {
  const done = (s.projects ?? []).length;
  return { done, total: PROJECTS.length, pct: PROJECTS.length ? Math.round((done / PROJECTS.length) * 100) : 0 };
}

export function selectBadges(s: ProgressState) {
  const ids = unlockedIds(s);
  return { ids, total: ACHIEVEMENTS.length, pct: Math.round((ids.length / ACHIEVEMENTS.length) * 100) };
}

/**
 * Honest ETA in weeks: remaining lessons × ~0.5 h, spread over the learner's
 * real daily minutes (5 study days/week). Returns null when nothing to plan.
 */
export function selectEtaWeeks(s: ProgressState): number | null {
  const { done, total } = selectCourse(s);
  const left = total - done;
  if (left <= 0) return 0;
  const hoursLeft = left * 0.5;
  const weeklyHours = (Math.max(15, s.prefs.dailyMins) * 5) / 60;
  return Math.max(1, Math.ceil(hoursLeft / Math.max(1, weeklyHours)));
}

/** True before localStorage has real data — drives skeletons, never fake 0s. */
export function isNewUser(s: ProgressState): boolean {
  return (
    !s.onboarded ||
    (s.done.length === 0 &&
      (s.lessons ?? []).length === 0 &&
      s.attempts.length === 0 &&
      s.activity.length === 0)
  );
}

/** Next lesson to continue (curriculum order). */
export function selectNextLesson(s: ProgressState): FlatLesson {
  return nextLesson(s);
}

/** Weak topics: real evidence only (lessons attempted, mastery below cut). */
export function selectSkillBars(s: ProgressState) {
  const skills = selectSkills(s).sort((a, b) => a.pct - b.pct);
  return { weakest: skills.filter((d) => d.pct < 60).slice(0, 3), strongest: [...skills].reverse().filter((d) => d.pct > 0).slice(0, 3) };
}

/** Legacy 12-unit path stats (learning-path page). */
export function selectUnits(s: ProgressState) {
  return { done: s.done.length, total: UNITS.length };
}

/** ETA for the legacy 12-unit path: 3 h per remaining unit over real dailyMins. */
export function selectUnitEtaWeeks(s: ProgressState): number | null {
  const { done, total } = selectUnits(s);
  const left = total - done;
  if (left <= 0) return 0;
  const weeklyHours = (Math.max(15, s.prefs.dailyMins) * 5) / 60;
  return Math.max(1, Math.ceil((left * 3) / Math.max(1, weeklyHours)));
}
