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
- **Hybrid AI engine** — `auto` (default): local **Ollama** first, **Groq cloud**
  fallback. Cloud mode works for every user; local mode is free + private.
- **Live dashboard & transcript** — progress ring, streak (real calendar days),
  activity feed with relative timestamps, score trajectory chart. No mock numbers.

## Tech stack
Next.js 16 (App Router, webpack build) · React 19 · Tailwind CSS v4 ·
lucide-react · Ollama (`llama3.1:8b` default) · Groq (`llama-3.3-70b-versatile`)
· localStorage persistence (Supabase schema in `supabase/schema.sql` for phase 2).

## Run locally
```bash
cd D:\AI_tutor
npm install
# optional: local AI (otherwise set GROQ_API_KEY below)
D:\ollama\START-OLLAMA.bat
cp .env.local.example .env.local   # fill GROQ_API_KEY for cloud mode
npm run dev -- --port 3000
# open http://localhost:3000
```

## Environment
| Var | Purpose | Required |
|---|---|---|
| `OLLAMA_HOST` | local Ollama server (default `http://127.0.0.1:11434`) | only for local mode |
| `OLLAMA_MODEL` | default local model (`llama3.1:latest`) | no |
| `GROQ_API_KEY` | free key from `console.groq.com` — powers cloud mode for all users | for deploy |
| `AI_PROVIDER` | `auto` (default) / `groq` / `ollama` | no |

Switch engine anytime: AI Tutor header dropdown or Settings → Lab Runtime & API.

## Desktop app (.exe, Windows)
Anyone can run the full app + your models on their own laptop — no browser,
no terminal, no setup:
```bash
npm run dist
# → dist-installer/AI-Path-Setup-0.1.0.exe
```
First launch: splash screen starts the bundled Ollama sidecar, downloads
`qwen3:8b` once (~5GB, with progress), starts the app server and opens
AI-Path. Models live in `%APPDATA%/AI-Path/models` and persist across runs.
1. Push this repo to GitHub.
2. Vercel → Import → add `GROQ_API_KEY` + `AI_PROVIDER=groq` in Environment Variables.
3. Deploy. Cloud tutor works for every visitor; no Ollama needed on server.

## AI tools disclosed
Built with OpenCode (Muse Spark) as pair-programmer; LLMs used at runtime:
Ollama `llama3.1:8b` (local) and Groq `llama-3.3-70b-versatile` (cloud).
Quiz content is a curated static bank; tutor answers are model-generated.
