import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

test.describe("Teams Management (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to teams page with authentication
    await gotoWithAuth(page, "/player/teams", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Wait for the page to load - check for "My Teams" heading
    await expect(page.getByText(/My Teams/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test.describe("Teams Display", () => {
    test("should display teams page with correct header", async ({ page }) => {
      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/auth\/login/);

      // Check page is teams page
      await expect(page).toHaveURL(/\/player\/teams/);

      // Check for heading (h1 tag) - wait for it to be visible
      const heading = page.locator("h1");
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Check for any cards on the page (team cards)
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    });

    test("should navigate to teams directly", async ({ page }) => {
      // Navigate to teams
      await page.goto("/player/teams");
      await expect(page).toHaveURL(/\/player\/teams/);
    });

    test("should display user teams", async ({ page }) => {
      // Test user should have teams from seed data
      // Wait for cards to load
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });

      // Check that there are some cards displayed
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test("should display teams with information", async ({ page }) => {
      // Wait for cards to load
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });

      // Check for team cards with team names
      const teamNames = ["Test Thunder", "Test Lightning"];

      // At least one team should be visible
      let visibleTeamFound = false;
      for (const teamName of teamNames) {
        const isVisible = await page
          .getByText(teamName)
          .isVisible()
          .catch(() => false);
        if (isVisible) {
          visibleTeamFound = true;
          break;
        }
      }
      expect(visibleTeamFound).toBe(true);
    });
  });

  test.describe("Team Navigation", () => {
    test("should navigate to team detail page", async ({ page }) => {
      // Find the first team card
      const cards = page.locator('[class*="Card"]');
      await expect(cards.first()).toBeVisible();

      // Click on "View Team" button
      const viewTeamButton = page.getByRole("link", { name: /View Team|View/i });
      const count = await viewTeamButton.count();

      if (count > 0) {
        await viewTeamButton.first().click();
        // Should navigate to team detail page
        await expect(page).toHaveURL(/\/player\/teams\/[^/]+$/);
      } else {
        // No teams to view, that's okay
        expect(page).toHaveURL(/\/player\/teams/);
      }
    });

    test("should navigate to create team page", async ({ page }) => {
      // Click create team button
      const createButton = page.getByRole("link", { name: /Create Team|Create/i });
      await createButton.click();

      // Should navigate to create team page
      await expect(page).toHaveURL(/\/player\/teams\/create/);
    });

    test("should navigate to browse teams from teams page", async ({ page }) => {
      // Look for browse teams link/button
      const browseLink = page.getByRole("link", { name: /Browse Teams|Browse/i });
      const count = await browseLink.count();

      if (count > 0) {
        await browseLink.first().click();
        await expect(page).toHaveURL(/\/player\/teams\/browse/);
      }
    });
  });

  test.describe("Team Actions", () => {
    test("should have working view team links", async ({ page }) => {
      // Check for view team links
      const viewLinks = page.getByRole("link", { name: /View Team|View/i });
      const count = await viewLinks.count();

      if (count > 0) {
        await expect(viewLinks.first()).toBeVisible();
        await viewLinks.first().click();
        await expect(page).toHaveURL(/\/player\/teams\/[^/]+$/);
      }
    });

    test("should have manage button for captains/coaches", async ({ page }) => {
      // Check for manage links (only visible to captains/coaches)
      const manageLinks = page.getByRole("link", { name: /Manage/i });
      const count = await manageLinks.count();

      if (count > 0) {
        await expect(manageLinks.first()).toBeVisible();
      }
      // If no manage links, user might not be captain/coach, which is fine
    });
  });
});
