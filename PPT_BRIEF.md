# AI-PATH — PPT / Demo Brief (for Claude)

> Paste this whole file to Claude with the task: **"Create a hackathon presentation PPT from this brief."**
> Screenshots live in `showcase/*.png` — attach them to the prompt too.
> Live app: https://ai-path-tutor.vercel.app · Code: https://github.com/MohammedShakib-645/ai-path

---

## 1. One-liner

**AI-PATH — "Your Personal AI Tutor":** an AI tutor that actually *knows you* — it tracks your real progress, finds your weak topics, and adapts every lesson, quiz and interview to your level.

**Tagline options:** "Learn smarter, not harder." · "Your level. Your weak topics. Your tutor."

---

## 2. Problem → Solution

| Problem | AI-PATH solution |
|---|---|
| Generic videos/courses treat everyone the same | Every answer is seeded with the learner's **level, weak topics, streak and history** |
| Students don't know *what to study next* | Dashboard + **Recommended Next Step** always shows the ONE next action |
| No way to check real understanding | Quizzes + **AI Interview** with webcam, voice, and spoken feedback |
| AI tools break when API limits hit | **3-tier AI failover + automatic key recovery** keeps the tutor alive |

---

## 3. Features (by page — real routes)

- **Landing `/`** — hero, features, dark/light theme.
- **Onboarding `/start`** — creates a personalized 12-unit learning path (level, language, goal, daily minutes).
- **Dashboard `/dashboard`** — continue-learning card, streak, weak topics, recommended next step.
- **Learn `/learn`** — learning path (12 units), lesson pages with MDX content + AI-generated lessons, cheat sheets.
- **AI Tutor `/ai-tutor`** — full-width scrollable chat. Modes: Explain, Teach Me, Debug Code, Code Review, Generate Code, Practice, Interview, Exam Prep, Mentor, Study Planner. Attach images/PDFs (multimodal), run Python code inline, copy/save answers, follow-up suggestion chips, chat history with rename/pin/delete, deep-links from notes (`?topic=`/`?note=`).
- **Quizzes `/quizzes`** — easy/medium/hard + AI-generated question banks, timed attempts, weak-topic mistake tracking.
- **Practice `/practice`** — coding tasks with AI code analysis, run & fix, side-by-side diff.
- **AI Interview `/interview`** — webcam room, AI asks questions (auto-read aloud via voice), you answer by voice or typing, AI **speaks the verdict and final score** back; camera device picker + connection watchdog (honest error states).
- **Projects `/projects`**, **Notes `/notes`** (ask AI about a note), **Planner `/planner`**, **Activity `/activity`**, **Progress `/progress`** (charts), **Saved `/saved`**, **Settings `/settings`** (profile, track, AI engine status, notices).
- **Cmd+K command palette** — global search + navigation.
- **Floating AI bot** — task runner on every page (tell my next step / fix weak topic / plan session / quiz me / summarize screen).

---

## 4. AI Architecture (the "hard" part — put on its own slide)

- **3-tier failover:** Groq (7-key pool, primary — `gpt-oss-120b`) → OpenRouter free models (3-key pool) → Google Gemini (`gemini-3-flash-preview`, fallback `gemini-flash-latest`).
- **Automatic key recovery:** every error is classified (401/403, 429, 5xx, network) and the key is parked for a cool-down (429 → honors `Retry-After`, default 120 s; auth errors → 30 min), then **re-enters rotation automatically**. The tutor never goes down when one provider rate-limits.
- **Security:** API keys live **only** in server env (never in the browser bundle). All AI calls go through server routes (`/api/ai/chat`, `/api/ai/quiz`, …).
- **Local execution:** Python runs in a **Pyodide sandbox** in the browser — code exercises work offline, no server cost.
- **Honest UI:** no fake data anywhere — real empty states, real error states, engine status chip (`cloud ready`) shown transparently.

---

## 5. Tech stack

- **Next.js 16 (App Router) + TypeScript** — strict, `tsc --noEmit` clean.
- **React 19**, Tailwind CSS, custom design system (Inter / Plus Jakarta Sans / JetBrains Mono, dark+light).
- **Zustand-style local store** with versioned migration (`ai-path-progress-v2 → v3`) so no user loses progress.
- **Playwright** E2E suite (14 tests), ESLint **0 errors** repo-wide.
- **Pyodide** (in-browser Python), Web Speech API (voice out), `getUserMedia` (camera).
- **Deployed on Vercel** — live at ai-path-tutor.vercel.app, GitHub: MohammedShakib-645/ai-path.

---

## 6. Quality gates (credibility slide)

| Gate | Status |
|---|---|
| TypeScript strict | 0 errors |
| ESLint | 0 errors (warnings only) |
| Playwright E2E | **14 / 14 passing** |
| Production build | ✅ passing |
| Deploy pipeline | Vercel, per-commit |

---

## 7. What makes it special (judge hooks)

1. **Adaptive, not generic** — the tutor prompt is injected with the learner's real level/weak-topics/history every single call.
2. **Voice + camera interview mode** — most hackathon tutors are text-only; this one *talks back* and reads the score aloud.
3. **Reliability engineering** — 3 providers, key pools, rate-limit-aware auto-recovery (demo: disable a provider, tutor keeps answering).
4. **Runs Python for real** — inline code runner, not screenshots of output.
5. **Honest product** — no dummy data, transparent engine chip, graceful offline behavior.

---

## 8. Suggested 12-slide outline

1. **Title** — AI-PATH · Your Personal AI Tutor · Build Fast with AI 2026 · team name.
2. **Problem** — one-size-fits-all learning.
3. **Solution** — one-liner + landing screenshot (`00-landing.png`).
4. **Product tour: onboarding** — 12-unit personalized path (`01-onboarding.png`).
5. **Product tour: dashboard** — weak topics, next step, streak (`02-dashboard.png`).
6. **AI Tutor** — full chat, 10 modes, attachments, live reply (`05-ai-tutor.png`).
7. **AI Interview** — camera + voice + spoken score (`15-interview.png`).
8. **Practice & Quizzes** — run/fix code, tiered quizzes (`07-practice.png`, `06-quizzes.png`).
9. **Progress & motivation** — charts, streak, activity (`08-progress.png`).
10. **Architecture** — 3-tier failover + key auto-recovery diagram (draw boxes: Groq → OpenRouter → Gemini; server proxy; browser).
11. **Quality** — gates table (Section 6) + tech stack.
12. **Closing** — live URL + repo QR code + "Try it now".

---

## 9. Demo-video scene list (60–90 s)

1. Landing → **Create My Learning Path** (3 clicks).
2. Dashboard shows weak topics + next step.
3. AI Tutor: ask "Explain Python lists" → live reply with code → **Run** the code.
4. Quizzes: answer a question → mistake tracked.
5. AI Interview: camera on → AI asks (voice) → answer → **hear the score spoken**.
6. End on live URL + repo.

---

## 10. Screenshot inventory (`showcase/*.png`, 1440×940)

`00-landing` · `01-onboarding` · `02-dashboard` · `03-learning-path` · `04-lesson` · `05-ai-tutor` (live AI reply) · `06-quizzes` · `07-practice` · `08-progress` · `09-activity` · `10-notes` · `11-saved` · `12-planner` · `13-settings` · `14-search` · `15-interview`

---

### Honesty note (keep in the PPT)
Real numbers only: 12-unit path, 14 passing tests, 7+3+keys pool **counts** (never list key values), live URL works today. Do not invent user counts or benchmarks.
