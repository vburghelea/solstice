import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const LOGOUT_USER = {
  email: "team-join@example.com",
  password: "testpassword123",
};

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

// Remove serial mode to allow tests to run in isolation
// test.describe.configure({ mode: "serial" });

test.describe("Logout Flow (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard", LOGOUT_USER);
  });

  test("should logout successfully", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Click logout button in the sidebar
    await page.getByRole("button", { name: "Logout" }).click();

    // Wait for navigation to complete (window.location.href is used)
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 });

    // Verify we're on the login page
    await expect(
      page.getByRole("heading", { name: "Welcome back to Quadball Canada" }),
    ).toBeVisible();
  });

  test("should clear session on logout", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Perform logout - this will cause a hard navigation
    await Promise.all([
      page.waitForURL(/\/auth\/login/, { timeout: 10000 }),
      page.getByRole("button", { name: "Logout" }).click(),
    ]);

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Wait a moment for the logout to fully complete
    await page.waitForTimeout(500);

    // Try to access protected route - don't use authenticatedGoto here
    // because we're testing that we should NOT be authenticated
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should handle logout from profile page", async ({ page }) => {
    // Navigate to profile page - already authenticated from beforeEach
    await page.goto("/dashboard/profile", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({
      timeout: 15000,
    });

    // Wait a moment to ensure the page is fully interactive
    await page.waitForTimeout(1000);

    // Click logout and wait for navigation
    const logoutButton = page.getByRole("button", { name: "Logout" });

    // Use Promise.all to handle the navigation properly
    await Promise.all([
      page.waitForNavigation({
        url: /\/auth\/login/,
        waitUntil: "domcontentloaded",
        timeout: 20000,
      }),
      logoutButton.click(),
    ]);

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Try to access a protected route to verify logout worked
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/(login|signin)/, { timeout: 15000 });
  });

  test("should handle logout from teams page", async ({ page }) => {
    // Navigate to teams page - already authenticated from beforeEach
    await page.goto("/dashboard/teams", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible({
      timeout: 15000,
    });

    // Wait a moment to ensure the page is fully interactive
    await page.waitForTimeout(1000);

    // Click logout and wait for navigation
    const logoutButton = page.getByRole("button", { name: "Logout" });

    // Use Promise.all to handle the navigation properly
    await Promise.all([
      page.waitForNavigation({
        url: /\/auth\/login/,
        waitUntil: "domcontentloaded",
        timeout: 20000,
      }),
      logoutButton.click(),
    ]);

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Try to access a protected route to verify logout worked
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/(login|signin)/, { timeout: 15000 });
  });
});
