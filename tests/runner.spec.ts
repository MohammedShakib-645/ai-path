import { test, expect, Page } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// Code runner tests — everything runs in a sandboxed Web Worker (Pyodide),
// no external service and no real LLM is called.
//
// Hydration lag: the dev server streams /practice, and fills/clicks made
// before React hydrates get silently reverted. We retry until the typed
// value sticks (same pattern as sidebar.spec.ts).

async function editorReady(page: Page, code: string) {
  const ta = page.locator("textarea").first();
  // 1) WAIT for React hydration — filling before hydration gets silently
  //    reverted when React mounts (that broke every earlier attempt).
  await expect(async () => {
    const hyd = await ta.evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactProps")));
    expect(hyd).toBe(true);
  }).toPass({ timeout: 40000 });
  // 2) Now fill and confirm the value sticks.
  await expect(async () => {
    await ta.fill(code);
    expect(await ta.inputValue()).toBe(code);
  }).toPass({ timeout: 10000 });
}

async function clickRun(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: /^Run$/ }).click();
  }).toPass({ timeout: 20000 });
}

test("infinite loop is killed by the hard timeout", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
  await editorReady(page, "while True:\n    pass");
  await clickRun(page);
  await expect(page.getByText(/Time limit exceeded/)).toBeVisible({ timeout: 120000 });
});

test("syntax error shows a real stderr message", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
  await editorReady(page, "def broken(:\n    pass");
  await clickRun(page);
  await expect(page.getByText(/SyntaxError|IndentationError/i)).toBeVisible({ timeout: 120000 });
});

test("stdin via input() is honoured", async ({ page }) => {
  test.setTimeout(180000);
  await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
  await editorReady(page, "name = input()\nprint('hello', name)");
  await page.getByPlaceholder(/3/).fill("Ada");
  await clickRun(page);
  await expect(page.getByText("hello Ada")).toBeVisible({ timeout: 120000 });
});

test("Sum-of-list solution passes every test", async ({ page }) => {
  test.setTimeout(240000);
  await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
  const solution = [
    "n = int(input())",
    "nums = list(map(int, input().split()))",
    "print(sum(nums))",
  ].join("\n");
  await editorReady(page, solution);
  await expect(async () => {
    await page.getByRole("button", { name: /^Submit$/ }).click();
  }).toPass({ timeout: 20000 });
  // both test rows show a pass
  await expect(page.getByText(/1\/2 tests passed|2\/2 tests passed/)).toBeVisible({ timeout: 200000 });
  const passCount = await page.locator("text=✓").count();
  expect(passCount).toBeGreaterThanOrEqual(2);
});

test("C / C++ / Java are hidden when no RUNNER_URL is configured", async ({ page }) => {
  await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
  const opts = await page.locator("select").first().locator("option").allTextContents();
  expect(opts).toContain("Python");
  expect(opts).toContain("JavaScript");
  if (!process.env.RUNNER_URL) {
    expect(opts).not.toContain("C++");
    expect(opts).not.toContain("Java");
  }
});
