// Captures real screenshots of every AI-PATH page into showcase/*.png
// Usage: node scripts/showcase.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(process.cwd(), "showcase");

const PAGES = [
  ["01-onboarding", "/start"],
  ["02-dashboard", "/"],
  ["03-learning-path", "/learning-path"],
  ["04-lesson", "/learn/1"],
  ["05-ai-tutor", "/ai-tutor"],
  ["06-quizzes", "/quizzes"],
  ["07-practice", "/practice"],
  ["08-progress", "/progress"],
  ["09-activity", "/activity"],
  ["10-notes", "/notes"],
  ["11-saved", "/saved"],
  ["12-planner", "/planner"],
  ["13-settings", "/settings"],
  ["14-search", "/search?q=python"],
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });

// first run: create a real path (so dashboard shows real data, not seed)
await page.goto(`${BASE}/start`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Create My Learning Path/ }).click();
await page.waitForSelector("text=Continue Learning", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1200);

for (const [name, route] of PAGES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log("captured", name, route);
}

await browser.close();
console.log("DONE ->", OUT);
