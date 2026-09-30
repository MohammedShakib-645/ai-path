import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 940 } });
const log = [];
p.on("console", (m) => log.push(`[console.${m.type()}] ${m.text().slice(0, 300)}`));
p.on("response", (r) => { if (/pyodide|jsdelivr/.test(r.url())) log.push(`[net ${r.status()}] ${r.url().slice(0, 120)}`); });

await p.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
await p.locator("textarea").first().fill("print(2 + 3)");
await p.getByRole("button", { name: /^Run$/ }).click();
await p.waitForTimeout(60000);
const out1 = await p.locator("pre").last().innerText().catch(() => "?");
console.log("PRINT RESULT:", JSON.stringify(out1));

await p.locator("textarea").first().fill("while True:\n    pass");
await p.getByRole("button", { name: /^Run$/ }).click();
await p.waitForTimeout(20000);
const out2 = await p.locator("pre").last().innerText().catch(() => "?");
console.log("LOOP RESULT:", JSON.stringify(out2));

await p.locator("textarea").first().fill("import sys\nprint(sys.platform)");
await p.getByRole("button", { name: /^Run$/ }).click();
await p.waitForTimeout(20000);
const out3 = await p.locator("pre").last().innerText().catch(() => "?");
console.log("SYS RESULT:", JSON.stringify(out3));

console.log("---- network/console ----");
console.log(log.slice(0, 40).join("\n"));
await b.close();
