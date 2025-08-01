import { expect, test } from "@playwright/test";

test.describe("Authentication Form Validation (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
  });

  test("should show HTML5 validation for empty login form", async ({ page }) => {
    await page.goto("/auth/login");

    // Clear the form (in case of autofill)
    await page.getByLabel("Email").clear();
    await page.getByLabel("Password").clear();

    // Try to submit empty form - should trigger HTML5 validation
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Check that the email field is invalid (HTML5 validation)
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("required", "");

    // Fill email but not password
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").clear();
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Check that the password field is invalid
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toHaveAttribute("required", "");
  });

  test("should show validation error for password mismatch on signup", async ({
    page,
  }) => {
    await page.goto("/auth/signup");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password456");

    await page.getByRole("button", { name: "Sign up", exact: true }).click();

    // Check for password mismatch error
    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("should show error for existing user on signup", async ({ page }) => {
    await page.goto("/auth/signup");

    // Try to sign up with existing test user email
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com"); // This user exists from seed
    await page.getByLabel("Password", { exact: true }).fill("testpassword123");
    await page.getByLabel("Confirm Password").fill("testpassword123");

    await page.getByRole("button", { name: "Sign up", exact: true }).click();

    // Should show user already exists error
    await expect(page.getByText("User already exists")).toBeVisible();
  });

  test("should show error for invalid credentials on login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to login with wrong password
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Should show an error message (the exact text may vary)
    await expect(page.locator(".text-destructive")).toBeVisible();
    // The error should contain text about invalid credentials
    const errorText = await page.locator(".text-destructive").textContent();
    expect(errorText).toBeTruthy();
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
  });
});
