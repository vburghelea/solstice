import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const LOGOUT_USER = {
  email: "team-join@example.com",
  password: "testpassword123",
};

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

test.describe("Logout Flow (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/player", LOGOUT_USER);
  });

  test("should logout successfully", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Look for logout button/link - could be a button or link in sidebar or header
    const logoutButton = page
      .getByRole("button", { name: /Logout|Sign out|Log out/i })
      .or(page.getByRole("link", { name: /Logout|Sign out|Log out/i }));

    const logoutCount = await logoutButton.count();

    if (logoutCount > 0) {
      await logoutButton.first().click();

      // Wait for navigation to complete
      await page.waitForURL(/\/auth\/(login|signin)/, { timeout: 15000 });

      // Verify we're on the login page - check for the login heading
      await expect(
        page.getByRole("heading", { name: /Welcome back|Sign in|Log in/i }),
      ).toBeVisible();
    } else {
      // If no logout button found, test direct navigation to logout endpoint
      await page.goto("/auth/signout", { waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/auth\/(login|signin)/, { timeout: 15000 });
      // Verify we're on the login page
      await expect(
        page.getByRole("heading", { name: /Welcome back|Sign in|Log in/i }),
      ).toBeVisible();
    }
  });

  test("should clear session on logout", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Look for logout button/link
    const logoutButton = page
      .getByRole("button", { name: /Logout|Sign out|Log out/i })
      .or(page.getByRole("link", { name: /Logout|Sign out|Log out/i }));

    const logoutCount = await logoutButton.count();

    if (logoutCount > 0) {
      await logoutButton.first().click();

      // Wait for navigation
      await page.waitForURL(/\/auth\/(login|signin)/, { timeout: 10000 });
    } else {
      await page.goto("/auth/signout", { waitUntil: "domcontentloaded" });
    }

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/(login|signin)/);

    // Wait a moment for the logout to fully complete
    await page.waitForTimeout(500);

    // Try to access protected route
    await page.goto("/player", { waitUntil: "domcontentloaded" });

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/(login|signin)/);
  });

  test("should handle logout from profile page", async ({ page }) => {
    // Navigate to profile page - already authenticated from beforeEach
    await page.goto("/player/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Profile/i)).toBeVisible({
      timeout: 15000,
    });

    // Wait a moment to ensure the page is fully interactive
    await page.waitForTimeout(1000);

    // Look for logout button/link
    const logoutButton = page
      .getByRole("button", { name: /Logout|Sign out|Log out/i })
      .or(page.getByRole("link", { name: /Logout|Sign out|Log out/i }));

    const logoutCount = await logoutButton.count();

    if (logoutCount > 0) {
      // Click logout and wait for navigation
      await Promise.all([
        page.waitForURL(/\/auth\/(login|signin)/, { timeout: 20000 }),
        logoutButton.first().click(),
      ]);
    } else {
      await page.goto("/auth/signout", { waitUntil: "domcontentloaded" });
    }

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/(login|signin)/);

    // Try to access a protected route to verify logout worked
    await page.goto("/player", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/(login|signin)/, { timeout: 15000 });
  });

  test("should handle logout from teams page", async ({ page }) => {
    // Navigate to teams page - already authenticated from beforeEach
    await page.goto("/player/teams", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Teams/i)).toBeVisible({
      timeout: 15000,
    });

    // Wait a moment to ensure the page is fully interactive
    await page.waitForTimeout(1000);

    // Look for logout button/link
    const logoutButton = page
      .getByRole("button", { name: /Logout|Sign out|Log out/i })
      .or(page.getByRole("link", { name: /Logout|Sign out|Log out/i }));

    const logoutCount = await logoutButton.count();

    if (logoutCount > 0) {
      // Click logout and wait for navigation
      await Promise.all([
        page.waitForURL(/\/auth\/(login|signin)/, { timeout: 20000 }),
        logoutButton.first().click(),
      ]);
    } else {
      await page.goto("/auth/signout", { waitUntil: "domcontentloaded" });
    }

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/(login|signin)/);

    // Try to access a protected route to verify logout worked
    await page.goto("/player", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/(login|signin)/, { timeout: 15000 });
  });
});
