import { expect, test } from "@playwright/test";
import { clearAuthState } from "../../utils/auth";
import { generateUniqueTeam } from "../../utils/test-data";

// Don't use the default auth state
test.use({ storageState: undefined });

test.describe("Team Creation Without Conflict", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth
    await clearAuthState(page);

    // Login as teamcreator user first
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("teamcreator@example.com");
    await page.getByLabel("Password").fill("testpassword123");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Wait for dashboard
    await page.waitForURL("/dashboard", { timeout: 30_000 });

    // Navigate to team creation
    await page.goto("/dashboard/teams/create");

    // Wait for page to be ready - look for the text in the form
    await expect(page.getByText("Create a New Team")).toBeVisible({
      timeout: 15000,
    });
  });

  test("should successfully create a team without database conflicts", async ({
    page,
  }) => {
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

    // Skip setting colors - use defaults for now to avoid issues

    // Wait a bit for form validation
    await page.waitForTimeout(500);

    // Submit the form
    await page.getByRole("button", { name: "Create Team" }).click();

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
    expect(page.url()).toMatch(/\/dashboard\/teams\/[a-z0-9-]+/);

    // Verify the team was created with the name we provided
    await expect(page.getByRole("heading", { name: uniqueTeam.name })).toBeVisible({
      timeout: 10000,
    });
  });
});
