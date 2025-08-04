import { expect, test } from "../../fixtures/auth-fixtures";

test.describe("Profile Management (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page - already authenticated via fixtures
    await page.goto("/dashboard/profile");

    // Wait for page to be ready
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display profile page", async ({ page }) => {
    // Already on profile page from beforeEach

    // Profile heading already verified in beforeEach

    // Check basic information card is visible
    await expect(page.getByText("Basic Information")).toBeVisible();

    // Should show user email (name might vary based on test user)
    await expect(page.getByText("Email", { exact: true })).toBeVisible();
  });

  test("should navigate to profile from dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

    // Click View Profile quick action
    await page.getByRole("link", { name: "View Profile" }).click();

    // Wait for navigation and verify
    await expect(page).toHaveURL("/dashboard/profile");
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
  });

  test("should access profile from sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for sidebar to be visible
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();

    // Click Profile in sidebar
    await sidebar.getByRole("link", { name: "Profile" }).click();

    // Wait for navigation and verify
    await expect(page).toHaveURL("/dashboard/profile");
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
  });
});
