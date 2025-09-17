import { expect, Page } from "@playwright/test";

/** Clears every trace of a previous session (cookies *and* storage). */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
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

/** UI login that waits for the form to be *ready* before clicking. */
export async function uiLogin(
  page: Page,
  email: string,
  password: string,
  redirect = "/dashboard",
) {
  await page.goto(`/auth/login?redirect=${redirect}`);

  // Wait for page to be fully loaded
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByTestId("login-form")).toHaveAttribute("data-hydrated", "true", {
    timeout: 10_000,
  });

  // Wait for email field to be visible and enabled
  const emailField = page.getByLabel("Email");
  await expect(emailField).toBeVisible({ timeout: 10_000 });
  await expect(emailField).toBeEnabled({ timeout: 10_000 });

  // Click and fill email field
  await emailField.click();
  await emailField.fill(email);
  await expect(emailField).toHaveValue(email, { timeout: 5_000 });
  const filledEmail = await emailField.inputValue();
  console.log(`[uiLogin] Filled email: ${filledEmail}`);

  // Wait for password field to be enabled
  const passwordField = page.getByLabel("Password");
  await expect(passwordField).toBeEnabled({ timeout: 10_000 });

  // Click and fill password field
  await passwordField.click();
  await passwordField.fill(password);
  const filledPasswordLength = (await passwordField.inputValue()).length;
  console.log(`[uiLogin] Filled password length: ${filledPasswordLength}`);

  // Ensure button is enabled before clicking
  const btn = page.getByRole("button", { name: "Login", exact: true });
  await expect(btn).toBeEnabled({ timeout: 10_000 });
  try {
    await Promise.all([
      page.waitForURL(
        (url) => {
          const currentUrl = typeof url === "string" ? url : url.toString();
          return !currentUrl.includes("/auth/login");
        },
        { timeout: 30_000, waitUntil: "commit" },
      ),
      btn.click(),
    ]);

    // SPA navigation might keep background requests alive; don't block forever waiting for network idle
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown navigation failure";
    throw new Error(
      `Login did not navigate away from the auth page: ${message}. Current URL: ${page.url()}`,
    );
  }
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginBtn = page.getByRole("button", { name: "Login", exact: true });
  await expect(loginBtn).toBeEnabled({ timeout: 5_000 });
  await loginBtn.click();

  // Wait for navigation to complete
  await page.waitForURL("/dashboard");
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
  await page.waitForURL("/onboarding");
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

  // Re-read URL AFTER navigation settles to avoid race condition
  const urlAfterGoto = page.url();

  // If we ended up on login page, authenticate
  if (expectRedirect && urlAfterGoto.includes("/auth/login")) {
    await uiLogin(page, email, password, path);
    // After login, check if we're on dashboard (redirect might be stripped)
    await page.waitForLoadState("networkidle");
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard") && !currentUrl.includes(path)) {
      // Navigate to the intended path since redirect was stripped
      console.log(`Redirect was stripped. Navigating from ${currentUrl} to ${path}`);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      // Verify we're on the correct page
      const finalUrl = page.url();
      if (!finalUrl.includes(path)) {
        throw new Error(`Failed to navigate to ${path}. Current URL: ${finalUrl}`);
      }
    }
  } else {
    // If no login was needed, wait for the page to be ready
    // Wait for content to be loaded by checking for common elements
    await page.waitForLoadState("domcontentloaded");
    // Give a small moment for any client-side routing to settle
    await page.waitForLoadState("networkidle");
  }
}
