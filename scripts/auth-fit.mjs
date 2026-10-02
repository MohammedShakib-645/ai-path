// AI-PATH auth viewport fit check — measures the REAL rendered page at the
// required desktop resolutions (plus a mobile sanity pass).
// Run: node scripts/auth-fit.mjs   (dev server must be on :3000)
import { chromium } from "playwright";

const BASE = process.env.FIT_BASE || "http://localhost:3000";
const DESKTOP = [
  [1920, 1080],
  [1600, 900],
  [1440, 900],
  [1366, 768],
  [1280, 720],
];
const MOBILE = [390, 844];

// Right-panel controls — must be present on BOTH desktop and mobile.
// OAuth buttons render only when this deployment has provider credentials
const PROVIDERS = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || "").toLowerCase();
const providerTexts = [];
if (PROVIDERS.includes("google")) providerTexts.push("Continue with Google");
if (PROVIDERS.includes("github")) providerTexts.push("Continue with GitHub");

const REQUIRED = {
  "/signup": ["Create your account", ...providerTexts, "Create Account", "Confirm password", "Continue as Guest", "Sign in", "AI-PATH"],
  "/signin": [
    "Welcome back",
    "Continue your learning journey.",
    ...providerTexts,
    "Forgot password?",
    "Sign In",
    "Create one",
    "Continue as Guest",
    "AI-PATH",
  ],
};

// Left product panel — desktop only (intentionally hidden on mobile).
const DESKTOP_ONLY = ["Learn with a path built around your goals", "Your Personal AI Tutor"];

function fail(msg) {
  console.log(`  FAIL ${msg}`);
  process.exitCode = 1;
}

const browser = await chromium.launch();

async function audit(path, width, height, { expectNoScroll }) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  await page.locator("[data-hydrated]").first().waitFor({ timeout: 20000 });

  const required = expectNoScroll ? [...REQUIRED[path], ...DESKTOP_ONLY] : REQUIRED[path];
  const report = await page.evaluate((required) => {
    const de = document.documentElement;
    const text = document.body.innerText;
    const missing = required.filter((t) => !text.includes(t));
    const rectOfButton = (label) => {
      const el = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === label);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    const img = document.querySelector('img[alt="AI-PATH dashboard"]');
    const imgR = img ? img.getBoundingClientRect() : null;
    const aside = document.querySelector("aside");
    let imgWidthFrac = 0;
    if (aside && imgR) {
      const cs = getComputedStyle(aside);
      const contentW = aside.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (contentW > 0) imgWidthFrac = imgR.width / contentW;
    }
    return {
      scrollX: de.scrollWidth > de.clientWidth + 1,
      scrollY: de.scrollHeight > de.clientHeight + 1,
      docH: de.scrollHeight,
      viewH: window.innerHeight,
      viewW: window.innerWidth,
      missing,
      guest: rectOfButton("Continue as Guest"),
      google: (() => {
        const el = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Continue with Google"));
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      })(),
      imgOk: !!img && img.complete && img.naturalWidth > 0 && imgR.width >= 260 && imgR.bottom <= window.innerHeight + 1 && imgR.top >= -1,
      imgW: imgR ? Math.round(imgR.width) : 0,
      imgH: imgR ? Math.round(imgR.height) : 0,
      imgWidthFrac: Math.round(imgWidthFrac * 100) / 100,
    };
  }, required);

  const tag = `${path} @ ${width}x${height}`;
  if (report.scrollX) fail(`${tag}: horizontal overflow`);
  if (expectNoScroll && report.scrollY) fail(`${tag}: vertical scrollbar (doc ${report.docH}px > view ${report.viewH}px)`);
  if (report.missing.length) fail(`${tag}: missing text -> ${report.missing.join(" | ")}`);
  if (expectNoScroll && report.guest) {
    if (report.guest.bottom > height + 1 || report.guest.top < 0) fail(`${tag}: Continue as Guest outside viewport`);
  }
  if (expectNoScroll && report.google && (report.google.bottom > height + 1 || report.google.top < 0))
    fail(`${tag}: Google button outside viewport`);
  if (expectNoScroll && !report.imgOk) fail(`${tag}: preview img not fully in viewport (${report.imgW}x${report.imgH})`);
  if (expectNoScroll && report.imgWidthFrac < 0.85) fail(`${tag}: preview too small — only ${Math.round(report.imgWidthFrac * 100)}% of panel width (need >= 85%)`);

  if (!process.exitCode)
    console.log(
      `  ok ${tag} — doc ${report.docH}/${report.viewH}px, preview ${report.imgW}x${report.imgH} (${Math.round(report.imgWidthFrac * 100)}% width)` +
        (report.scrollY && !expectNoScroll ? " (mobile scroll allowed)" : "")
    );
  await ctx.close();
}

console.log("Desktop — must fit ONE viewport:");
for (const [w, h] of DESKTOP) {
  for (const path of Object.keys(REQUIRED)) await audit(path, w, h, { expectNoScroll: true });
}

console.log("Mobile — natural scroll ok, no horizontal overflow:");
await audit("/signup", MOBILE[0], MOBILE[1], { expectNoScroll: false });
await audit("/signin", MOBILE[0], MOBILE[1], { expectNoScroll: false });

await browser.close();
console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: PASS");
