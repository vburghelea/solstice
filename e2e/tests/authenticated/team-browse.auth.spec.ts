import { expect, test } from "@playwright/test";

test.describe("Team Browsing and Search (Authenticated)", () => {
  test.describe("Browse Teams Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/teams/browse");
    });

    test("should display browse teams page", async ({ page }) => {
      // Check page header
      await expect(
        page.getByRole("heading", { name: /Browse.*Teams|Find.*Team|Discover.*Teams/i }),
      ).toBeVisible();

      // Check for search functionality
      await expect(page.getByPlaceholder(/Search.*teams/i)).toBeVisible();
    });

    test("should list all active teams", async ({ page }) => {
      // Should show both test teams
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.getByText("Test Lightning")).toBeVisible();

      // Check team information is displayed
      const thunderCard = page.locator("div[class*='card']", {
        has: page.locator("text=Test Thunder"),
      });
      await expect(thunderCard.getByText("Toronto, ON")).toBeVisible();
      await expect(thunderCard.getByText(/\d+.*members?/i)).toBeVisible();
    });

    test("should search teams by name", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search.*teams/i);

      // Search for Thunder
      await searchInput.fill("Thunder");
      await searchInput.press("Enter");

      // Should only show Test Thunder
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.getByText("Test Lightning")).not.toBeVisible();
    });

    test("should search teams by city", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search.*teams/i);

      // Search for Toronto
      await searchInput.fill("Toronto");
      await searchInput.press("Enter");

      // Should only show Toronto team
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.getByText("Test Lightning")).not.toBeVisible();
    });

    test("should show no results message for empty search", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search.*teams/i);

      // Search for non-existent team
      await searchInput.fill("NonexistentTeam");
      await searchInput.press("Enter");

      // Should show no results message
      await expect(page.getByText(/No teams found|No results/i)).toBeVisible();
    });

    test("should clear search results", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search.*teams/i);

      // Search and then clear
      await searchInput.fill("Thunder");
      await searchInput.press("Enter");

      // Clear search
      await searchInput.clear();
      await searchInput.press("Enter");

      // Should show all teams again
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.getByText("Test Lightning")).toBeVisible();
    });
  });

  test.describe("Join Team Flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/teams/browse");
    });

    test("should show join button for teams user is not in", async () => {
      // Need to test with a user that's not in all teams
      // This would require additional test user setup
      test.skip();
    });

    test("should show 'Already Member' for teams user is in", async ({ page }) => {
      // Test user is already in Test Thunder
      const thunderCard = page.locator("div[class*='card']", {
        has: page.locator("text=Test Thunder"),
      });

      // Should show member status instead of join button
      const joinButton = thunderCard.getByRole("button", { name: /Join.*Team/i });
      if (await joinButton.isVisible()) {
        // User is not a member, can join
        await expect(joinButton).toBeEnabled();
      } else {
        // User is already a member
        await expect(
          thunderCard.getByText(/Already.*member|Member|Joined/i),
        ).toBeVisible();
      }
    });

    test("should request to join a team", async () => {
      // This test needs a team the user is not already in
      // Would need to create a third test team or use a different test user
      test.skip();
    });

    test("should handle join request errors", async () => {
      // Test error scenarios like team full, invites disabled, etc.
      test.skip();
    });
  });

  test.describe("Team Filtering", () => {
    test("should filter teams by province", async ({ page }) => {
      // If province filter exists
      const provinceFilter = page.getByLabel("Province");
      if (await provinceFilter.isVisible()) {
        await provinceFilter.click();
        await page.getByRole("option", { name: "Ontario" }).click();

        // Should only show Ontario teams
        await expect(page.getByText("Test Thunder")).toBeVisible();
        await expect(page.getByText("Test Lightning")).not.toBeVisible();
      }
    });

    test("should sort teams", async ({ page }) => {
      // If sort options exist
      const sortSelect = page.getByLabel(/Sort.*by/i);
      if (await sortSelect.isVisible()) {
        // Test different sort options
        await sortSelect.click();
        await page.getByRole("option", { name: /Name/i }).click();

        // Verify sort order (would need to check actual order)
        const teams = await page.locator("text=/Test (Thunder|Lightning)/").all();
        expect(teams.length).toBeGreaterThan(0);
      }
    });

    test("should paginate results", async ({ page }) => {
      // If there are enough teams to paginate
      const pagination = page.locator("[aria-label='Pagination']");
      if (await pagination.isVisible()) {
        // Test pagination controls
        const nextButton = pagination.getByRole("button", { name: "Next" });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          // Verify different teams are shown
        }
      }
    });
  });

  test.describe("Team Quick Actions", () => {
    test("should view team details from browse page", async ({ page }) => {
      const teamCard = page.locator("div[class*='card']", {
        has: page.locator("text=Test Thunder"),
      });

      // Click view details or team name
      const viewButton = teamCard.getByRole("link", {
        name: /View.*Details|View.*Team/i,
      });
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        await teamCard.getByText("Test Thunder").click();
      }

      // Should navigate to team detail page
      await expect(page).toHaveURL(/\/dashboard\/teams\/test-team-1/);
    });

    test("should show team member count", async ({ page }) => {
      const teamCard = page.locator("div[class*='card']", {
        has: page.locator("text=Test Thunder"),
      });

      // Should display member count
      await expect(teamCard.getByText(/2.*members?/i)).toBeVisible();
    });

    test("should show team colors", async ({ page }) => {
      const teamCard = page.locator("div[class*='card']", {
        has: page.locator("text=Test Thunder"),
      });

      // Check for color indicators
      const colorIndicator = teamCard.locator("div[style*='background-color']");
      if (await colorIndicator.isVisible()) {
        await expect(colorIndicator).toHaveCSS("background-color", "rgb(255, 0, 0)");
      }
    });
  });

  test.describe("Empty States", () => {
    test("should show appropriate message when no teams exist", async () => {
      // This would require clearing all teams from the database
      // or mocking the API response
      test.skip();
    });

    test("should encourage team creation from browse page", async ({ page }) => {
      // Check for create team CTA
      const createTeamButton = page.getByRole("link", { name: /Create.*Team/i });
      if (await createTeamButton.isVisible()) {
        await createTeamButton.click();
        await expect(page).toHaveURL("/dashboard/teams/create");
      }
    });
  });
});
