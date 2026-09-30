// Dark-mode audit: flags visible elements that keep a light, low-saturation
// background while the page is in dark theme (i.e. forgot to adapt).
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROUTES = ["/", "/learning-path", "/ai-tutor", "/quizzes", "/practice", "/progress",
  "/activity", "/notes", "/saved", "/planner", "/settings", "/search", "/start", "/learn/1"];

const SCRIPT = `(() => {
  document.documentElement.classList.add("dark");
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const sat = (c) => (Math.max(...c) - Math.min(...c)) / 255;
  const parse = (s) => {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(",").map(Number);
    if ((p[3] ?? 1) < 0.15) return null;
    return [p[0], p[1], p[2]];
  };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      // Tailwind gradient stops live in class names (computed style keeps var())
      if (/(^|\s)[!]?-?(from|via|to)-(white|black|slate-\d+|\w+-50|\w+-100)(\s|$)/.test(String(el.className))) {
        out.push({
          cls: String(el.className).slice(0, 90),
          tag: el.tagName,
          bg: "gradient:" + cs.backgroundImage.slice(0, 60),
          text: (el.textContent || "").trim().slice(0, 45),
        });
      }
      continue;
    }
    const c = parse(cs.backgroundColor);
    if (!c) continue;
    if (lum(c) > 165 && sat(c) < 0.35) {
      out.push({
        cls: String(el.className).slice(0, 90),
        tag: el.tagName,
        bg: cs.backgroundColor,
        text: (el.textContent || "").trim().slice(0, 45),
      });
    }
  }
  return out;
})()`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let total = 0;
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(700);
  const hits = await page.evaluate(SCRIPT).catch((e) => [{ cls: "AUDIT-ERROR", text: String(e) }]);
  if (hits.length) {
    total += hits.length;
    console.log(`\n${route}  (${hits.length})`);
    for (const h of hits.slice(0, 12)) console.log(`  [${h.tag}] ${h.bg}  "${h.text}"  :: ${h.cls}`);
  }
}
console.log(`\nTOTAL light-on-dark elements: ${total}`);
await browser.close();
