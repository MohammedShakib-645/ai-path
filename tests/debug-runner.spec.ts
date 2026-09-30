import { test, expect } from "@playwright/test";

// TEMPORARY diagnostic: what actually happens when we run Python in the
// Playwright browser? Dumps console, output text and CDN fetch status.
test("debug runner", async ({ page }) => {
  test.setTimeout(120000);
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => logs.push(`[reqfail] ${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`));

  await page.goto("http://localhost:3000/practice", { waitUntil: "domcontentloaded" });
  const ta = page.locator("textarea").first();
  await expect(async () => {
    const hyd = await ta.evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactProps")));
    expect(hyd).toBe(true);
  }).toPass({ timeout: 40000 });

  await ta.fill("print('HI123')");
  await page.getByRole("button", { name: /^Run$/ }).click();

  // wait up to 40s for any output
  const out = page.locator("pre, code, .font-mono").filter({ hasText: /./ }).first();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2000);
    const txt = await page.locator("main").innerText();
    if (/HI123|Error|error|failed|Time limit/.test(txt)) break;
  }

  const mainText = await page.locator("main").innerText();
  const resources = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e: any) => ({ n: e.name.slice(0, 100), s: e.responseStatus, d: Math.round(e.duration) }))
  );
  const pyodide = resources.filter((r) => /pyodide|jsdelivr/.test(r.n));
  const taValue = await ta.inputValue();

  console.log("=== TA VALUE ===", JSON.stringify(taValue));
  console.log("=== PYODIDE RESOURCES ===", JSON.stringify(pyodide));
  console.log("=== OUTPUT SLICE ===", JSON.stringify(mainText.slice(mainText.indexOf("Output") - 50, mainText.indexOf("Output") + 400)));
  console.log("=== LOGS ===", logs.join("\n"));
});
