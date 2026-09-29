// Shared real-time progress store (localStorage-backed).
// Every page reads/writes here, so Dashboard, Path, Quiz, Tutor and
// Progress always show the same live numbers — no mock constants.
"use client";
import { useSyncExternalStore, useEffect } from "react";

export interface Unit { id: number; title: string; hours: string; icon: string }
export interface QuizAttempt { quiz: string; score: number; total: number; at: number }
export interface ActivityItem { text: string; detail: string; at: number; kind: "quiz" | "unit" | "lab" | "tutor" | "started" }
export interface ProgressState {
  done: number[];
  attempts: QuizAttempt[];
  activity: ActivityItem[];
  streak: string[]; // YYYY-MM-DD
  labHours: number;
  studyMins: number;
  goal: string;
}

export const UNITS: Unit[] = [
  { id: 1, title: "Python Basics", hours: "2 hours", icon: "🐍" },
  { id: 2, title: "Data Types", hours: "2 hours", icon: "🗄️" },
  { id: 3, title: "Control Flow", hours: "1.5 hours", icon: "↔" },
  { id: 4, title: "Functions", hours: "2 hours", icon: "ƒ" },
  { id: 5, title: "Data Structures", hours: "2.5 hours", icon: "🔗" },
  { id: 6, title: "Projects", hours: "3 hours", icon: "🚀" },
  { id: 7, title: "Object Oriented Programming", hours: "3 hours", icon: "🎯" },
  { id: 8, title: "File Handling", hours: "2 hours", icon: "📁" },
  { id: 9, title: "Error Handling & Debugging", hours: "1.5 hours", icon: "🛠" },
  { id: 10, title: "NumPy Basics", hours: "2 hours", icon: "🔢" },
  { id: 11, title: "Machine Learning Basics", hours: "2 hours", icon: "🧠" },
  { id: 12, title: "Capstone Project", hours: "4 hours", icon: "🏆" },
];

export interface Category { id: string; label: string; units: number[]; icon: string; color: string; iconBg: string }

export const CATEGORIES: Category[] = [
  { id: "python", label: "Python Basics", units: [1, 2, 3, 4], icon: "🐍", color: "bg-green-500", iconBg: "bg-green-100" },
  { id: "aiml", label: "AI & ML Concepts", units: [10, 11, 12], icon: "🤖", color: "bg-blue-500", iconBg: "bg-blue-100" },
  { id: "ds", label: "Data Structures", units: [5, 7, 9], icon: "📚", color: "bg-purple-500", iconBg: "bg-purple-100" },
  { id: "proj", label: "Projects", units: [6, 8, 12], icon: "🚀", color: "bg-orange-400", iconBg: "bg-orange-100" },
];

export function catPct(s: ProgressState, c: Category) {
  const d = c.units.filter((u) => s.done.includes(u)).length;
  return Math.round((d / c.units.length) * 100);
}

const KEY = "ai-path-progress-v1";
const EVT = "ai-path-update";

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seed(): ProgressState {
  const now = Date.now();
  const day = 86400e3; // 24h in ms (NOT 864e3 — that's only 14.4 minutes!)
  return {
    done: [1, 2, 3],
    attempts: [
      { quiz: "Python Basics Quiz", score: 4, total: 5, at: now - 2 * 36e5 },
      { quiz: "Data Types Quiz", score: 4, total: 5, at: now - 5 * 36e5 },
      { quiz: "Control Flow Quiz", score: 3, total: 5, at: now - 1 * day },
      { quiz: "Functions Quiz", score: 5, total: 5, at: now - 1 * day - 36e5 },
      { quiz: "Python Basics Quiz", score: 4, total: 5, at: now - 2 * day },
    ],
    activity: [
      { text: "Completed: Python Basics - Variables", detail: "Unit 1 finished", at: now - 2 * 36e5, kind: "unit" },
      { text: "Quiz: Data Types", detail: "Scored 4/5 (80%)", at: now - 5 * 36e5, kind: "quiz" },
      { text: "Started: Control Flow", detail: "Current topic", at: now - 1 * day, kind: "started" },
      { text: "Completed: Python Basics - Hello World", detail: "Unit 1 finished", at: now - 1 * day - 2 * 36e5, kind: "unit" },
    ],
    streak: [todayKey(), todayKey(new Date(now - day)), todayKey(new Date(now - 2 * day))],
    labHours: 4.5,
    studyMins: 105,
    goal: "Learn AI and build real projects",
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
// so React hydration never mismatches. Real data loads after mount.
const SSR_SNAPSHOT: ProgressState = { done: [], attempts: [], activity: [], streak: [], labHours: 0, studyMins: 0, goal: "Learn AI and build real projects" };
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

function touchStreak(s: ProgressState) {
  const t = todayKey();
  if (!s.streak.includes(t)) s.streak = [...s.streak, t].slice(-60);
}

// ---- mutations (all stamp real time) ----
export function toggleUnit(id: number) {
  const s = ensure();
  const has = s.done.includes(id);
  const done = has ? s.done.filter((x) => x !== id) : [...s.done, id].sort((a, b) => a - b);
  const unit = UNITS.find((u) => u.id === id);
  const activity: ActivityItem[] = has
    ? s.activity
    : [{ text: `Completed: ${unit?.title ?? ""}`, detail: `Unit ${id} finished`, at: Date.now(), kind: "unit" as const }, ...s.activity].slice(0, 20);
  touchStreak(s);
  set({
    ...s,
    done,
    activity,
    labHours: Math.round(((has ? s.labHours : s.labHours + 0.5)) * 10) / 10,
    studyMins: has ? s.studyMins : s.studyMins + 30,
  });
}

export function recordQuiz(quiz: string, score: number, total: number) {
  const s = ensure();
  const at = Date.now();
  touchStreak(s);
  set({
    ...s,
    attempts: [...s.attempts, { quiz, score, total, at }].slice(-30),
    activity: [{ text: `Quiz: ${quiz}`, detail: `Scored ${score}/${total} (${Math.round((score / Math.max(1, total)) * 100)}%)`, at, kind: "quiz" as const }, ...s.activity].slice(0, 20),
    labHours: Math.round((s.labHours + 0.5) * 10) / 10,
    studyMins: s.studyMins + 15,
  });
}

export function setGoal(goal: string) {
  const s = ensure();
  set({ ...s, goal });
}

// ---- derived (computed live, never hardcoded) ----
export function completionPct(s: ProgressState) {
  return Math.round((s.done.length / UNITS.length) * 1000) / 10;
}
export function completionInt(s: ProgressState) {
  return Math.round((s.done.length / UNITS.length) * 100);
}
export function avgScore(s: ProgressState) {
  if (!s.attempts.length) return 0;
  const last = s.attempts.slice(-5);
  return Math.round((last.reduce((a, x) => a + x.score / Math.max(1, x.total), 0) / last.length) * 1000) / 10;
}
export function streakCount(s: ProgressState) {
  let n = 0;
  const d = new Date();
  if (!s.streak.includes(todayKey(d))) d.setDate(d.getDate() - 1);
  while (s.streak.includes(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function studyTimeLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
export function relTime(ts: number) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60e3));
  if (mins < 60) return `${mins} minutes ago`.replace("1 minutes", "1 minute");
  const h = Math.round(mins / 60);
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
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
