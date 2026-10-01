import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// Phase 8 regression: every Learning Path unit action must actually work.
test("learning path unit actions are functional", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror:${e.message.slice(0, 200)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("Hydration")) errors.push(`console:${m.text().slice(0, 200)}`);
  });

  await page.goto(`${BASE}/learning-path`, { waitUntil: "load" });
  await expect(page.getByText("Learning Path (12 Topics)")).toBeVisible({ timeout: 30000 });

  // expand everything so the unit actions are visible
  const expand = page.getByRole("button", { name: /Expand All/i }).first();
  if (await expand.isVisible().catch(() => false)) await expand.click();
  await page.waitForTimeout(400);

  // 1. Lesson link navigates to a real lesson page
  const lesson = page.getByRole("link", { name: /Lesson/i }).first();
  await expect(lesson).toBeVisible();
  await lesson.click();
  await page.waitForURL(/\/learn\/.+/, { timeout: 20000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // 2. Back to the path, mark the first unit complete
  await page.goto(`${BASE}/learning-path`, { waitUntil: "load" });
  await expect(page.getByText("Learning Path (12 Topics)")).toBeVisible();
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const mark = page.getByRole("button", { name: /Mark complete/i }).first();
  await expect(mark).toBeVisible();
  await mark.click();
  await expect(page.getByRole("button", { name: /Mark incomplete/i }).first()).toBeVisible({ timeout: 10000 });

  // 3. Cheat Sheet panel toggles open
  const cheat = page.getByRole("button", { name: /Cheat Sheet/i }).first();
  await expect(cheat).toBeVisible();
  await cheat.click();
  await page.waitForTimeout(400);
  await expect(page.getByText(/Cheat sheet|Quick reference|Syntax/i).first()).toBeVisible({ timeout: 10000 });

  // 4. Take Quiz reaches the quiz page
  const quiz = page.getByRole("link", { name: /Take Quiz/i }).first();
  await quiz.click();
  await page.waitForURL(/\/quizzes/, { timeout: 20000 });

  expect(errors, `JS errors: ${errors.join(" | ")}`).toEqual([]);
});
