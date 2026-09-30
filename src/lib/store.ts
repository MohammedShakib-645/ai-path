// Shared real-time progress store (localStorage-backed).
// Every page reads/writes here, so Dashboard, Path, Quiz, Tutor and
// Progress always show the same live numbers — no mock constants.
"use client";
import { useSyncExternalStore, useEffect } from "react";

export interface Unit { id: number; title: string; hours: string; icon: string }
export interface QuizAttempt { quiz: string; score: number; total: number; at: number }
export interface ActivityItem { text: string; detail: string; at: number; kind: "quiz" | "unit" | "lab" | "tutor" | "started" | "lesson" | "practice" | "note" | "plan" }
export interface Chat { id: string; title: string; pinned: boolean; mode: string; msgs: { role: "user" | "assistant"; content: string; time?: string; engine?: string; ms?: number }[]; updatedAt: number }
export interface Note { id: string; title: string; body: string; tag: string; topic: string; pinned: boolean; updatedAt: number; sketch?: string }
export interface Bookmark { id: string; kind: string; ref: string; title: string; snippet: string; at: number }
export interface StudyTask { id: string; text: string; done: boolean }
export interface StudyDay { date: string; tasks: StudyTask[] }
export interface StudyPlan { goal: string; days: StudyDay[]; createdAt: number }
export interface Prefs { level: string; language: string; goal: string; dailyMins: number; difficulty: string; respLength: string; style: string; codeLang: string }
export interface Mistake { q: string; picked: string; correct: string; topic: string; at: number }
export interface ProgressState {
  onboarded: boolean;
  done: number[];
  attempts: QuizAttempt[];
  mistakes: Mistake[];
  activity: ActivityItem[];
  streak: string[]; // YYYY-MM-DD
  labHours: number;
  studyMins: number;
  goal: string;
  chats: Chat[];
  notes: Note[];
  bookmarks: Bookmark[];
  plan: StudyPlan | null;
  prefs: Prefs;
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

const KEY = "ai-path-progress-v2";
const LEGACY_KEY = "ai-path-progress-v1";
const EVT = "ai-path-update";

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// RULE: no fake data. Brand-new users start EMPTY with honest empty states.
// First-run onboarding (/start) creates the first real records.
function seed(): ProgressState {
  return {
    onboarded: false,
    done: [],
    attempts: [],
    mistakes: [],
    activity: [],
    streak: [],
    labHours: 0,
    studyMins: 0,
    goal: "",
    chats: [],
    notes: [],
    bookmarks: [],
    plan: null,
    prefs: { level: "Beginner", language: "Python", goal: "", dailyMins: 30, difficulty: "Adaptive", respLength: "Short", style: "Examples first", codeLang: "Python" },
  };
}

export function completeOnboarding(profile: { name: string; goal: string; level: string; language: string; dailyMins: number }) {
  const s = ensure();
  // Real-time rule: signing up is not studying — the streak only starts
  // on the learner's first real action (quiz, unit, note, practice…).
  set({
    ...s,
    onboarded: true,
    goal: profile.goal,
    prefs: { ...s.prefs, level: profile.level, language: profile.language, goal: profile.goal, dailyMins: profile.dailyMins },
    activity: [{ text: "Learning path created", detail: `${profile.goal} • ${profile.level}`, at: Date.now(), kind: "started" as const }],
  });
  try {
    const p = JSON.parse(localStorage.getItem("ai-path-profile") || "{}");
    localStorage.setItem("ai-path-profile", JSON.stringify({ ...p, name: profile.name }));
  } catch { /* ignore */ }
  saveProfileName(profile.name);
}

export function recordMistakes(items: { q: string; picked: string; correct: string; topic: string }[]) {
  if (!items.length) return;
  const s = ensure();
  set({ ...s, mistakes: [...items.map((m) => ({ ...m, at: Date.now() })), ...s.mistakes].slice(0, 50) });
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
    // One-time honest migration from v1: keep real records (quizzes, units,
    // notes, chats) but drop the stats that used to be seeded/inflated by
    // fake increments — streak and study time restart at a truthful zero.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated: ProgressState = { ...seed(), ...JSON.parse(legacy), streak: [], labHours: 0, studyMins: 0 };
      localStorage.setItem(KEY, JSON.stringify(migrated));
      try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
      return migrated;
    }
  } catch { /* private mode */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

let cache: ProgressState | null = null;
// Deterministic first-render snapshot: identical on server and client,
// so React hydration never mismatches. Real data loads after mount.
const SSR_SNAPSHOT: ProgressState = { onboarded: false, done: [], attempts: [], mistakes: [], activity: [], streak: [], labHours: 0, studyMins: 0, goal: "", chats: [], notes: [], bookmarks: [], plan: null, prefs: { level: "Beginner", language: "Python", goal: "", dailyMins: 30, difficulty: "Adaptive", respLength: "Short", style: "Examples first", codeLang: "Python" } };
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

// ---- profile name (onboarding/settings) — external store so no setState-in-effect ----
let profileName = "Learner";
const profileListeners = new Set<() => void>();

function readProfileName() {
  try {
    const p = JSON.parse(localStorage.getItem("ai-path-profile") || "{}");
    profileName = typeof p.name === "string" && p.name.trim() ? p.name.trim() : "Learner";
  } catch {
    profileName = "Learner";
  }
}
if (typeof window !== "undefined") readProfileName();

export function saveProfileName(name: string) {
  profileName = name.trim() || "Learner";
  try {
    const p = JSON.parse(localStorage.getItem("ai-path-profile") || "{}");
    localStorage.setItem("ai-path-profile", JSON.stringify({ ...p, name: profileName }));
  } catch { /* ignore */ }
  profileListeners.forEach((l) => l());
}

/** Real display name from onboarding/settings — never a hardcoded person. */
export function useProfileName(): string {
  return useSyncExternalStore(
    (cb) => {
      profileListeners.add(cb);
      return () => profileListeners.delete(cb);
    },
    () => profileName,
    () => "Learner"
  );
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
  });
}

