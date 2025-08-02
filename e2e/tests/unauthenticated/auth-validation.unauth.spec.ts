import { expect, test } from "@playwright/test";

test.describe("Authentication Form Validation (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
  });

  test("should show validation for empty login form", async ({ page }) => {
    await page.goto("/auth/login");

    // Clear the form (in case of autofill)
    await page.getByLabel("Email").clear();
    await page.getByLabel("Password").clear();

    // Try to submit empty form - should trigger TanStack Form validation
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Check that validation errors are shown
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should show validation error for password mismatch on signup", async ({
    page,
  }) => {
    await page.goto("/auth/signup");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password456");

    // Try to move focus or submit - TanStack Form validates on blur
    await page.getByRole("button", { name: "Sign up", exact: true }).click();

    // Check for password mismatch error - wait a bit for validation to trigger
    await expect(page.getByText("Passwords do not match")).toBeVisible({
      timeout: 10000,
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
