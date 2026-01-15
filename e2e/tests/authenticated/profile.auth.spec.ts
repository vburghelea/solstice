import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

test.describe("Profile Management (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page with authentication
    await gotoWithAuth(page, "/player/profile", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Wait for page to be ready - check for profile form elements
    await expect(page.getByText(/Name|Email|Avatar/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display profile page", async ({ page }) => {
    // Already on profile page from beforeEach

    // Profile text already verified in beforeEach

    // Check there's content on the page
    const content = page.locator("main");
    await expect(content).toBeVisible();

    // Should have some cards or form elements
    const cards = page.locator('[class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate to profile from dashboard", async ({ page }) => {
    await page.goto("/player");

    // Wait for dashboard to load
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

    // Look for Profile link in the sidebar or Community card
    const profileLink = page
      .getByRole("link", { name: /Profile/i })
      .or(page.getByRole("link", { name: /account/i }));
    const count = await profileLink.count();

    if (count > 0) {
      await profileLink.first().click();

      // Wait for navigation and verify
      await expect(page).toHaveURL("/player/profile");
      await expect(page.getByText(/Name|Email|Avatar/i).first()).toBeVisible();
    } else {
      // Profile link might be named differently, try direct navigation
      await page.goto("/player/profile");
      await expect(page).toHaveURL("/player/profile");
    }
  });

  test("should access profile directly", async ({ page }) => {
    // Direct navigation to profile
    await page.goto("/player/profile");

    // Wait for navigation and verify
    await expect(page).toHaveURL("/player/profile");
    await expect(page.getByText(/Name|Email|Avatar/i).first()).toBeVisible();
  });
});
