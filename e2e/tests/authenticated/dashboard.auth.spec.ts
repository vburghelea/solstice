import { expect, test } from "@playwright/test";

test.describe("Dashboard (Authenticated)", () => {
  test("should display user dashboard with correct information", async ({ page }) => {
    await page.goto("/dashboard");

    // Check welcome message - the seeded user has name "Test User"
    await expect(
      page.getByRole("heading", { name: /Welcome back, Test User/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Here's an overview of your Quadball Canada account"),
    ).toBeVisible();

    // Check dashboard sections
    await expect(page.getByText("Membership Status")).toBeVisible();
    await expect(page.getByText("My Teams")).toBeVisible();
    await expect(page.getByText("Upcoming Events")).toBeVisible();

    // Check status cards
    await expect(page.getByText("Inactive")).toBeVisible();
    await expect(page.getByText("No active membership")).toBeVisible();
    await expect(page.getByText("Not on any teams yet")).toBeVisible();
    await expect(page.getByText("No events scheduled")).toBeVisible();
  });

  test("should have working quick actions", async ({ page }) => {
    await page.goto("/dashboard");

    // Check Quick Actions section
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();

    // Test View Profile action
    const viewProfileLink = page.getByRole("link", { name: "View Profile" });
    await expect(viewProfileLink).toBeVisible();
    await viewProfileLink.click();
    await expect(page).toHaveURL("/dashboard/profile");

    // Go back to dashboard
    await page.getByRole("link", { name: "Dashboard" }).click();

    // Test Get Membership action
    const getMembershipLink = page.getByRole("link", { name: "Get Membership" });
    await expect(getMembershipLink).toBeVisible();

    // Test Join a Team (should be disabled/coming soon)
    await expect(page.getByRole("button", { name: "Coming Soon" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Coming Soon" })).toBeDisabled();
  });

  test("should display recent activity section", async ({ page }) => {
    await page.goto("/dashboard");

    // Check Recent Activity section
    await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();

    // For a new user, should show no activity
    await expect(page.getByText("No recent activity")).toBeVisible();
    await expect(page.getByText("Your recent activities will appear here")).toBeVisible();
  });

  test("should have working sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard");

    // Check sidebar is visible with correct items
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();

    // Check sidebar links
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Teams" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Members" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Reports" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Settings" })).toBeVisible();

    // Test navigation
    await sidebar.getByRole("link", { name: "Teams" }).click();
    await expect(page).toHaveURL("/dashboard/teams");

    await sidebar.getByRole("link", { name: "Events" }).click();
    await expect(page).toHaveURL("/dashboard/events");
  });

  test("should maintain authentication across page navigations", async ({ page }) => {
    // Start at dashboard
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();

    // Navigate to teams
    await page.goto("/dashboard/teams", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Navigate to profile
    await page.goto("/dashboard/profile", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/auth\/login/);

    // Direct navigation should also work
    await page.goto("/dashboard/events", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});
