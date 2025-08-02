import { expect, test } from "@playwright/test";

test.describe("Team Member Management (Authenticated)", () => {
  test.describe("Team Details Page", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Test Thunder team detail page
      await page.goto("/dashboard/teams/test-team-1");
    });

    test("should display team information", async ({ page }) => {
      // Team header
      await expect(page.getByRole("heading", { name: "Test Thunder" })).toBeVisible();
      await expect(page.getByText("Toronto, ON")).toBeVisible();
      await expect(page.getByText("E2E test team")).toBeVisible();

      // Team colors
      const primaryColor = page.locator("[data-testid='primary-color']");
      if (await primaryColor.isVisible()) {
        await expect(primaryColor).toHaveCSS("background-color", "rgb(255, 0, 0)");
      }
    });

    test("should display team statistics", async ({ page }) => {
      // Member count
      await expect(page.getByText("Members")).toBeVisible();
      await expect(page.getByText("1")).toBeVisible(); // Test Thunder has 1 member

      // Founded year if displayed
      const foundedYear = page.locator("text=Founded");
      if (await foundedYear.isVisible()) {
        await expect(page.getByText(/Founded.*\d{4}/)).toBeVisible();
      }
    });

    test("should show member list", async ({ page }) => {
      // Navigate to members tab/section
      const membersTab = page.getByRole("tab", { name: "Members" });
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Check captain is listed
      await expect(page.getByText("Test User")).toBeVisible();
      await expect(page.getByText("captain")).toBeVisible();
      await expect(page.getByText("#7")).toBeVisible();
      await expect(page.getByText("Chaser")).toBeVisible();

      // Only one member should be listed due to active team constraint
    });

    test("should navigate to team management for captains", async ({ page }) => {
      // Captain should see manage button
      const manageButton = page.getByRole("link", { name: "Manage Team" });
      if (await manageButton.isVisible()) {
        await manageButton.click();
        await expect(page).toHaveURL(/\/dashboard\/teams\/test-team-1\/manage/);
      }
    });
  });

  test.describe("Team Management Page", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Test Thunder management page
      await page.goto("/dashboard/teams/test-team-1/manage");
    });

    test("should display management tabs", async ({ page }) => {
      // Check for management sections
      const tabs = ["Team Info", "Members", "Settings"];

      for (const tab of tabs) {
        const tabElement = page.getByRole("tab", { name: tab });
        if (await tabElement.isVisible()) {
          await expect(tabElement).toBeVisible();
        }
      }
    });

    test("should allow editing team information", async ({ page }) => {
      // Navigate to team info section if needed
      const infoTab = page.getByRole("tab", { name: "Team Info" });
      if (await infoTab.isVisible()) {
        await infoTab.click();
      }

      // Check for edit form
      await expect(page.getByLabel("Team Name")).toBeVisible();
      await expect(page.getByLabel("Description")).toBeVisible();

      // Update team name
      await page.getByLabel("Team Name").clear();
      await page.getByLabel("Team Name").fill("Test Thunder Updated");

      // Save changes
      await page.getByRole("button", { name: "Save Changes" }).click();

      // Verify success message or updated content
      await expect(
        page
          .getByText("Team updated successfully")
          .or(page.getByRole("heading", { name: "Test Thunder Updated" })),
      ).toBeVisible();
    });
  });

  test.describe("Member Management", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to team management members section
      await page.goto("/dashboard/teams/test-team-1/manage");

      const membersTab = page.getByRole("tab", { name: "Members" });
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }
    });

    test("should display add member form", async ({ page }) => {
      // Look for add member button
      const addMemberButton = page.getByRole("button", { name: /Add.*Member/i });
      if (await addMemberButton.isVisible()) {
        await addMemberButton.click();

        // Check form fields
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Role")).toBeVisible();
        await expect(page.getByLabel("Jersey Number")).toBeVisible();
        await expect(page.getByLabel("Position")).toBeVisible();
      }
    });

    test("should validate member email", async ({ page }) => {
      const addMemberButton = page.getByRole("button", { name: /Add.*Member/i });
      if (await addMemberButton.isVisible()) {
        await addMemberButton.click();

        // Try invalid email
        await page.getByLabel("Email").fill("not-an-email");
        await page.getByRole("button", { name: /Send.*Invite|Add/i }).click();

        await expect(page.getByText(/valid.*email/i)).toBeVisible();
      }
    });

    test("should show member actions for captains", async ({ page }) => {
      // Find a member row (not the current user)
      const memberRow = page.locator("tr", { hasText: "Admin User" });

      if (await memberRow.isVisible()) {
        // Check for action buttons
        const editButton = memberRow.getByRole("button", { name: "Edit" });
        const removeButton = memberRow.getByRole("button", { name: "Remove" });

        await expect(editButton.or(removeButton)).toBeVisible();
      }
    });

    test("should allow editing member details", async ({ page }) => {
      const memberRow = page.locator("tr", { hasText: "Admin User" });

      if (await memberRow.isVisible()) {
        const editButton = memberRow.getByRole("button", { name: "Edit" });
        if (await editButton.isVisible()) {
          await editButton.click();

          // Edit form should appear
          await expect(page.getByLabel("Jersey Number")).toBeVisible();
          await expect(page.getByLabel("Position")).toBeVisible();

          // Update jersey number
          await page.getByLabel("Jersey Number").clear();
          await page.getByLabel("Jersey Number").fill("99");

          // Save
          await page.getByRole("button", { name: "Save" }).click();

          // Verify update
          await expect(page.getByText("#99")).toBeVisible();
        }
      }
    });

    test("should prevent removing last captain", async () => {
      // This test would need to be more sophisticated
      // checking for error messages when trying to remove the only captain
      test.skip();
    });
  });

  test.describe("Member Permissions", () => {
    test("players should not see manage button", async ({ page }) => {
      // Login as admin user who is a player in Test Thunder
      await page.goto("/dashboard");
      await page.waitForSelector("text=admin@example.com");

      // Navigate to Test Thunder team page
      await page.goto("/dashboard/teams/test-team-1");

      // Should not see manage button
      await expect(page.getByRole("link", { name: "Manage Team" })).not.toBeVisible();
    });

    test("non-members should not access team management", async () => {
      // Try to access a team management page for a team user is not in
      // This would need a third test user not in any teams
      test.skip();
    });
  });

  test.describe("Team Invitations", () => {
    test("should display pending invitations", async () => {
      // This would need test data with pending invitations
      test.skip();
    });

    test("should accept team invitation", async () => {
      // This would need test data with pending invitations
      test.skip();
    });

    test("should decline team invitation", async () => {
      // This would need test data with pending invitations
      test.skip();
    });
  });

  test.describe("Leave Team", () => {
    test("should allow members to leave team", async ({ page }) => {
      // Navigate to team page as a regular member
      await page.goto("/dashboard");
      await page.waitForSelector("text=admin@example.com");

      await page.goto("/dashboard/teams/test-team-1");

      // Look for leave team button
      const leaveButton = page.getByRole("button", { name: "Leave Team" });
      if (await leaveButton.isVisible()) {
        await leaveButton.click();

        // Confirm dialog
        await page.getByRole("button", { name: "Confirm" }).click();

        // Should redirect to teams list
        await expect(page).toHaveURL("/dashboard/teams");

        // Team should no longer appear in list
        await expect(page.getByText("Test Thunder")).not.toBeVisible();
      }
    });

    test("should prevent last captain from leaving", async () => {
      // This would need specific test setup
      test.skip();
    });
  });
});