/**
 * Quiz attempt with REAL measured time: `secs` is how long the learner
 * actually spent on the quiz (start → submit). No fabricated minutes.
 */
export function recordQuiz(quiz: string, score: number, total: number, secs = 0) {
  const s = ensure();
  const at = Date.now();
  touchStreak(s);
  const studyMins = s.studyMins + Math.max(0, Math.round(secs / 60));
  set({
    ...s,
    attempts: [...s.attempts, { quiz, score, total, at }].slice(-30),
    activity: [{ text: `Quiz: ${quiz}`, detail: `Scored ${score}/${total} (${Math.round((score / Math.max(1, total)) * 100)}%)`, at, kind: "quiz" as const }, ...s.activity].slice(0, 20),
    studyMins,
    labHours: Math.round((studyMins / 60) * 10) / 10,
  });
}

/** Real measured study time in seconds (practice runs, lessons). Ignores anything under 15s. */
export function recordStudy(secs: number) {
  if (!Number.isFinite(secs) || secs < 15) return;
  const s = ensure();
  const studyMins = s.studyMins + Math.max(1, Math.round(secs / 60));
  set({ ...s, studyMins, labHours: Math.round((studyMins / 60) * 10) / 10 });
}

export function setGoal(goal: string) {
  const s = ensure();
  set({ ...s, goal });
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function logActivity(text: string, detail: string, kind: ActivityItem["kind"]) {
  const s = ensure();
  touchStreak(s);
  set({ ...s, activity: [{ text, detail, at: Date.now(), kind }, ...s.activity].slice(0, 30) });
}

// ---- chats ----
export function newChat(mode = "explain"): string {
  const s = ensure();
  const id = uid();
  set({ ...s, chats: [{ id, title: "New chat", pinned: false, mode, msgs: [], updatedAt: Date.now() }, ...s.chats].slice(0, 30) });
  return id;
}
export function saveChat(id: string, patch: Partial<Chat>) {
  const s = ensure();
  set({ ...s, chats: s.chats.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)) });
}
export function deleteChat(id: string) {
  const s = ensure();
  set({ ...s, chats: s.chats.filter((c) => c.id !== id) });
}

// ---- notes ----
export function saveNote(n: Partial<Note> & { id?: string }): string {
  const s = ensure();
  if (n.id) {
    set({ ...s, notes: s.notes.map((x) => (x.id === n.id ? { ...x, ...n, updatedAt: Date.now() } as Note : x)) });
    return n.id;
  }
  const id = uid();
  set({ ...s, notes: [{ id, title: n.title || "Untitled", body: n.body || "", tag: n.tag || "General", topic: n.topic || "", pinned: false, updatedAt: Date.now(), sketch: n.sketch }, ...s.notes].slice(0, 100) });
  return id;
}
export function deleteNote(id: string) {
  const s = ensure();
  set({ ...s, notes: s.notes.filter((x) => x.id !== id) });
}

// ---- bookmarks ----
export function toggleBookmark(kind: string, ref: string, title: string, snippet: string): boolean {
  const s = ensure();
  const has = s.bookmarks.some((b) => b.kind === kind && b.ref === ref);
  set({ ...s, bookmarks: has ? s.bookmarks.filter((b) => !(b.kind === kind && b.ref === ref)) : [{ id: uid(), kind, ref, title, snippet, at: Date.now() }, ...s.bookmarks].slice(0, 100) });
  return !has;
}

// ---- study plan ----
export function savePlan(plan: StudyPlan) {
  const s = ensure();
  set({ ...s, plan });
}
export function toggleTask(dayIdx: number, taskId: string) {
  const s = ensure();
  if (!s.plan) return;
  const days = s.plan.days.map((d, i) =>
    i !== dayIdx ? d : { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
  );
  touchStreak(s);
  set({ ...s, plan: { ...s.plan, days } });
}

// ---- prefs ----
export function savePrefs(p: Partial<Prefs>) {
  const s = ensure();
  set({ ...s, prefs: { ...s.prefs, ...p } });
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
