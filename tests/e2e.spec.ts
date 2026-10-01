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

test("first-run onboarding creates a real path", async ({ page }) => {
  await page.goto(`${BASE}/start`);
  await expect(page.getByText("Welcome to AI-PATH")).toBeVisible();
  await page.getByRole("button", { name: /Create My Learning Path/ }).click();
  await expect(page.getByText("Continue Learning")).toBeVisible({ timeout: 30000 });
  // persisted flag
  const onboarded = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}").onboarded);
  expect(onboarded).toBe(true);
  // real record created by onboarding — not seeded fake history
  await expect(page.getByText("Learning path created").first()).toBeVisible();
  const activity = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}").activity);
  expect(activity).toHaveLength(1);
});

test("dashboard renders core blocks with zero fake numbers", async ({ page }) => {
  await page.goto(`${BASE}/start`);
  await page.getByRole("button", { name: /Create My Learning Path/ }).click();
  await expect(page.getByText("Today's Briefing")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Recent Activity")).toBeVisible();
  await expect(page.getByText("Learning Goal")).toBeVisible();
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}").done?.length ?? -1);
  expect(done).toBe(0);
});

test("learning path toggle updates progress live", async ({ page }) => {
  await page.goto(`${BASE}/learning-path`);
  await expect(page.getByText("Learning Path (12 Topics)")).toBeVisible();
  await expect(page.getByText("Topics Completed").first()).toBeVisible();
  await expect(page.getByText("0 / 12").first()).toBeVisible();
  const badge = page.getByRole("button", { name: "4", exact: true }).first();
  await badge.click();
  await expect(page.getByText("1 / 12").first()).toBeVisible();
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}").done);
  expect(done).toContain(4);
});

test("quiz answer + submit saves attempt and mistakes", async ({ page }) => {
  await page.goto(`${BASE}/quizzes`);
  await expect(page.getByText("Python Basics Quiz")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByText("A.", { exact: true }).first().click();
    if (i < 4) await page.getByRole("button", { name: /Next Question/ }).click();
  }
  await page.getByRole("button", { name: /Submit Exam/ }).click();
  await expect(page.getByText(/Saved —/)).toBeVisible();
  await expect(page.getByText(/AI Analysis/)).toBeVisible({ timeout: 60000 });
  const n = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}");
    return { attempts: s.attempts?.length || 0, activity: s.activity?.length || 0 };
  });
  expect(n.attempts).toBeGreaterThanOrEqual(1);
  expect(n.activity).toBeGreaterThanOrEqual(1);
});

test("tutor answers and stores the conversation", async ({ page }) => {
  test.setTimeout(240000);
  await page.goto(`${BASE}/ai-tutor`);
  await expect(page.getByText(/Start a .* session/)).toBeVisible();
  await page.getByPlaceholder(/Ask anything/).fill("What is a tuple in one line?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("button", { name: "Copy" }).first()).toBeVisible({ timeout: 210000 });
  const chats = await page.evaluate(() => JSON.parse(localStorage.getItem("ai-path-progress-v2") || "{}").chats?.[0]?.msgs?.length || 0);
  expect(chats).toBeGreaterThanOrEqual(2);
});

test("notes + planner + activity CRUD work", async ({ page }) => {
  await page.goto(`${BASE}/start`);
  await page.getByRole("button", { name: /Create My Learning Path/ }).click();
  await expect(page.getByText("Continue Learning")).toBeVisible({ timeout: 30000 });

  await page.goto(`${BASE}/notes`);
  await page.getByRole("button", { name: /New Note/ }).click();
  await page.getByPlaceholder("Title").fill("Recursion trick");
  await page.getByPlaceholder("Write…").fill("Base case first, then recursive case.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Recursion trick")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Recursion trick")).toBeVisible();

  await page.goto(`${BASE}/activity`);
  await expect(page.getByText(/Note created/)).toBeVisible();

  await page.goto(`${BASE}/planner`);
  await expect(page.getByText(/No study plan yet/)).toBeVisible();
});

test("settings save persists", async ({ page }) => {
  await page.goto(`${BASE}/settings`);
  await page.getByPlaceholder("Your name").fill("Test User");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText(/Saved ✓/)).toBeVisible();
  await page.reload();
  await expect(page.getByPlaceholder("Your name")).toHaveValue("Test User");
});
