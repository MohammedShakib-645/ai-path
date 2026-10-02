import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test("markdown reply renders with follow-up chips", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(`${BASE}/ai-tutor`); // default waitUntil "load" — bundle loaded before fill (hydration gate)
  await expect(page.getByText(/Start (a|your) .*session/)).toBeVisible();
  await page.getByPlaceholder(/Ask anything/).fill("Explain list comprehension in Python with an example");
  // controlled input: Send enables only after React picked up the value (post-hydration)
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled({ timeout: 15000 });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("button", { name: "Copy" }).first()).toBeVisible({ timeout: 90000 });
  await page.waitForTimeout(1200);

  const md = await page.evaluate(() => {
    const bubbles = [...document.querySelectorAll(".pop-in")];
    const last = bubbles[bubbles.length - 1];
    return {
      bubbles: bubbles.length,
      hasStrong: !!last?.querySelector("strong"),
      hasCodeBlock: !!last?.querySelector("pre"),
      hasList: !!last?.querySelector("ul, ol"),
      chips: [...(last?.querySelectorAll("button") || [])]
        .map((b) => (b.textContent || "").trim())
        .filter((t) => t.length > 10 && !/Copy|Save|run/i.test(t)),
      hasFollowupsMeta: /FOLLOWUPS:/.test(last?.textContent || ""),
      tail: (last?.textContent || "").slice(-140),
    };
  });
  console.log("MD_SMOKE", JSON.stringify(md));
  await page.screenshot({ path: "test-results/smoke-md.png", fullPage: false });
  expect(md.bubbles).toBeGreaterThanOrEqual(2);
  expect(md.hasFollowupsMeta).toBe(false);
});
