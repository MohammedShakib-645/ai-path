import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";

// Load .env.local so CONFIGURED/provider expectations match the dev server
// actually running under test (Playwright does not read Next.js env files).
try {
  const raw = readFileSync(process.cwd() + "/.env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — tests use unconfigured expectations */
}

const BASE = "http://localhost:3000";
const CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROVIDERS = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || "").toLowerCase();
const errors: string[] = [];

/** Navigate and wait for the auth screen to be interactive (hydrated). */
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-hydrated]").first().waitFor({ state: "attached", timeout: 20000 });
}

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (e) => errors.push(`pageerror:${e.message}`));
  page.on("console", (m) => {
    // These tests deliberately exercise honest 4xx/5xx states (e.g. "auth not
    // configured") — Chromium logs those fetches as console errors, which is
    // expected here, not a bug.
    if (m.type() === "error" && !m.text().includes("Hydration") && !m.text().includes("Failed to load resource"))
      errors.push(`console:${m.text().slice(0, 120)}`);
  });
  await open(page, "/signup");
  await page.evaluate(() => localStorage.clear());
});

test.afterEach(() => {
  expect(errors, `JS errors: ${errors.join(" | ")}`).toEqual([]);
});

test("signup page shows the full auth surface", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  if (PROVIDERS.includes("google")) {
    await expect(page.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
    await expect(page.getByText("OR", { exact: true })).toBeVisible();
  } else {
    // unconfigured providers stay hidden — no dead buttons, no fake errors
    await expect(page.getByRole("button", { name: /Continue with Google/ })).toHaveCount(0);
    await expect(page.getByText("OR", { exact: true })).toHaveCount(0);
  }
  if (PROVIDERS.includes("github")) {
    await expect(page.getByRole("button", { name: /Continue with GitHub/ })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: /Continue with GitHub/ })).toHaveCount(0);
  }
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue as Guest" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  // desktop product panel uses a real screenshot of the app
  await expect(page.getByAltText("AI-PATH dashboard")).toBeVisible();
});

test("form validation uses human error messages", async ({ page }) => {
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.locator("#auth-email").fill("not-an-email");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.locator("#auth-email").fill("judge@example.com");
  await page.locator("#auth-pass").fill("123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Use a stronger password with at least 8 characters.")).toBeVisible();

  // weak password valid again → password mismatch check
  await page.locator("#auth-name").fill("Judge One");
  await page.locator("#auth-pass").fill("supersecret1");
  await page.locator("#auth-confirm").fill("different-pass");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("Passwords don't match.")).toBeVisible();
});

test("sign-in surface + forgot password states are honest", async ({ page }) => {
  await open(page, "/signin");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText("Continue your learning journey.")).toBeVisible();
  if (PROVIDERS.includes("google")) {
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  }
  if (PROVIDERS.includes("github")) {
    await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Continue with GitHub" })).toHaveCount(0);
  }

  // real forgot-password flow — honest about configuration state
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("button", { name: "Send Reset Link" })).toBeVisible();
  await page.locator("#auth-email").fill("judge-reset@example.com");
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  if (CONFIGURED) {
    await expect(page.getByText(/reset link is on its way|account exists/i)).toBeVisible({ timeout: 20000 });
    // never claims an email was sent when Supabase accepted the request
    await expect(page.getByRole("status")).toBeVisible();
  } else {
    await expect(
      page.getByText("Password reset isn't available yet on this deployment — email delivery isn't configured.")
    ).toBeVisible({ timeout: 20000 });
    // NO fake success while unconfigured
    await expect(page.getByText("reset link is on its way")).toHaveCount(0);
  }
});

test("guest can enter the product without registering", async ({ page }) => {
  await open(page, "/signin");
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await page.waitForURL("**/start", { timeout: 15000 });
});

test("provider failures show human messages, never technical codes", async ({ page }) => {
  await open(page, "/signin?err=oauth");
  await expect(page.getByText("Sign-in wasn't completed. Please try again.")).toBeVisible();
  await expect(page.getByText(/AUTH_ERROR|GOOGLE_CLIENT|STACK|undefined/)).toHaveCount(0);
});

test("account roundtrip: signup → sign out → sign in", async ({ page }) => {
  test.skip(!CONFIGURED, "requires the Supabase backend (see AUTH_SETUP.md)");

  const email = `judge-${Date.now()}@example.com`;
  await open(page, "/signup");
  await page.locator("#auth-name").fill("Judge Roundtrip");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-pass").fill("supersecret1");
  await page.locator("#auth-confirm").fill("supersecret1");
  await page.getByRole("button", { name: "Create Account" }).click();

  // with email confirmation ON the app says so instead of faking a session
  const confirmNotice = page.getByText("Check your inbox to confirm your email, then sign in.");
  const landed = page.waitForURL(/\/(start|dashboard)/, { timeout: 15000 }).catch(() => null);
  await confirmNotice.or(page.getByText("Account created")).first().waitFor({ timeout: 15000 }).catch(() => {});
  await landed;

  if (page.url().includes("signin") || (await confirmNotice.count()) > 0) return; // confirmation flow

  // account menu lives in the dashboard TopHeader (signup lands on /start)
  if (!page.url().includes("/dashboard")) await page.goto(`${BASE}/dashboard`);
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByText("Sign Out")).toBeVisible();
  await page.getByText("Sign Out").click();
  await expect
    .poll(
      async () => {
        const d = (await page.evaluate(async () => {
          const r = await fetch("/api/auth/session");
          return await r.json();
        })) as { user: unknown };
        return d.user === null;
      },
      { timeout: 10000 }
    )
    .toBe(true);

  // sign back in with the real credential check
  await open(page, "/signin");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-pass").fill("supersecret1");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  const session = (await page.evaluate(async () => (await fetch("/api/auth/session")).json())) as {
    user: { email: string } | null;
  };
  expect(session.user?.email).toBe(email);
});

test("unconfigured deployment reports honestly (no fake auth)", async ({ page }) => {
  test.skip(CONFIGURED, "only applies when the auth backend is not configured");

  await open(page, "/signup");
  await page.locator("#auth-name").fill("Judge Honest");
  await page.locator("#auth-email").fill(`judge-${Date.now()}@example.com`);
  await page.locator("#auth-pass").fill("supersecret1");
  await page.locator("#auth-confirm").fill("supersecret1");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText(/isn't available on this deployment yet/)).toBeVisible({ timeout: 20000 });
  // never claims success
  await expect(page.getByText("Account created")).toHaveCount(0);
});
