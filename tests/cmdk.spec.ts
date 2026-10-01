import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test("Ctrl+K opens the command palette and navigates", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible({ timeout: 5000 });

  await palette.getByLabel("Command palette search").fill("quiz");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/quizzes", { timeout: 25000 });
  await expect(palette).toBeHidden();

  // header pill opens it too
  await page.getByRole("button", { name: "Open search (Ctrl K)" }).click();
  await expect(palette).toBeVisible({ timeout: 5000 });
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
});
