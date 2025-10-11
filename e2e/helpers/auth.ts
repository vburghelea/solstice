import { expect, Page } from "@playwright/test";

/**
 * Ensures the user is authenticated and handles re-authentication if needed
 * This is useful for tests that might run after logout tests in sequential execution
 */
export async function ensureAuthenticated(page: Page) {
  // Wait for initial navigation to complete
  await page.waitForLoadState("domcontentloaded");

  // Wait for network to settle to ensure auth state is loaded
  await page.waitForLoadState("networkidle");

  // Check if we're on the login page after the wait
  if (page.url().includes("/auth/login")) {
    console.log("Not authenticated, logging in...");

    // Extract the redirect URL if present
    const currentUrl = new URL(page.url());
    const redirectPath = currentUrl.searchParams.get("redirect") || "/player";

    // Wait for the login form to be ready
    await page.waitForLoadState("networkidle");

    // Ensure fields are enabled before filling
    await expect(page.getByLabel("Email")).toBeEnabled({ timeout: 5000 });

    // Fill in credentials
    await page.getByLabel("Email").fill(process.env["E2E_TEST_EMAIL"]!);
    await page.getByLabel("Password").fill(process.env["E2E_TEST_PASSWORD"]!);

    // Click login button
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Wait for successful navigation to the redirect path
    await page.waitForURL(redirectPath, { timeout: 10000 });

    // For dashboard routes, verify we're logged in
    if (redirectPath.includes("/player")) {
      await expect(
        page
          .getByRole("heading", { name: /Welcome back/ })
          .or(page.getByRole("button", { name: "Logout", exact: true })),
      ).toBeVisible({ timeout: 5_000 });
    }
  }
}
