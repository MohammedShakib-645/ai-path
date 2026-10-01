import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test("authored MDX lesson renders", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 300)}`); });

  await page.goto(`${BASE}/lesson/lv0-1`, { waitUntil: "load" });
  await page.waitForTimeout(4000);

  const diag = await page.evaluate(() => ({
    skeleton: !!document.querySelector(".animate-pulse"),
    mdxBody: !!document.querySelector(".mdx-body"),
    cards: document.querySelectorAll(".card").length,
    editorial: document.body.innerText.includes("Editorial lesson"),
    sections: ["Why it matters for AI", "Quick recap", "Try it yourself"].filter((s) => document.body.innerText.includes(s)),
    blockquote: !!document.querySelector(".mdx-body blockquote"),
    code: !!document.querySelector(".mdx-body pre"),
    offline: document.body.innerText.includes("engine is offline"),
    textLen: document.body.innerText.length,
  }));

  await page.screenshot({ path: "test-results/lesson-mdx.png" });
  console.log("MDX_DIAG", JSON.stringify(diag), "ERRORS", JSON.stringify(errors.slice(0, 5)));
  expect(errors.length, "no page errors").toBe(0);
  expect(diag.mdxBody, "authored MDX body renders").toBe(true);
  expect(diag.skeleton, "no stuck skeleton").toBe(false);
});
