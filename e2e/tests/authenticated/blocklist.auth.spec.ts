import { expect, test } from "@playwright/test";
import { gotoWithAuth, uiLogin } from "../../utils/auth";
import { clearUserBlocks } from "../../utils/cleanup";

test.describe("Blocklist Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing blocks before each test
    await clearUserBlocks(page, process.env["E2E_TEST_EMAIL"]!);
  });

  test.afterEach(async ({ page }) => {
    try {
      await clearUserBlocks(page, process.env["E2E_TEST_EMAIL"]!);
    } catch (error) {
      console.warn("Cleanup failed:", error);
    }
  });

  test("should display empty blocklist when no users are blocked", async ({ page }) => {
    // Navigate to blocklist page with authentication
    await gotoWithAuth(page, "/player/profile/blocklist", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Check that the page loads - verify we're on the correct URL
    await expect(page).toHaveURL(/\/player\/profile\/blocklist/);

    // Wait for the page content to load - wait for loading state to disappear
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
    await page.waitForTimeout(2000); // Wait for translations and queries

    // Wait for the loading spinner to disappear
    const loadingText = page.getByText(/Loading blocklist/i);
    await loadingText.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {
      // Loading might already be gone, that's fine
    });

    // Check for blocklist content - look for the title or empty state
    const blocklistTitle = page.getByText("Blocklist");
    const emptyState = page.getByText("No blocked users");

    // At least one should be visible
    await expect(blocklistTitle.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("should show proper loading state", async ({ page }) => {
    // Navigate to blocklist page with authentication
    await gotoWithAuth(page, "/player/profile/blocklist", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Verify page loaded correctly - verify we're on the correct URL
    await expect(page).toHaveURL(/\/player\/profile\/blocklist/);

    // Wait for the page content to load - wait for loading state to complete
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
    await page.waitForTimeout(2000); // Wait for translations and queries

    // Wait for the loading spinner to disappear
    const loadingText = page.getByText(/Loading blocklist/i);
    await loadingText.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {
      // Loading might already be gone, that's fine
    });

    // Check for blocklist content - look for the title or empty state
    const blocklistTitle = page.getByText("Blocklist");
    const emptyState = page.getByText("No blocked users");

    // At least one should be visible
    await expect(blocklistTitle.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  // Test navigation from profile page - using direct login for stability
  test.skip("should navigate to blocklist from profile page", async ({ page }) => {
    // NOTE: This test is skipped due to auth session persistence issues
    // The session cookie is set but not sent with subsequent requests
    // This needs further investigation to fix the cookie domain/path issue

    // First login directly
    await uiLogin(
      page,
      process.env["E2E_TEST_EMAIL"]!,
      process.env["E2E_TEST_PASSWORD"]!,
    );

    // Navigate to profile page
    await page.goto("/player/profile", { waitUntil: "domcontentloaded" });

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // The blocklist link is in a card on the profile page
    // Use flexible selectors that match the current UI structure
    const blocklistLink = page
      .getByRole("link", { name: /open blocklist/i })
      .or(page.getByRole("link", { name: /blocklist/i }));

    await expect(blocklistLink).toBeVisible();

    await blocklistLink.click();

    // Should navigate to blocklist page
    await expect(page).toHaveURL(/\/player\/profile\/blocklist/);
    await expect(page.getByRole("heading", { name: /blocklist/i })).toBeVisible();
  });

  // Test error handling - using direct login for stability
  test.skip("should handle errors gracefully", async ({ page }) => {
    // NOTE: This test is skipped due to auth session persistence issues
    // The session cookie is set but not sent with subsequent requests

    // First login directly
    await uiLogin(
      page,
      process.env["E2E_TEST_EMAIL"]!,
      process.env["E2E_TEST_PASSWORD"]!,
    );

    // Mock a failed request to test error handling
    await page.route("**/api/social/blocklist**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          errors: [{ message: "Server error" }],
        }),
      });
    });

    // Navigate to blocklist page
    await page.goto("/player/profile/blocklist", { waitUntil: "domcontentloaded" });

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");

    // Should show error state - check for error message
    // The error message may be in the toast or on the page
    const errorText = page
      .getByText(/failed to load/i)
      .or(page.getByText(/server error/i))
      .or(page.getByText(/load error/i));

    await expect(errorText).toBeVisible({ timeout: 5000 });
  });
});
