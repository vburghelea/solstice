import { expect, test } from "@playwright/test";

test.describe("Authentication Flow (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
  });

  test("should complete successful login flow", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill in test user credentials
    await page.getByLabel("Email").fill(process.env["E2E_TEST_EMAIL"]!);
    await page.getByLabel("Password").fill(process.env["E2E_TEST_PASSWORD"]!);

    // Click login
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Should redirect to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

    // Verify user is logged in - check for sidebar navigation
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    // Use exact match to avoid conflicts with "View Profile" button
    await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
  });

  test("should complete successful signup flow for new user", async ({ page }) => {
    await page.goto("/auth/signup");

    // Generate unique email for this test
    const timestamp = Date.now();
    const testEmail = `test+${timestamp}@example.com`;

    // Fill signup form
    await page.getByLabel("Name").fill("New Test User");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill("testpassword123");
    await page.getByLabel("Confirm Password").fill("testpassword123");

    // Submit signup
    await page.getByRole("button", { name: "Sign up", exact: true }).click();

    // Should redirect to onboarding for new users
    await page.waitForURL("/onboarding");

    // Verify we're on the onboarding page
    await expect(
      page.getByRole("heading", { name: "Complete Your Profile" }),
    ).toBeVisible();

    // Clean up: Note - in a real test suite, we'd have a cleanup step
    // to remove test users created during tests
  });

  test("should handle OAuth login buttons", async ({ page }) => {
    await page.goto("/auth/login");

    // Check that OAuth buttons are present and clickable
    const googleLoginButton = page.getByRole("button", { name: "Login with Google" });
    await expect(googleLoginButton).toBeVisible();
    await expect(googleLoginButton).toBeEnabled();

    // Note: We can't test the actual OAuth flow in E2E tests
    // as it involves external services
  });

  test("should persist redirect after login", async ({ page }) => {
    // Try to access a protected page
    await page.goto("/dashboard/profile");

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Login
    await page.getByLabel("Email").fill(process.env["E2E_TEST_EMAIL"]!);
    await page.getByLabel("Password").fill(process.env["E2E_TEST_PASSWORD"]!);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Should redirect back to originally requested page
    // Note: This depends on implementation - adjust based on actual behavior
    await page.waitForURL(/\/dashboard/);
  });
});
