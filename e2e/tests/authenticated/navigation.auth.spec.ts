import { expect, test } from "@playwright/test";

test.describe("Navigation (Authenticated)", () => {
  test("should have complete sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("complementary");

    // Main navigation items
    const navItems = [
      { name: "Dashboard", url: "/dashboard" },
      { name: "Teams", url: "/dashboard/teams" },
      { name: "Events", url: "/dashboard/events" },
      { name: "Members", url: "/dashboard/members" },
      { name: "Reports", url: "/dashboard/reports" },
    ];

    // User navigation items
    const userItems = [
      { name: "Profile", url: "/dashboard/profile" },
      { name: "Settings", url: "/dashboard/settings" },
    ];

    // Check all navigation items are visible
    for (const item of [...navItems, ...userItems]) {
      await expect(sidebar.getByRole("link", { name: item.name })).toBeVisible();
    }

    // Test navigation to each item
    for (const item of navItems) {
      await sidebar.getByRole("link", { name: item.name }).click();
      await expect(page).toHaveURL(item.url);
    }
  });

  test("should highlight active navigation item", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("complementary");

    // Dashboard should be active
    const dashboardLink = sidebar.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");
    await expect(dashboardLink).toHaveAttribute("data-status", "active");

    // Navigate to teams
    await sidebar.getByRole("link", { name: "Teams" }).click();

    // Teams should now be active
    const teamsLink = sidebar.getByRole("link", { name: "Teams" });
    await expect(teamsLink).toHaveAttribute("aria-current", "page");

    // Dashboard should no longer be active
    await expect(dashboardLink).not.toHaveAttribute("aria-current", "page");
  });

  test("should maintain sidebar state across page refreshes", async ({ page }) => {
    await page.goto("/dashboard/teams");

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
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(url);
      await expect(page).not.toHaveURL(/\/auth\/login/);
    }
  });

  test("should show Quadball Canada branding", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("complementary");

    // Check branding elements
    await expect(sidebar.getByRole("heading", { name: "Quadball Canada" })).toBeVisible();
    await expect(sidebar.getByText("Admin Panel")).toBeVisible();
  });
});
