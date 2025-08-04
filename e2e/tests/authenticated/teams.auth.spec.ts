import { expect, test } from "@playwright/test";

test.describe("Teams Management (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Simply navigate to the teams page - we already have auth from storageState
    await page.goto("/dashboard/teams");

    // Wait for the page to load
    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible({
      timeout: 15000,
    });
  });

  test.describe("Teams Display", () => {
    test("should display teams page with correct header", async ({ page }) => {
      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/auth\/login/);

      // Check page header
      await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();
      await expect(page.getByText("Manage your teams and memberships")).toBeVisible();

      // Check create team button
      await expect(page.getByRole("link", { name: "Create Team" })).toBeVisible();
    });

    test("should navigate to teams from sidebar", async ({ page }) => {
      await page.goto("/dashboard");

      const sidebar = page.getByRole("complementary");
      await sidebar.getByRole("link", { name: "Teams" }).click();
      await expect(page).toHaveURL("/dashboard/teams");
    });

    test("should display user teams with correct information", async ({ page }) => {
      // Test user should have Test Thunder team
      const teamCard = page.locator("div[data-slot='card']", {
        has: page.locator("text=Test Thunder"),
      });

      await expect(teamCard).toBeVisible();
      await expect(teamCard.getByText("Toronto, ON")).toBeVisible();
      await expect(teamCard.getByText("Role")).toBeVisible();
      await expect(teamCard.getByText("captain")).toBeVisible();
      await expect(teamCard.getByText("Members")).toBeVisible();
      await expect(teamCard.getByText("1")).toBeVisible(); // 1 member in Test Thunder
      await expect(teamCard.getByText("Jersey #")).toBeVisible();
      await expect(teamCard.getByText("7")).toBeVisible();
      await expect(teamCard.getByText("Position")).toBeVisible();
      await expect(teamCard.getByText("Chaser")).toBeVisible();

      // Check team color indicator
      const colorIndicator = teamCard.locator("div[style*='background-color']");
      await expect(colorIndicator).toBeVisible();
      await expect(colorIndicator).toHaveCSS("background-color", "rgb(255, 0, 0)");

      // Check action buttons
      await expect(teamCard.getByRole("link", { name: "View Team" })).toBeVisible();
      await expect(teamCard.getByRole("link", { name: "Manage" })).toBeVisible();
    });

    test("should display only one active team per user", async ({ page }) => {
      // Due to the constraint, a user can only be actively in one team
      // Test user should only see Test Thunder

      // Wait for teams to load
      await page.waitForSelector("text=Test Thunder", { timeout: 5000 });

      // Look specifically for team cards (cards that contain team names)
      const thunderCard = page.locator("div[data-slot='card']", {
        has: page.locator("text=Test Thunder"),
      });
      await expect(thunderCard).toBeVisible();

      // Test Lightning should not be visible (user is not a member)
      await expect(page.getByText("Test Lightning")).not.toBeVisible();

      // Count team cards specifically
      const teamNames = ["Test Thunder", "Test Lightning"];
      let visibleTeamCount = 0;
      for (const teamName of teamNames) {
        const isVisible = await page
          .locator(`text=${teamName}`)
          .isVisible()
          .catch(() => false);
        if (isVisible) visibleTeamCount++;
      }
      expect(visibleTeamCount).toBe(1);
    });
  });

  test.describe("Team Navigation", () => {
    test("should navigate to team detail page", async ({ page }) => {
      const teamCard = page.locator("div[data-slot='card']", {
        has: page.locator("text=Test Thunder"),
      });
      await teamCard.getByRole("link", { name: "View Team" }).click();

      await expect(page).toHaveURL(/\/dashboard\/teams\/test-team-1/);
    });

    test("should navigate to team management page for captains/coaches", async ({
      page,
    }) => {
      const teamCard = page.locator("div[data-slot='card']", {
        has: page.locator("text=Test Thunder"),
      });
      await teamCard.getByRole("link", { name: "Manage" }).click();

      await expect(page).toHaveURL(/\/dashboard\/teams\/test-team-1\/manage/);
    });

    test("should navigate to create team page", async ({ page }) => {
      await page.getByRole("link", { name: "Create Team" }).click();
      await expect(page).toHaveURL("/dashboard/teams/create");

      // Check create team form is displayed
      await expect(
        page.getByRole("heading", { name: "Create a New Team" }),
      ).toBeVisible();
    });

    test("should navigate to browse teams page from empty state", async () => {
      // This would need a user with no teams - skip for now
      // as our test users have teams
      test.skip();
    });
  });

  test.describe("Team Creation", () => {
    test.beforeEach(async ({ page }) => {
      // Simply navigate to the create team page - we already have auth from storageState
      await page.goto("/dashboard/teams/create");

      // Wait for the page to load - look for the text in the form
      await expect(page.getByText("Create a New Team")).toBeVisible({
        timeout: 15000,
      });
    });

    test("should display team creation form with all fields", async ({ page }) => {
      // Check form header
      await expect(page.getByText("Create a New Team")).toBeVisible();
      await expect(
        page.getByText("Set up your team profile and start inviting members"),
      ).toBeVisible();

      // Check form fields
      await expect(page.getByLabel("Team Name")).toBeVisible();
      await expect(page.getByLabel("URL Slug")).toBeVisible();
      await expect(page.getByLabel("Description")).toBeVisible();
      await expect(page.getByLabel("City")).toBeVisible();
      await expect(page.getByLabel("Province")).toBeVisible();
      await expect(page.getByLabel("Primary Color")).toBeVisible();
      await expect(page.getByLabel("Secondary Color")).toBeVisible();
      await expect(page.getByLabel("Founded Year")).toBeVisible();
      await expect(page.getByLabel("Website")).toBeVisible();

      // Check buttons
      await expect(page.getByRole("link", { name: "Cancel" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Create Team" })).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      // Try to submit without filling required fields
      await page.getByRole("button", { name: "Create Team" }).click();

      // Should show validation error with a longer timeout
      await expect(page.getByText("Team name is required")).toBeVisible({
        timeout: 5000,
      });
    });

    test("should validate slug format", async ({ page }) => {
      await page.getByLabel("URL Slug").fill("Invalid Slug!");
      await page.getByLabel("URL Slug").blur();

      // Wait for validation message with a longer timeout
      await expect(
        page.getByText("Slug can only contain lowercase letters, numbers, and hyphens"),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should validate color format", async ({ page }) => {
      await page.getByLabel("Primary Color").fill("not-a-color");
      await page.getByLabel("Primary Color").blur();

      // Wait for validation message with a longer timeout
      await expect(
        page.getByText("Color must be in hex format (e.g., #FF0000)"),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should validate year format", async ({ page }) => {
      await page.getByLabel("Founded Year").fill("2050");
      await page.getByLabel("Founded Year").blur();

      // Wait for validation message with a longer timeout
      await expect(page.getByText("Enter a valid year")).toBeVisible({ timeout: 5000 });
    });

    test("should validate website URL", async ({ page }) => {
      await page.getByLabel("Website").fill("not-a-url");
      await page.getByLabel("Website").blur();

      // Wait for validation message with a longer timeout
      await expect(
        page.getByText("Website must start with http:// or https://"),
      ).toBeVisible({ timeout: 5000 });
    });

    test("should successfully create a team", async () => {
      // Skip this test - it requires a user without active team membership
      // Use the teams-create-no-conflict.auth.spec.ts test instead
      test.skip(
        true,
        "This test requires a user without active team membership. Use teams-create-no-conflict.auth.spec.ts instead.",
      );
    });

    test("should show error message for duplicate slug", async ({ page }) => {
      // Try to create a team with existing slug
      await page.getByLabel("Team Name").fill("Duplicate Team");
      await page.getByLabel("URL Slug").fill("test-thunder"); // Existing slug

      await page.getByRole("button", { name: "Create Team" }).click();

      // Should show error
      await expect(page.getByText("Error creating team")).toBeVisible();
    });

    test("should navigate back to teams list on cancel", async ({ page }) => {
      await page.getByRole("link", { name: "Cancel" }).click();
      await expect(page).toHaveURL("/dashboard/teams");
    });
  });
});
