import { expect, test } from "@playwright/test";

test.describe("Authentication Form Validation (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
  });

  test("should show validation for empty login form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await expect(page.getByLabel("Email")).toBeEnabled();

    // Make sure fields are empty (in case of autofill)
    const emailField = page.getByLabel("Email");
    const passwordField = page.getByLabel("Password");

    await emailField.clear();
    await passwordField.clear();

    // Try to submit empty form
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Check that validation errors are shown
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should show validation error for password mismatch on signup", async ({
    page,
  }) => {
    await page.goto("/auth/signup");
    await page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await expect(page.getByLabel("Name")).toBeEnabled();

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password456");

    // Tab out of the confirm password field to trigger validation
    await page.keyboard.press("Tab");

    // Check for password mismatch error
    await expect(page.getByText("Passwords do not match")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should require valid email format", async ({ page }) => {
    await page.goto("/auth/login");

    // Try invalid email format
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Password").fill("password123");

    await page.getByRole("button", { name: "Login", exact: true }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("type", "email");

    // The browser enforces HTML5 email validation so form submission is prevented
    // We stay on the same page when trying to submit with invalid email
    await expect(page).toHaveURL("/auth/login");
  });
});
