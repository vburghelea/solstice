import { expect, test } from "@playwright/test";

test.describe("Authentication Server Validation (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
  });

  test("should show error for existing user on signup", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await expect(page.getByLabel("Name")).toBeEnabled();

    // Try to sign up with existing test user email
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com"); // This user exists from seed
    await page.getByLabel("Password", { exact: true }).fill("testpassword123");
    await page.getByLabel("Confirm Password").fill("testpassword123");

    await page.getByRole("button", { name: "Sign up", exact: true }).click();

    // Should show user already exists error
    await expect(page.getByText("User already exists")).toBeVisible({
      timeout: 10000,
    });

    // Wait for the form to reset - check that the button is no longer in submitting state
    await expect(page.getByRole("button", { name: "Sign up", exact: true })).toBeEnabled({
      timeout: 10000,
    });

    // Now the form fields should also be re-enabled
    await expect(page.getByLabel("Name")).toBeEnabled({ timeout: 5000 });
  });

  test("should show error for invalid credentials on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await expect(page.getByLabel("Email")).toBeEnabled();

    // Try to login with wrong password
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Should show an error message
    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 10000,
    });

    // Wait for the form to reset - check that the button is no longer in submitting state
    await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled({
      timeout: 10000,
    });

    // Now the form fields should also be re-enabled
    await expect(page.getByLabel("Email")).toBeEnabled({ timeout: 5000 });
  });
});
