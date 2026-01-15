import { expect, Page } from "@playwright/test";

/** Clears every trace of a previous session (cookies *and* storage). */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();

  // Clear storage on the current page if we have a page loaded
  // If the page isn't loaded yet or has security restrictions, skip this step
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    // Page might not be loaded yet, or has security restrictions
    // The init script below will handle clearing for new pages
  }

  // Also add init script for new pages
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Remove query params like ?edit=true that can persist
    const { origin, pathname, hash } = window.location;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", origin + pathname + hash);
    }
  });
}

/** UI login that uses the Better Auth API directly to avoid hydration issues. */
export async function uiLogin(
  page: Page,
  email: string,
  password: string,
  redirect = "/player",
) {
  const context = page.context();

  // First, navigate to the login page to ensure we're on the right domain
  await page.goto(`/auth/login?redirect=${redirect}`, { waitUntil: "domcontentloaded" });

  // Wait for the login form to be ready
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10_000 });

  // Fill in the form fields directly
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  // Intercept the login request to ensure it succeeds
  const [response] = await Promise.all([
    page.waitForResponse((resp) => resp.url().includes("/api/auth/sign-in/email"), {
      timeout: 10_000,
    }),
    page.getByRole("button", { name: "Login", exact: true }).click(),
  ]);

  console.log("[uiLogin] Login API response status:", response.status());

  if (!response.ok()) {
    const responseBody = await response.text();
    console.log("[uiLogin] Login API response body:", responseBody);
    throw new Error(`Login API call failed: ${response.status()} - ${responseBody}`);
  }

  // Wait for navigation after successful login
  await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
  await page.waitForLoadState("load", { timeout: 10_000 });

  // Wait a moment for cookies to be set
  await page.waitForTimeout(500);

  // Log cookies after login
  const cookies = await context.cookies();
  console.log("[uiLogin] Cookies after login:", cookies.length);
  console.log(
    "[uiLogin] Session cookies:",
    cookies.filter((c) => c.name.includes("roundup") || c.name.includes("session")),
  );
  console.log(
    "[uiLogin] All cookies:",
    cookies.map((c) => ({ name: c.name, domain: c.domain, path: c.path })),
  );

  // Check if we're still on login page (auth failed or redirect issue)
  const currentUrl = page.url();
  console.log("[uiLogin] Current URL after login:", currentUrl);

  if (currentUrl.includes("/auth/login")) {
    // Check cookies again
    const cookiesAfterNav = await context.cookies();
    console.log("[uiLogin] Cookies after failed navigation:", cookiesAfterNav.length);
    throw new Error(
      "Session was not established. Still on login page after form submission.",
    );
  }

  // If we're not on the target page, navigate there
  if (!currentUrl.includes(redirect)) {
    console.log(`[uiLogin] Navigating from ${currentUrl} to ${redirect}`);
    await page.goto(redirect, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
    await page.waitForLoadState("load", { timeout: 10_000 });
  }

  // Verify we're logged in - check for dashboard heading or content
  await expect(
    page.getByRole("heading", { name: /Welcome back/i }).or(page.getByText(/Overview/i)),
  ).toBeVisible({
    timeout: 10_000,
  });
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginBtn = page.getByRole("button", { name: "Login", exact: true });
  await expect(loginBtn).toBeEnabled({ timeout: 5_000 });
  await loginBtn.click();

  // Wait for navigation to complete
  await page.waitForURL("/player");
}

export async function signup(page: Page, name: string, email: string, password: string) {
  await page.goto("/auth/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  const signupBtn = page.getByRole("button", { name: "Sign up", exact: true });
  await expect(signupBtn).toBeEnabled({ timeout: 5_000 });
  await signupBtn.click();

  // Wait for navigation to complete
  await page.waitForURL("/player/player/onboarding");
}

export async function logout(page: Page) {
  // Use the sidebar logout button which is always visible
  const logoutButton = page.getByRole("button", { name: "Logout" });
  await logoutButton.waitFor({ state: "visible", timeout: 10_000 });
  await logoutButton.click();

  // Wait for redirection to the login page
  await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
}

/**
 * Convenience helper: navigate to a path with authentication.
 * If redirected to login, automatically logs in and continues to the target path.
 */
export async function gotoWithAuth(
  page: Page,
  path: string,
  {
    email = process.env["E2E_TEST_EMAIL"]!,
    password = process.env["E2E_TEST_PASSWORD"]!,
    expectRedirect = true,
  } = {},
) {
  // First try to navigate directly
  await page.goto(path, { waitUntil: "domcontentloaded" });

  // Wait for navigation to settle before checking URL
  await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {
    // If timeout, continue anyway and check the URL
  });

  // Re-read URL AFTER navigation settles to avoid race condition
  const urlAfterGoto = page.url();
  console.log("[gotoWithAuth] After navigation, URL is:", urlAfterGoto);

  // If we ended up on login page, authenticate
  if (expectRedirect && urlAfterGoto.includes("/auth/login")) {
    console.log("[gotoWithAuth] Redirected to login, authenticating...");
    await uiLogin(page, email, password, path);

    // After login, check if we're on the correct path
    // Wait for page to settle
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});

    const currentUrl = page.url();
    console.log("[gotoWithAuth] After login, URL is:", currentUrl);

    // Check if we need to navigate to the intended path
    if (!currentUrl.includes(path)) {
      console.log(`[gotoWithAuth] Navigating from ${currentUrl} to ${path}`);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page
        .waitForLoadState("domcontentloaded", { timeout: 10_000 })
        .catch(() => {});
      await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});

      // Verify we're on the correct page
      const finalUrl = page.url();
      if (!finalUrl.includes(path) && !finalUrl.includes("/auth/login")) {
        console.warn(`[gotoWithAuth] Expected ${path} but got ${finalUrl}`);
      }
    }
  } else {
    // If no login was needed, wait for the page to be ready
    console.log("[gotoWithAuth] Already authenticated, waiting for page to load");
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
  }
}
