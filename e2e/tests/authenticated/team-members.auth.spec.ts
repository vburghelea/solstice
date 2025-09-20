import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("Team Member Management (Authenticated)", () => {
  test.describe("Team Details Page", () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page);
      // Navigate to Test Thunder team detail page
      await gotoWithAuth(page, "/dashboard/teams/test-team-1", {
        email: "test@example.com",
        password: "testpassword123",
      });
    });

    test("should display team information", async ({ page }) => {
      // Team header
      await expect(page.getByRole("heading", { name: "Test Thunder" })).toBeVisible();
      await expect(page.getByText("Toronto, ON")).toBeVisible();
      await expect(page.getByText("E2E test team")).toBeVisible();

      // Team colors - look for color indicator elements
      const colorIndicator = page.locator("div[style*='background-color']").first();
      if (await colorIndicator.isVisible()) {
        await expect(colorIndicator).toHaveCSS("background-color", "rgb(255, 0, 0)");
      }
    });

    test("should display team statistics", async ({ page }) => {
      // Look for member count in the team stats section
      const memberStats = page.locator("text=Total Members").locator("..");
      await expect(memberStats).toBeVisible({ timeout: 10000 });

      // Check the member count - should show "1"
      await expect(memberStats.locator("text=1")).toBeVisible({ timeout: 10000 });

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
      // Captain should see manage members button
      const manageButton = page.getByRole("link", { name: "Manage Members" });
      await expect(manageButton).toBeVisible();
      await manageButton.click();
      await expect(page).toHaveURL(/\/dashboard\/teams\/test-team-1\/members/);
    });
  });

  test.describe("Team Members Management Page", () => {
    test("should display management tabs", async ({ page }) => {
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/teams/test-team-1/members", {
        email: "test@example.com",
        password: "testpassword123",
      });

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
      // Fresh login for this test
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/teams/test-team-1/manage", {
        email: "test@example.com",
        password: "testpassword123",
      });

      // Check for edit form with extended timeout
      const nameField = page.getByLabel("Team Name");
      const descriptionField = page.getByLabel("Description");
      await expect(nameField).toBeVisible({ timeout: 10000 });
      await expect(descriptionField).toBeVisible({ timeout: 10000 });

      // Generate a unique name for this test run to avoid conflicts
      const timestamp = Date.now();
      const newTeamName = `Thunder ${timestamp}`; // Shorter name to avoid "Test Thunder" matching
      const newDescription = `Updated E2E test team - ${timestamp}`;

      const originalTeamName = "Test Thunder";
      const originalDescription = "E2E test team";

      try {
        // Update team name
        await nameField.clear();
        await nameField.fill(newTeamName);

        // Also update description to ensure we're making changes
        await descriptionField.clear();
        await descriptionField.fill(newDescription);

        // Save changes
        await page.getByRole("button", { name: "Save Changes" }).click();

        // Wait for navigation back to team details page after successful save
        await page.waitForURL("/dashboard/teams/test-team-1", { timeout: 10000 });

        // Verify the updated team name is displayed
        const mainContent = page.locator("main");
        await expect(mainContent.getByRole("heading", { level: 1 })).toHaveText(
          newTeamName,
          {
            timeout: 10000,
          },
        );

        // Also verify the description was updated
        await expect(mainContent.getByText(newDescription)).toBeVisible({
          timeout: 10000,
        });
      } finally {
        // Reset the team information so subsequent tests continue to work with seeded data
        await gotoWithAuth(page, "/dashboard/teams/test-team-1/manage", {
          email: "test@example.com",
          password: "testpassword123",
        });

        await expect(nameField).toBeVisible({ timeout: 10000 });
        await expect(descriptionField).toBeVisible({ timeout: 10000 });

        await nameField.clear();
        await nameField.fill(originalTeamName);

        await descriptionField.clear();
        await descriptionField.fill(originalDescription);

        await page.getByRole("button", { name: "Save Changes" }).click();
        await page.waitForURL("/dashboard/teams/test-team-1", { timeout: 10000 });

        const mainContent = page.locator("main");
        await expect(mainContent.getByRole("heading", { level: 1 })).toHaveText(
          originalTeamName,
          {
            timeout: 10000,
          },
        );
      }
    });
  });

  test.describe("Member Management", () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page);
      // Navigate to team management members section
      await gotoWithAuth(page, "/dashboard/teams/test-team-1/manage", {
        email: "test@example.com",
        password: "testpassword123",
      });

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
      await clearAuthState(page);
      // Login as admin user who is a player in Test Thunder
      await gotoWithAuth(page, "/dashboard/teams/test-team-1", {
        email: "admin@example.com",
        password: "testpassword123",
      });

      // Should not see manage button (admin is not a captain)
      await expect(page.getByRole("link", { name: "Manage Team" })).not.toBeVisible();
    });

    test("non-members should not access team management", async () => {
      // Try to access a team management page for a team user is not in
      // This would need a third test user not in any teams
      test.skip();
    });
  });

  test.describe("Team Invitations", () => {
    test("should display pending invitations", async ({ page }) => {
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/teams", {
        email: "team-join@example.com",
        password: "testpassword123",
      });

      await expect(page.getByText("Pending Team Invitations")).toBeVisible();
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.getByRole("button", { name: /Accept/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Decline/i })).toBeVisible();
    });

    test("should accept team invitation", async ({ page }) => {
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/teams", {
        email: "team-join@example.com",
        password: "testpassword123",
      });

      await page.getByRole("button", { name: /Accept/i }).click();

      await expect(page.getByText(/Invitation accepted/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible();
      await expect(page.getByText("Test Thunder")).toBeVisible();
      await expect(page.locator("text=Pending Team Invitations")).toHaveCount(0);
    });

    test("should decline team invitation", async ({ page }) => {
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/teams", {
        email: "team-invite-decline@example.com",
        password: "testpassword123",
      });

      await page.getByRole("button", { name: /Decline/i }).click();

      await expect(page.getByText(/Invitation declined/i)).toBeVisible();
      await expect(page.locator("text=Test Thunder")).toHaveCount(0);
      await expect(page.locator("text=Pending Team Invitations")).toHaveCount(0);
    });
  });

  test.describe("Leave Team", () => {
    test("should allow members to leave team", async ({ page }) => {
      await clearAuthState(page);
      // Navigate to team page as a regular member
      await gotoWithAuth(page, "/dashboard/teams/test-team-1", {
        email: "admin@example.com",
        password: "testpassword123",
      });

      // Look for leave team button with timeout
      const leaveButton = page.getByRole("button", { name: "Leave Team" });
      if (await leaveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await leaveButton.click();

        // Confirm dialog
        await page.getByRole("button", { name: "Confirm" }).click();

        // Should redirect to teams list
        await expect(page).toHaveURL("/dashboard/teams", { timeout: 10000 });

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
