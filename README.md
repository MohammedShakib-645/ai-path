# AI-Path — Personalised AI Tutor for Learning AI

Adaptive AI tutor that builds personal learning paths and adjusts **difficulty,
explanations, and practice to each learner's live progress**.
Built for the *Build Fast with AI: AI Build Challenge 2026* — track
**Personalised AI Tutor for Learning AI**.

## What it does
- **Adaptive learning path** — 12 units; ticking units off updates the whole app live.
- **Adaptive quizzes** — Easy bank always open; **Medium unlocks at 60% average**.
  Every submit is scored, timestamped, and feeds the transcript + charts.
- **Adaptive AI tutor** — receives your live profile (level, units done, avg score,
  current unit) with every message and adjusts depth, tone, and practice.
- **Cloud key-pool engine** — Groq keys (primary) + Gemini keys (backup) with
  round-robin rotation and 90s cooldown failover. One key limits out → next
  answers instantly. No local setup needed for any user.
- **Live dashboard & transcript** — progress ring, streak (real calendar days),
  activity feed with relative timestamps, score trajectory chart. No mock numbers.
- **LearningEngine (the brain)** — one module computes mastery, weak topics,
  next action and the context string injected into *every* AI call, so the tutor,
  dashboard and progress page never disagree.
- **First-run onboarding** — `/start` asks goal + level + daily minutes; a brand-new
  user starts **empty** with honest empty states (no seeded/fake records).

## Pages
`/start` onboarding · `/` dashboard · `/learning-path` · `/learn/[id]` AI lesson ·
`/ai-tutor` (10 modes, chat history, pin/rename) · `/quizzes` (Easy/Medium/**AI-generated**,
result analysis) · `/practice` (sandboxed code runner + AI hint/analyze) ·
`/progress` · `/activity` · `/notes` · `/saved` bookmarks · `/planner` ·
`/search` · `/settings`

## Tech stack
Next.js 16 (App Router, webpack build) · React 19 · Tailwind CSS v4 ·
lucide-react · Groq (`llama-3.3-70b-versatile`, key pool) ·
Gemini (`2.0-flash`, backup pool)
· localStorage persistence (Supabase schema in `supabase/schema.sql` for phase 2).

## Run locally
```bash
cd D:\AI_tutor
npm install
cp .env.local.example .env.local   # fill GROQ_KEYS + GEMINI_KEYS
npm run dev -- --port 3000
# open http://localhost:3000
```

## Environment (Vercel dashboard — never in code)
| Var | Purpose |
|---|---|
| `GROQ_KEYS` | comma-separated Groq keys (`gsk_...`, up to 10+, free at `console.groq.com`) — primary pool |
| `GEMINI_KEYS` | comma-separated Google AI Studio keys (`AI...`, free at `aistudio.google.com`) — backup pool |

Rotation is automatic: round-robin across keys; a key hitting 429/5xx cools
down 90s and the next key answers instantly. Counts (never values) are shown
in the tutor's AI Engine card.

## Desktop app (.exe, Windows) — optional extra
The web app is the product; the installer is only a bonus build:
```bash
npm run dist
# → dist-installer/AI-Path-Setup-0.1.0.exe
```

## Deploy
1. Push this repo to GitHub.
2. Vercel → Import → add `GROQ_KEYS` + `GEMINI_KEYS` in Environment Variables.
3. Deploy. Tutor works for every visitor with key-pool failover.

## Testing / reproducibility
```bash
npx tsc --noEmit        # type check
npx playwright test     # 7 e2e tests (onboarding, dashboard, path, quiz+AI analysis,
                        #  tutor answer, notes/planner/activity CRUD, settings persistence)
```
The e2e suite also fails on any browser console error, so regressions in the
rendering layer are caught automatically.

## AI tools disclosed
Built with OpenCode (Muse Spark) as pair-programmer; LLMs used at runtime:
Groq `llama-3.3-70b-versatile` (primary pool) and Gemini `2.0-flash` (backup pool).
Quiz content is a curated static bank; tutor answers are model-generated.
