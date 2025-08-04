import { expect, test } from "@playwright/test";

test.describe("Navigation (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for auth to be recognized
    await page.goto("/dashboard");

    // Wait for the sidebar to be visible - confirms auth state is loaded
    await expect(page.getByRole("complementary")).toBeVisible({ timeout: 10_000 });
  });

  test("should have complete sidebar navigation", async ({ page }) => {
    // Already on dashboard from beforeEach

    const sidebar = page.getByRole("complementary");

    // Main navigation items
    const navItems = [
      { name: "Dashboard", url: "/dashboard" },
      { name: "Teams", url: "/dashboard/teams" },
      { name: "Events", url: "/dashboard/events" },
      { name: "Members", url: "/dashboard/members" },
      // Reports link is only visible for admin users with specific roles
    ];

    // User navigation items
    const userItems = [
      { name: "Profile", url: "/dashboard/profile" },
      { name: "Settings", url: "/dashboard/settings" },
    ];

    // Check all navigation items are visible
    for (const item of [...navItems, ...userItems]) {
      await expect(
        sidebar.getByRole("link", { name: item.name, exact: true }),
      ).toBeVisible();
    }

    // Test navigation to each item
    for (const item of navItems) {
      await sidebar.getByRole("link", { name: item.name, exact: true }).click();
      await expect(page).toHaveURL(item.url);
    }
  });

  test("should highlight active navigation item", async ({ page }) => {
    // Already on dashboard from beforeEach
    const sidebar = page.getByRole("complementary");

    // Dashboard should be active
    const dashboardLink = sidebar.getByRole("link", { name: "Dashboard", exact: true });
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");
    await expect(dashboardLink).toHaveAttribute("data-status", "active");

    // Navigate to teams
    await sidebar.getByRole("link", { name: "Teams", exact: true }).click();

    // Wait for teams page to load
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

    // Teams should now be active
    const teamsLink = sidebar.getByRole("link", { name: "Teams", exact: true });
    await expect(teamsLink).toHaveAttribute("aria-current", "page");

    // Dashboard should no longer be active
    await expect(dashboardLink).not.toHaveAttribute("aria-current", "page");
  });

  test("should maintain sidebar state across page refreshes", async ({ page }) => {
    // Navigate to teams page
    await page.goto("/dashboard/teams");

    // Wait for teams page to load
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be on teams page
    await expect(page).toHaveURL("/dashboard/teams");

    // Sidebar should still be visible
    const sidebar = page.getByRole("complementary");
    await expect(sidebar).toBeVisible();

    // Teams should be marked as active
    const teamsLink = sidebar.getByRole("link", { name: "Teams" });
    await expect(teamsLink).toHaveAttribute("aria-current", "page");
  });

  test("should handle direct navigation to authenticated pages", async ({ page }) => {
    // Direct navigation should work for authenticated users
    const authenticatedPages = [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/teams",
      "/dashboard/events",
      "/dashboard/members",
      "/dashboard/reports",
      "/dashboard/settings",
    ];

    for (const url of authenticatedPages) {
      // Skip /dashboard/reports as it requires admin role
      if (url === "/dashboard/reports") continue;

      await page.goto(url);

      // Wait for page to load - each page has its own heading
      if (url === "/dashboard") {
        await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
      } else if (url === "/dashboard/profile") {
        await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
      } else if (url === "/dashboard/teams") {
        await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();
      } else if (url === "/dashboard/events") {
        await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
      } else if (url === "/dashboard/members") {
        await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
      } else if (url === "/dashboard/settings") {
        await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      }

      // Verify the URL is correct
      await expect(page).toHaveURL(url);
      await expect(page).not.toHaveURL(/\/auth\/login/);

      // Verify page has loaded by checking for sidebar
      await expect(page.getByRole("complementary")).toBeVisible({ timeout: 10000 });
    }
  });

  test("should show Quadball Canada branding", async ({ page }) => {
    // Already on dashboard from beforeEach
    const sidebar = page.getByRole("complementary");

    // Check branding elements
    await expect(sidebar.getByRole("heading", { name: "Quadball Canada" })).toBeVisible();
    // Check for the subtitle "Dashboard" that appears under "Quadball Canada"
    const brandingSection = sidebar
      .locator("div")
      .filter({ hasText: "Quadball Canada" })
      .first();
    await expect(brandingSection.getByText("Dashboard")).toBeVisible();
  });
});
