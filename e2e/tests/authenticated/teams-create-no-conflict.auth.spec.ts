import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";
import { generateUniqueTeam } from "../../utils/test-data";

// Don't use the default auth state
test.use({ storageState: undefined });

test.describe("Team Creation Without Conflict", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth and ensure the team creator user has a clean slate
    await clearAuthState(page);

    await gotoWithAuth(page, "/dashboard/teams", {
      email: "teamcreator@example.com",
      password: "testpassword123",
    });

    await expect(page.getByRole("heading", { name: "My Teams" })).toBeVisible({
      timeout: 15000,
    });

    const manageLink = page.getByRole("link", { name: "Manage" });

    // Deactivate any previously created teams to avoid membership conflicts
    for (let attempts = 0; attempts < 5; attempts++) {
      const manageCount = await manageLink.count();
      if (manageCount === 0) break;

      await manageLink.first().click();

      const deactivateButton = page.getByRole("button", { name: "Deactivate Team" });
      if (await deactivateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deactivateButton.click();
        const confirmButton = page
          .getByRole("button", { name: "Deactivate Team" })
          .last();
        await confirmButton.click();
        await expect(page).toHaveURL("/dashboard/teams", { timeout: 15000 });
      } else {
        // If we cannot deactivate, navigate back and exit to avoid a potential loop
        await page.goto("/dashboard/teams");
        break;
      }
    }

    // Navigate to the create team page for the test
    await page.getByRole("link", { name: "Create Team" }).first().click();

    await expect(page.getByText("Create a New Team")).toBeVisible({ timeout: 15000 });
  });

  test("should successfully create a team without database conflicts", async ({
    page,
  }) => {
    // Track the newly created team so we can clean it up after the assertion
    let createdTeamId: string | null = null;

    try {
      // Generate unique team data to avoid conflicts
      const uniqueTeam = generateUniqueTeam("e2e-no-conflict");

      // Fill in the form with unique data
      const nameField = page.getByLabel("Team Name");
      await nameField.click();
      await nameField.fill(uniqueTeam.name);

      const slugField = page.getByLabel("URL Slug");
      await slugField.click();
      await slugField.fill(uniqueTeam.slug);

      const descField = page.getByLabel("Description");
      await descField.click();
      await descField.fill(uniqueTeam.description);

      const cityField = page.getByLabel("City");
      await cityField.click();
      await cityField.fill("Vancouver");

      // Select province from combobox
      await page.getByLabel("Province").click();
      await page.getByRole("option", { name: "British Columbia" }).click();

      const yearField = page.getByLabel("Founded Year");
      await yearField.click();
      await yearField.fill("2024");

      const websiteField = page.getByLabel("Website");
      await websiteField.click();
      await websiteField.fill("https://no-conflict.example.com");

      // Wait a bit for form validation
      await page.waitForTimeout(500);

      // Submit the form
      const submitButton = page.getByRole("button", { name: "Create Team" });

      // Check if button is enabled before clicking
      await expect(submitButton).toBeEnabled();

      await submitButton.click();

      // Wait for either success redirect or error message
      await Promise.race([
        page.waitForURL(/\/dashboard\/teams\/[a-z0-9-]+/, { timeout: 10000 }),
        page.waitForSelector("text=Error creating team", { timeout: 10000 }),
      ]);

      // Check if we got an error
      const hasError = await page.getByText("Error creating team").isVisible();

      if (hasError) {
        // If there's an error, it means the user already has a team
        // This test should be run with fresh seed data
        throw new Error(
          "Team creation failed - user may already have a team. Run 'pnpm test:e2e:setup' to reset data.",
        );
      }

      // Verify we're on the team detail page
      const detailUrl = page.url();
      expect(detailUrl).toMatch(/\/dashboard\/teams\/[a-z0-9-]+/);

      const match = detailUrl.match(/\/dashboard\/teams\/([^/]+)/);
      createdTeamId = match ? match[1] : null;

      // Verify the team was created with the name we provided
      await expect(page.getByRole("heading", { name: uniqueTeam.name })).toBeVisible({
        timeout: 10000,
      });
    } finally {
      if (createdTeamId) {
        try {
          await gotoWithAuth(page, `/dashboard/teams/${createdTeamId}/manage`, {
            email: "teamcreator@example.com",
            password: "testpassword123",
          });

          const deactivateButton = page.getByRole("button", { name: "Deactivate Team" });
          if (await deactivateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await deactivateButton.click();
            const confirmButton = page
              .getByRole("button", { name: "Deactivate Team" })
              .last();
            await confirmButton.click();
            await expect(page).toHaveURL("/dashboard/teams", { timeout: 15000 });
          }
        } catch (cleanupError) {
          console.warn(
            `Failed to deactivate test team ${createdTeamId}:`,
            cleanupError instanceof Error ? cleanupError.message : cleanupError,
          );
        }
      }
    }
  });
});
