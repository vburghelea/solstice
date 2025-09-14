import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

test.describe("Dashboard (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });
  });

  test("should display user dashboard with correct information", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check welcome message - the seeded user has name "Test User"
    await expect(
      page.getByRole("heading", { name: /Welcome back, Test User/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Here's an overview of your Roundup Games account"),
    ).toBeVisible();

    // Check dashboard sections
    await expect(page.getByText("Membership Status")).toBeVisible();
    await expect(page.getByText("My Teams")).toBeVisible();
    await expect(page.getByText("Upcoming Events")).toBeVisible();

    // Check status cards - test@example.com now has active membership
    // The page shows "Membership Status Active" as combined text
    await expect(page.getByText("Membership Status")).toBeVisible();
    await expect(page.getByText("Active", { exact: true })).toBeVisible();
    await expect(page.getByText(/\d+ days remaining/)).toBeVisible();

    // test@example.com is now a member of test-team-1
    // The "1" appears as a large number in the teams card
    await expect(page.getByText("1", { exact: true })).toBeVisible();
    await expect(page.getByText("Active team")).toBeVisible();

    await expect(page.getByText("No events scheduled")).toBeVisible();
  });

  test("should have working quick actions", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check Quick Actions section
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();

    // Test View Profile action
    const viewProfileLink = page.getByRole("link", { name: "View Profile" });
    await expect(viewProfileLink).toBeVisible();
    await viewProfileLink.click();

    // Wait for navigation to profile
    await expect(page).toHaveURL("/dashboard/profile");
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();

    // Go back to dashboard
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

    // Test membership action - should be "Renew Now" since test user has active membership
    const getMembershipLink = page.getByRole("link", {
      name: "Renew Now",
    });
    await expect(getMembershipLink).toBeVisible();

    // Test Join a Team (should be disabled/coming soon)
    await expect(page.getByRole("button", { name: "Coming Soon" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Coming Soon" })).toBeDisabled();
  });

  test("should display recent activity section", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check Recent Activity section
    await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();

    // For a new user, should show no activity
    await expect(page.getByText("No recent activity")).toBeVisible();
    await expect(page.getByText("Your recent activities will appear here")).toBeVisible();
  });

  test("should have working sidebar navigation", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Check sidebar is visible with correct items
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();

    // Check sidebar links
    await expect(
      sidebar.getByRole("link", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Teams" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Members" })).toBeVisible();
    // Reports link is only visible to admin users
    await expect(sidebar.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Settings" })).toBeVisible();

    // Test navigation
    await sidebar.getByRole("link", { name: "Teams" }).click();
    await expect(page).toHaveURL("/dashboard/teams");

    // Wait for teams page to load
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

    await sidebar.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL("/dashboard/events");

    // Wait for events page to load
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  });

  test("should maintain authentication across page navigations", async ({ page }) => {
    // Already on dashboard from beforeEach

    // Navigate to teams
    await page.goto("/dashboard/teams");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

    // Navigate to profile
    await page.goto("/dashboard/profile");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();

    // Direct navigation should also work
    await page.goto("/dashboard/events");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  });
});
