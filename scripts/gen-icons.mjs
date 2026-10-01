// One-off: generate branded PNG icons with Playwright (no image deps).
// Usage: node scripts/gen-icons.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const html = (size) => `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
<div id="ic" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.1875)}px;
background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);
display:flex;align-items:center;justify-content:center;
box-shadow:inset 0 0 0 ${Math.max(1, Math.round(size * 0.02))}px rgba(255,255,255,0.18)">
  <span style="font-family:Arial,Helvetica,sans-serif;font-weight:800;color:#fff;font-size:${Math.round(size * 0.44)}px;letter-spacing:${Math.round(size * -0.02)}px">AI</span>
</div></body></html>`;

const targets = [
  [512, "icon-512.png"],
  [192, "icon-192.png"],
  [180, "apple-touch-icon.png"],
  [64, "icon-64.png"],
  [32, "favicon-32.png"],
];

const browser = await chromium.launch();
for (const [size, name] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size));
  await page.locator("#ic").screenshot({ path: `${OUT}/${name}`, omitBackground: true });
  await page.close();
  console.log("icon:", name);
}
await browser.close();
console.log("DONE");
