import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

test.describe("Navigation (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/player", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });
  });

  test("should have working navigation", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Verify we're on the player dashboard
    await expect(page).toHaveURL(/\/player/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

    // Test navigation to different pages using direct links
    const navTests = [
      { name: "Teams", url: "/player/teams", check: /Teams|Create/i },
      { name: "Profile", url: "/player/profile", check: /Name|Email|Avatar/i },
    ];

    for (const nav of navTests) {
      // Navigate using direct URL
      await page.goto(nav.url);

      // Check if we were redirected to login (auth session issue)
      const currentUrl = page.url();
      if (currentUrl.includes("/auth/login")) {
        // Re-authenticate and try again
        await gotoWithAuth(page, nav.url, {
          email: process.env["E2E_TEST_EMAIL"]!,
          password: process.env["E2E_TEST_PASSWORD"]!,
        });
      }

      // Wait for page to load - verify we have some content
      await expect(page.getByText(nav.check).first()).toBeVisible({ timeout: 10_000 });
    }

    // Navigate back to dashboard
    await page.goto("/player");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("should handle direct navigation to authenticated pages", async ({ page }) => {
    // Direct navigation should work for authenticated users
    const authenticatedPages = [
      { url: "/player", text: /Welcome back|Membership/i },
      { url: "/player/profile", text: /Name|Email|Avatar/i },
      { url: "/player/teams", text: /My Teams/i },
      { url: "/player/settings", text: /Account Overview|Email/i },
    ];

    for (const pageData of authenticatedPages) {
      await page.goto(pageData.url);

      // Wait for page to load - check for content
      await expect(page.getByText(pageData.text).first()).toBeVisible({
        timeout: 10_000,
      });

      // Verify the URL is correct
      await expect(page).toHaveURL(pageData.url);
      await expect(page).not.toHaveURL(/\/auth\/login/);
    }
  });

  test("should show Roundup Games branding", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check branding elements in the header/banner
    await expect(page.getByRole("link", { name: "Roundup Games" })).toBeVisible();

    // Check for the subtitle "At a table near you!"
    await expect(page.getByText(/At a table near you/i)).toBeVisible();
  });

  test("should maintain navigation state", async ({ page }) => {
    // Navigate to teams page
    await page.goto("/player/teams");

    // Wait for teams page to load
    await expect(page.getByText(/My Teams/i)).toBeVisible({ timeout: 10_000 });

    // Refresh the page
    await page.reload();

    // Should still be on teams page
    await expect(page).toHaveURL("/player/teams");
    await expect(page.getByText(/My Teams/i)).toBeVisible();
  });
});
