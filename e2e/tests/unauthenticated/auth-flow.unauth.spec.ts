import { expect, test } from "@playwright/test";
import { clearAuthState, uiLogin } from "../../utils/auth";

test.describe("Authentication Flow (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await clearAuthState(page);
  });

  test("should complete successful login flow", async ({ page }) => {
    // Use the uiLogin helper which handles all the login flow
    await uiLogin(
      page,
      process.env["E2E_TEST_EMAIL"]!,
      process.env["E2E_TEST_PASSWORD"]!,
    );

    // Verify user is logged in - check for welcome message
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible({
      timeout: 10_000,
    });

    // Verify sidebar navigation is present (complementary role)
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();

    // Check for specific sidebar links with exact matching to avoid strict mode violations
    // The sidebar has both "Quadball Canada Dashboard" and "Dashboard" links
    await expect(
      sidebar.getByRole("link", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Profile", exact: true }),
    ).toBeVisible();
  });

  test("should complete successful signup flow for new user", async ({ page }) => {
    await page.goto("/auth/signup");

    // Wait for the page to be ready
    await page.waitForLoadState("domcontentloaded");

    // Generate unique email for this test
    const timestamp = Date.now();
    const testEmail = `test+${timestamp}@example.com`;

    // Wait for form fields to be ready
    const nameField = page.getByLabel("Name");
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await expect(nameField).toBeEnabled({ timeout: 10_000 });

    // Fill signup form
    await nameField.fill("New Test User");
    await page.getByLabel("Email").fill(testEmail);

    // Fill password field
    const passwordField = page.getByLabel("Password", { exact: true });
    await passwordField.fill("testpassword123");

    // Tab to next field to trigger validation
    await passwordField.press("Tab");

    // Now fill confirm password - it will validate against the password field
    const confirmField = page.getByLabel("Confirm Password");
    await confirmField.fill("testpassword123");

    // Tab out to trigger validation
    await confirmField.press("Tab");

    // Submit signup
    const signupBtn = page.getByRole("button", { name: "Sign up", exact: true });
    await expect(signupBtn).toBeEnabled({ timeout: 10_000 });
    await signupBtn.click();

    // Should redirect to onboarding for new users to complete their profile
    await page.waitForURL("/onboarding", { timeout: 30_000 });

    // Verify we're on the onboarding page
    await expect(
      page.getByRole("heading", { name: /Complete Your Profile/ }),
    ).toBeVisible({ timeout: 10_000 });

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

    // Should redirect to login with redirect parameter
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page).toHaveURL(/redirect=/);

    // Use uiLogin helper to login - it will respect the redirect parameter
    await uiLogin(
      page,
      process.env["E2E_TEST_EMAIL"]!,
      process.env["E2E_TEST_PASSWORD"]!,
      "/dashboard/profile",
    );

    // Should be on the profile page now
    await expect(page).toHaveURL("/dashboard/profile");
  });
});
