import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

test.describe("Dashboard (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/player", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });
  });

  test("should display user dashboard with correct information", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check welcome message - the heading may be personalized or generic
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({
      timeout: 10_000,
    });

    // Verify we're on the player dashboard
    await expect(page).toHaveURL(/\/player/);

    // Verify dashboard has content - check for main container
    await expect(page.locator("main").first()).toBeVisible();

    // Verify dashboard has interactive elements (links or buttons)
    await expect(
      page.getByRole("link").or(page.getByRole("button")).first(),
    ).toBeVisible();
  });

  test("should have working quick actions", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check there are some links on the dashboard
    const links = page.getByRole("link");
    await expect(links.first()).toBeVisible();

    // Test that navigation works
    await page.goto("/player/profile");
    await expect(page).toHaveURL(/\/player\/profile/);

    // Go back to dashboard
    await page.goto("/player");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });

  test("should display dashboard content", async ({ page }) => {
    // Already on dashboard from beforeEach

    // The dashboard has various sections - check for content
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

    // Verify there are clickable elements (links/buttons on the dashboard cards)
    await expect(page.getByRole("link").first()).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Test navigation to different pages
    await page.goto("/player/teams");
    await expect(page).toHaveURL(/\/player\/teams/);

    await page.goto("/player/profile");
    await expect(page).toHaveURL(/\/player\/profile/);
  });

  test("should maintain authentication across page navigations", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Navigate to teams
    await page.goto("/player/teams");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Navigate to profile
    await page.goto("/player/profile");
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Direct navigation should also work
    await page.goto("/player/events");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});
