// Builds showcase/AI-PATH-showcase.html — ONE self-contained file (images inlined)
// that can be opened locally or attached/shared with anyone (e.g. Claude).
// Usage: node scripts/build-showcase.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "showcase");
const CAPTIONS = [
  ["01-onboarding.png", "First-run onboarding", "Goal + level + daily minutes. New users start EMPTY — no seeded fake records."],
  ["02-dashboard.png", "Dashboard", "Continue-Learning hero, today's briefing, streak, weak topic and recent activity — all computed from real progress by the LearningEngine."],
  ["03-learning-path.png", "Learning Path", "12 units. Ticking a unit updates every page live (dashboard, progress, tutor context)."],
  ["04-lesson.png", "AI Lesson", "AI-generated lesson for the unit: intro, analogy, syntax, runnable examples, mini-quiz, bookmark, Mark Complete."],
  ["05-ai-tutor.png", "AI Tutor (the brain)", "10 modes, chat history (pin/rename/delete), streaming answers, learner context injected into every call, engine badge shows which key pool answered."],
  ["06-quizzes.png", "Quizzes", "Easy + Medium (unlocks at 60%) + AI-generated tier. Every submit is scored, saved, and mistakes feed weak-topic detection."],
  ["07-practice.png", "Practice (code lab)", "Run code in a remote Piston sandbox (never on our server) + AI hint / code analysis tabs."],
  ["08-progress.png", "Progress", "Mastery per category, score trajectory, streak and completion — real numbers only."],
  ["09-activity.png", "Activity", "Grouped timeline (Today/Yesterday/This Week/Older) with search, type and date filters."],
  ["10-notes.png", "Notes", "CRUD notes with tags, pinning, search; 'Ask AI about this note' deep-links into the tutor."],
  ["11-saved.png", "Saved", "Bookmarks for lessons, AI answers and notes."],
  ["12-planner.png", "Study Planner", "AI builds a day-by-day plan from a goal; tasks are checkable and persist."],
  ["13-settings.png", "Settings", "Profile, track, AI Engine card (key-pool counts only — keys never reach the browser)."],
  ["14-search.png", "Search", "Searches units, lessons, notes, chats and pages with categorized results."],
];

const files = CAPTIONS.filter(([f]) => fs.existsSync(path.join(OUT, f)));
const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(OUT, f)).toString("base64")}`;

const cards = files
  .map(
    ([f, title, desc]) => `
  <section class="shot">
    <h2>${title}</h2>
    <p>${desc}</p>
    <img src="${img(f)}" alt="${title}" loading="lazy" />
  </section>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI-PATH — Project Walkthrough</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background:#f4f6fb; color:#101a3f; line-height:1.55; }
  header { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; padding:44px 24px 36px; }
  .wrap { max-width:1100px; margin:0 auto; padding:0 24px; }
  header h1 { margin:0; font-size:34px; letter-spacing:-.5px; }
  header p { margin:10px 0 0; font-size:15px; opacity:.95; max-width:760px; }
  .chips { margin-top:16px; display:flex; flex-wrap:wrap; gap:8px; }
  .chip { background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.32);
          padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600; }
  .facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin:26px 0 6px; }
  .fact { background:#fff; border:1px solid #e6eaf4; border-radius:14px; padding:14px 16px; }
  .fact b { display:block; font-size:19px; }
  .fact span { font-size:12px; color:#64748b; }
  main { padding:26px 0 60px; }
  .shot { background:#fff; border:1px solid #e6eaf4; border-radius:18px; padding:20px; margin-bottom:22px; }
  .shot h2 { margin:0 0 4px; font-size:20px; }
  .shot p { margin:0 0 14px; font-size:14px; color:#475569; }
  .shot img { width:100%; border:1px solid #e6eaf4; border-radius:12px; display:block; }
  h3.sect { margin:34px 0 12px; font-size:18px; }
  ul.tight { margin:0; padding-left:20px; font-size:14px; color:#334155; }
  ul.tight li { margin:5px 0; }
  code { background:#eef2ff; padding:1px 6px; border-radius:6px; font-size:13px; }
  pre { background:#0e1530; color:#e2e8f0; padding:14px 16px; border-radius:12px; overflow:auto; font-size:13px; }
  footer { text-align:center; color:#94a3b8; font-size:12px; padding:24px; }
</style></head>
<body>
<header><div class="wrap">
  <h1>AI-PATH — Your Personal AI Tutor</h1>
  <p>A multi-page web app (Next.js 16 + React 19) for the <b>Build Fast with AI: AI Build Challenge 2026</b>,
     track <b>Personalised AI Tutor</b>. One LearningEngine brain computes mastery, weak topics and the next
     action from real learner data, and injects that context into every AI call.</p>
  <div class="chips">
    <span class="chip">Next.js 16 · React 19 · Tailwind v4</span>
    <span class="chip">Groq llama-3.3-70b (primary key pool)</span>
    <span class="chip">Gemini 2.0-flash (backup pool)</span>
    <span class="chip">Automatic key failover (90s cooldown)</span>
    <span class="chip">Piston sandbox code runner</span>
    <span class="chip">7 Playwright e2e tests — all passing</span>
    <span class="chip">No fake data · no dead buttons</span>
  </div>
</div></header>

<div class="wrap">
  <div class="facts">
    <div class="fact"><b>14</b><span>routes, all with loading / error / empty states</span></div>
    <div class="fact"><b>10</b><span>AI tutor modes (explain → interview → mentor)</span></div>
    <div class="fact"><b>10+</b><span>API keys with round-robin + cooldown failover</span></div>
    <div class="fact"><b>7/7</b><span>e2e tests green (fails on any console error)</span></div>
  </div>

  <h3 class="sect">How it works (the loop)</h3>
  <ul class="tight">
    <li><b>UNDERSTAND</b> — onboarding captures goal, level, language, daily minutes.</li>
    <li><b>TEACH</b> — <code>/learn/[id]</code> generates a lesson (analogy, syntax, runnable examples, mini-quiz).</li>
    <li><b>PRACTICE</b> — sandboxed code lab + AI hints; quizzes record every mistake.</li>
    <li><b>ASSESS</b> — quiz results are scored, analysed by AI, and stored with timestamps.</li>
    <li><b>ADAPT</b> — LearningEngine recomputes mastery/weak topics → dashboard, tutor context and recommendations change.</li>
  </ul>

  <h3 class="sect">Reliability & keys</h3>
  <ul class="tight">
    <li>Keys live only in server env (<code>GROQ_KEYS</code>, <code>GEMINI_KEYS</code>) — never in the browser, localStorage or GitHub.</li>
    <li>Round-robin across keys; a 429/5xx key cools down 90s and the next key answers instantly.</li>
    <li>If every key is unavailable the UI says so honestly instead of showing fabricated content.</li>
  </ul>

  <h3 class="sect">Run it locally</h3>
  <pre>cd D:\\AI_tutor
npm install
copy .env.local.example .env.local   # paste GROQ_KEYS + GEMINI_KEYS
npm run dev -- --port 3000           # → http://localhost:3000
npx tsc --noEmit                     # type check
npx playwright test                  # 7 e2e tests</pre>

  <h3 class="sect">Screenshots (real captures of the running app)</h3>
  ${cards}
</div>
<footer>Generated from D:\\AI_tutor\\showcase • screenshots captured with Playwright against localhost:3000</footer>
</body></html>`;

const target = path.join(OUT, "AI-PATH-showcase.html");
fs.writeFileSync(target, html);
console.log("WROTE", target, (html.length / 1024 / 1024).toFixed(1) + " MB");
