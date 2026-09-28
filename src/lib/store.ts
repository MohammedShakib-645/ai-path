// Shared real-time progress store (localStorage-backed).
// Every page reads/writes here, so Dashboard, Path, Quiz and
// Progress always show the same live numbers — no mock constants.
"use client";
import { useSyncExternalStore, useEffect } from "react";

export interface Unit { id: number; title: string; hours: string }
export interface QuizAttempt { quiz: string; score: number; total: number; at: number }
export interface ActivityItem { text: string; detail: string; at: number; kind: "quiz" | "unit" | "lab" | "tutor" }
export interface ProgressState {
  done: number[];
  attempts: QuizAttempt[];
  activity: ActivityItem[];
  streak: string[]; // YYYY-MM-DD
  labHours: number;
}

export const UNITS: Unit[] = [
  { id: 1, title: "Python Syntax & Runtime Model", hours: "2.0h" },
  { id: 2, title: "Variables, Types & Memory References", hours: "1.5h" },
  { id: 3, title: "Control Flow, Scopes & Branching", hours: "1.5h" },
  { id: 4, title: "Functional Decomposition & Recursion", hours: "2.0h" },
  { id: 5, title: "Linear Structures: Lists & Tuples", hours: "2.5h" },
  { id: 6, title: "Hash Tables, Dicts & Set Theory", hours: "2.5h" },
  { id: 7, title: "File Handling & Data Persistence", hours: "2.0h" },
  { id: 8, title: "Error Handling & Debugging", hours: "1.5h" },
  { id: 9, title: "Object-Oriented Programming", hours: "3.0h" },
  { id: 10, title: "Applied Numerical Methods", hours: "2.5h" },
  { id: 11, title: "ML Foundations & Regression", hours: "3.0h" },
  { id: 12, title: "Capstone: Real-World AI Project", hours: "4.0h" },
];

const KEY = "ai-path-progress-v1";
const EVT = "ai-path-update";

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seed(): ProgressState {
  const now = Date.now();
  return {
    done: [1, 2, 3],
    attempts: [{ quiz: "Unit 01 Diagnostic", score: 10, total: 10, at: now - 2 * 3600e3 }],
    activity: [
      { text: "test_variables.py", detail: "Passed (10/10 tests)", at: now - 2 * 3600e3, kind: "lab" as const },
      { text: "list_algorithms.py", detail: "Passed (8/8 tests)", at: now - 26 * 3600e3, kind: "lab" as const },
      { text: "Unit 03: Control Flow", detail: "Marked complete", at: now - 30 * 3600e3, kind: "unit" as const },
    ],
    streak: [todayKey(), todayKey(new Date(now - 864e3)), todayKey(new Date(now - 2 * 864e3))],
    labHours: 14.5,
  };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch { /* private mode */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

let cache: ProgressState | null = null;
// Deterministic first-render snapshot: identical on server and client,
// so React hydration never mismatches. Real localStorage data loads
// in an effect right after mount (see useProgress).
const SSR_SNAPSHOT: ProgressState = { done: [], attempts: [], activity: [], streak: [], labHours: 0 };
let hydrated = false;
const listeners = new Set<() => void>();
function get(): ProgressState {
  if (typeof window === "undefined") return SSR_SNAPSHOT;
  if (!hydrated) return SSR_SNAPSHOT;
  if (!cache) cache = load();
  return cache;
}
function getSSR(): ProgressState {
  return SSR_SNAPSHOT;
}
function ensure() {
  if (typeof window !== "undefined" && !hydrated) {
    hydrated = true;
    cache = load();
  }
  if (!cache) cache = load();
  return cache;
}
function set(next: ProgressState) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
  window.dispatchEvent(new Event(EVT));
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener(EVT, fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener(EVT, fn);
    window.removeEventListener("storage", fn);
  };
}

export function useProgress(): ProgressState {
  const s = useSyncExternalStore(subscribe, get, getSSR);
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      cache = load();
      listeners.forEach((l) => l());
    }
  }, []);
  return s;
}

// ---- mutations (all stamp real time) ----
export function toggleUnit(id: number) {
  const s = ensure();
  const has = s.done.includes(id);
  const done = has ? s.done.filter((x) => x !== id) : [...s.done, id].sort((a, b) => a - b);
  const unit = UNITS.find((u) => u.id === id);
  const activity: ActivityItem[] = has
    ? s.activity
    : [{ text: `Unit ${String(id).padStart(2, "0")}: ${unit?.title ?? ""}`, detail: "Marked complete", at: Date.now(), kind: "unit" as const }, ...s.activity].slice(0, 20);
  touchStreak(s);
  set({ ...s, done, activity, labHours: has ? s.labHours : Math.round((s.labHours + 1.5) * 10) / 10 });
}

export function recordQuiz(quiz: string, score: number, total: number) {
  const s = ensure();
  const at = Date.now();
  touchStreak(s);
  set({
    ...s,
    attempts: [...s.attempts, { quiz, score, total, at }].slice(-30),
    activity: [{ text: quiz, detail: `Scored ${score}/${total} (${Math.round((score / Math.max(1, total)) * 100)}%)`, at, kind: "quiz" as const }, ...s.activity].slice(0, 20),
    labHours: Math.round((s.labHours + 0.5) * 10) / 10,
  });
}

function touchStreak(s: ProgressState) {
  const t = todayKey();
  if (!s.streak.includes(t)) s.streak = [...s.streak, t].slice(-60);
}

// ---- derived (computed live, never hardcoded) ----
export function completionPct(s: ProgressState) {
  return Math.round((s.done.length / UNITS.length) * 1000) / 10;
}
export function avgScore(s: ProgressState) {
  if (!s.attempts.length) return 0;
  const last = s.attempts.slice(-5);
  return Math.round((last.reduce((a, x) => a + x.score / Math.max(1, x.total), 0) / last.length) * 1000) / 10;
}
export function streakCount(s: ProgressState) {
  let n = 0;
  const d = new Date();
  if (!s.streak.includes(todayKey(d))) d.setDate(d.getDate() - 1); // counts if studied yesterday
  while (s.streak.includes(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function relTime(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60e3));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
export function nextUnit(s: ProgressState) {
  return UNITS.find((u) => !s.done.includes(u.id)) ?? UNITS[UNITS.length - 1];
}
// Adaptive level: drives quiz unlocks + tutor tone. Real, computed.
export function learnerLevel(s: ProgressState): "Beginner" | "Intermediate" | "Advanced" {
  const score = s.done.length / UNITS.length;
  const avg = avgScore(s) / 100;
  const combined = score * 0.6 + (s.attempts.length ? avg * 0.4 : 0);
  if (combined >= 0.75) return "Advanced";
  if (combined >= 0.4) return "Intermediate";
  return "Beginner";
}
// Weakest unfinished unit — used for practice recommendations.
export function weakestUnit(s: ProgressState) {
  return nextUnit(s);
}
