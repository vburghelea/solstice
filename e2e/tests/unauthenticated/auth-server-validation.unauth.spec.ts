import { expect, test } from "@playwright/test";

test.describe("Authentication Server Validation (Unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're not authenticated
    await page.context().clearCookies();
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
    await expect(page.getByText("User already exists")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show error for invalid credentials on login", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to login with wrong password
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Should show an error message
    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 10000,
    });
  });
});
