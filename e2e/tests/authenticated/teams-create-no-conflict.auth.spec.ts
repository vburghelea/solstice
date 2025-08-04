import { expect, test } from "../../fixtures/auth-fixtures";
import { generateUniqueTeam } from "../../utils/test-data";

test.describe("Team Creation Without Conflict", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to team creation page - already authenticated via fixtures
    await page.goto("/dashboard/teams/create");

    // Wait for page to be ready
    await expect(page.getByRole("heading", { name: "Create New Team" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("should successfully create a team without database conflicts", async ({
    page,
  }) => {
    // Generate unique team data to avoid conflicts
    const uniqueTeam = generateUniqueTeam("e2e-no-conflict");

    // Fill in the form with unique data
    await page.getByLabel("Team Name").fill(uniqueTeam.name);
    await page.getByLabel("URL Slug").fill(uniqueTeam.slug);
    await page.getByLabel("Description").fill(uniqueTeam.description);
    await page.getByLabel("City").fill("Vancouver");

    // Select province from combobox
    await page.getByLabel("Province").click();
    await page.getByRole("option", { name: "British Columbia" }).click();

    await page.getByLabel("Founded Year").fill("2024");
    await page.getByLabel("Website").fill("https://no-conflict.example.com");

    // Set colors - color inputs need special handling
    await page.evaluate(() => {
      const primaryColor = document.querySelector(
        'input[name="primaryColor"]',
      ) as HTMLInputElement;
      const secondaryColor = document.querySelector(
        'input[name="secondaryColor"]',
      ) as HTMLInputElement;
      if (primaryColor) primaryColor.value = "#FF5733";
      if (secondaryColor) secondaryColor.value = "#33FF57";
    });

    // Submit the form
    await page.getByRole("button", { name: "Create Team" }).click();

    // Should redirect to team detail page without database errors
    await expect(page).toHaveURL(/\/dashboard\/teams\/[a-z0-9]+/, { timeout: 10000 });

    // Verify the team was created with unique name
    await expect(page.getByText(uniqueTeam.name)).toBeVisible();

    // Verify no database error message
    await expect(page.getByText("Failed query")).not.toBeVisible();
  });
});
