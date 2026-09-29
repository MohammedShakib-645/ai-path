import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (e) => errors.push(`pageerror:${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("Hydration")) errors.push(`console:${m.text().slice(0, 120)}`);
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
});

test.afterEach(() => {
  expect(errors, `JS errors: ${errors.join(" | ")}`).toEqual([]);
});

test("dashboard renders design blocks", async ({ page }) => {
  await expect(page.getByText("Your AI Learning Companion")).toBeVisible();
  await expect(page.getByText("Overall Completion")).toBeVisible();
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("Weekly Study Goal")).toBeVisible();
  await expect(page.getByText("Recent Activity")).toBeVisible();
});

test("learning path toggle updates progress live", async ({ page }) => {
  await page.goto(`${BASE}/learning-path`);
  await expect(page.getByText("Learning Path (12 Topics)")).toBeVisible();
  // seed = 3/12 = 25% (banner shows "3 / 12" + "Topics Completed" in parts)
  await expect(page.getByText("Topics Completed").first()).toBeVisible();
  const bannerCount = page.getByText("3 / 12").first();
  await expect(bannerCount).toBeVisible();
  // toggle unit 4 (In Progress badge button shows "4")
  const badge = page.getByRole("button", { name: "4", exact: true }).first();
  await badge.click();
  await expect(page.getByText("4 / 12").first()).toBeVisible();
  // toggle back
  await page.getByRole("button", { name: "✓" }).first().click();
  await expect(page.getByText("3 / 12").first()).toBeVisible();
});

test("quiz answer + submit saves attempt", async ({ page }) => {
  await page.goto(`${BASE}/quizzes`);
  await expect(page.getByText("Python Basics Quiz")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    // click first option, then next/submit
    await page.getByText("A.", { exact: true }).first().click();
    if (i < 4) {
      await page.getByRole("button", { name: /Next Question/ }).click();
    }
  }
  await page.getByRole("button", { name: /Submit Exam/ }).click();
  await expect(page.getByText(/Saved —/)).toBeVisible();
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v1") || "{}").attempts?.length || 0);
  expect(n).toBeGreaterThanOrEqual(6); // 5 seeded + 1 new
});

test("tutor streams a real answer", async ({ page }) => {
  test.setTimeout(240000);
  await page.goto(`${BASE}/ai-tutor`);
  // 1 Copy button = welcome message only
  await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(1);
  await page.getByPlaceholder(/Ask about Python/).fill("What is a tuple in one line?");
  await page.getByRole("button", { name: "Send message" }).click();
  // full streamed answer arrives => second Copy button appears (content !== "")
  await expect(page.getByRole("button", { name: "Copy" })).toHaveCount(2, { timeout: 210000 });
  // engine badge proves which model really answered
  await expect(page.getByText(/ollama:|groq:/).first()).toBeVisible();
});

test("settings save persists", async ({ page }) => {
  await page.goto(`${BASE}/settings`);
  await page.locator('input[value="Mohammed Shakib"]').fill("Test User");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Saved ✓")).toBeVisible();
  await page.reload();
  await expect(page.locator('input[value="Test User"]')).toBeVisible();
});
