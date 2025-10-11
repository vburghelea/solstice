import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// Opt out of shared auth state for now until we fix the root issue
test.use({ storageState: undefined });

test.describe("Navigation (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/player", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });
  });

  test("should have complete sidebar navigation", async ({ page }) => {
    // Already on dashboard from beforeEach

    const sidebar = page.getByRole("complementary");

    // Main navigation items
    const navItems = [
      { name: "Dashboard", url: "/player" },
      { name: "Teams", url: "/player/teams" },
      { name: "Events", url: "/player/events" },
      { name: "Members", url: "/player/members" },
      // Reports link is only visible for admin users with specific roles
    ];

    // User navigation items
    const userItems = [
      { name: "Profile", url: "/player/profile" },
      { name: "Settings", url: "/player/settings" },
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
    await page.goto("/player/teams");

    // Wait for teams page to load
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be on teams page
    await expect(page).toHaveURL("/player/teams");

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
      "/player",
      "/player/profile",
      "/player/teams",
      "/player/events",
      "/player/members",
      "/player/reports",
      "/player/settings",
    ];

    for (const url of authenticatedPages) {
      // Skip /player/reports as it requires admin role
      if (url === "/player/reports") continue;

      await page.goto(url);

      // Wait for page to load - each page has its own heading
      if (url === "/player") {
        await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
      } else if (url === "/player/profile") {
        await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
      } else if (url === "/player/teams") {
        await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();
      } else if (url === "/player/events") {
        await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
      } else if (url === "/player/members") {
        await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
      } else if (url === "/player/settings") {
        await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      }

      // Verify the URL is correct
      await expect(page).toHaveURL(url);
      await expect(page).not.toHaveURL(/\/auth\/login/);
    }
  });

  test("should show Roundup Games branding", async ({ page }) => {
    // Already on dashboard from beforeEach
    const sidebar = page.getByRole("complementary");

    // Check branding elements
    await expect(sidebar.getByRole("heading", { name: "Roundup Games" })).toBeVisible();
    // Check for the subtitle "Dashboard" that appears under "Roundup Games"
    const brandingSection = sidebar
      .locator("div")
      .filter({ hasText: "Roundup Games" })
      .first();
    await expect(brandingSection.getByText("Dashboard")).toBeVisible();
  });
});
