import { expect, test } from "@playwright/test";

test.describe("Logout Flow (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Console error:", msg.text());
      }
    });
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");

    // Click logout button in the sidebar
    await page.getByRole("button", { name: "Logout" }).click();

    // Should redirect to login page (wait for either navigation or URL change)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });

    // Verify we're on the login page
    await expect(
      page.getByRole("heading", { name: "Welcome back to Acme Inc." }),
    ).toBeVisible();
  });

  test("should clear session on logout", async ({ page }) => {
    await page.goto("/dashboard");

    // Perform logout
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // Try to access protected route
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should handle logout from different pages", async ({ page }) => {
    // Test logout from Profile page
    await page.goto("/dashboard/profile");
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Welcome back to Acme Inc." }),
    ).toBeVisible();

    // Re-authenticate for next test
    await page.getByLabel("Email").fill(process.env["E2E_TEST_EMAIL"]!);
    await page.getByLabel("Password").fill(process.env["E2E_TEST_PASSWORD"]!);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Test logout from Teams page
    await page.goto("/dashboard/teams", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Welcome back to Acme Inc." }),
    ).toBeVisible();
  });
});
