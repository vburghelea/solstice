import { expect, test } from "@playwright/test";

test.describe("Logout Flow (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for auth to be recognized
    await page.goto("/dashboard");

    // Wait for the logout button to be visible - this confirms auth state is loaded
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should logout successfully", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Click logout button in the sidebar
    await page.getByRole("button", { name: "Logout" }).click();

    // Wait for navigation to complete (window.location.href is used)
    await page.waitForURL(/\/auth\/login/, { timeout: 15000 });

    // Verify we're on the login page
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("should clear session on logout", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Perform logout
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });

    // Try to access protected route
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should handle logout from profile page", async ({ page }) => {
    // Navigate to profile page
    await page.goto("/dashboard/profile");

    // Wait for logout button to be visible
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    // Perform logout
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("should handle logout from teams page", async ({ page }) => {
    // Navigate to teams page
    await page.goto("/dashboard/teams");

    // Wait for logout button to be visible
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    // Perform logout
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});
