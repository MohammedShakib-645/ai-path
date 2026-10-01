import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test.describe("sidebar", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop only");

  test("collapses and expands, keeps all links, persists", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const aside = page.locator("aside.hidden").first();

    // all 14 grouped nav links present (Settings lives in the pinned footer)
    await expect(aside.locator("nav a")).toHaveCount(14);

    const wide = (await aside.boundingBox())!.width;
    const toggle = aside.getByRole("button", { name: /Collapse sidebar|Expand sidebar/ });
    // in dev the first click can land before React hydrates — retry until it takes
    await expect(async () => {
      await toggle.click();
      await expect(aside).toHaveClass(/w-\[72px\]/, { timeout: 1500 });
    }).toPass({ timeout: 20000 });
    await page.waitForFunction(
      () => ((document.querySelector("aside.hidden") as HTMLElement | null)?.getBoundingClientRect().width ?? 0) < 100,
      undefined,
      { timeout: 5000 }
    );
    const narrow = (await aside.boundingBox())!.width;
    expect(narrow).toBeLessThan(wide);

    // every item still reachable in rail mode (icons with titles)
    await expect(aside.locator("nav a")).toHaveCount(14);
    await expect(aside.locator('a[title="Settings"]')).toHaveCount(1);

    // expands back
    const toggle2 = aside.getByRole("button", { name: /Expand sidebar/ });
    await expect(async () => {
      await toggle2.click();
      await expect(aside).toHaveClass(/w-\[248px\]/, { timeout: 1500 });
    }).toPass({ timeout: 20000 });
    await page.waitForFunction(
      () => ((document.querySelector("aside.hidden") as HTMLElement | null)?.getBoundingClientRect().width ?? 0) >= 246,
      undefined,
      { timeout: 5000 }
    );
    expect((await aside.boundingBox())!.width).toBeGreaterThan(narrow);

    // persists across reload (wait for the width transition to settle too)
    const before = (await aside.boundingBox())!.width;
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(aside).toHaveClass(/w-\[248px\]/, { timeout: 10000 });
    await page.waitForFunction(
      () => ((document.querySelector("aside.hidden") as HTMLElement | null)?.getBoundingClientRect().width ?? 0) >= 246,
      undefined,
      { timeout: 5000 }
    );
    expect(Math.abs((await aside.boundingBox())!.width - before)).toBeLessThan(4);
  });

  test("settings is reachable without page scroll", async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const settings = page.getByRole("link", { name: "Settings" });
    const box = await settings.boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box!.y).toBeLessThan(vh);
    await settings.click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("AI bot is present on every page", async ({ page }) => {
    for (const route of ["/", "/quizzes", "/progress", "/notes", "/settings", "/ai-tutor"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Open AI bot" })).toBeVisible();
    }
  });
});
