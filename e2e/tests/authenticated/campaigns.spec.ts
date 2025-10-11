import { expect, test } from "@playwright/test";

test.describe("Campaign Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/player/campaigns");
  });

  test("should navigate to campaigns list page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Campaigns" })).toBeVisible();
  });

  test("should create a new campaign", async ({ page }) => {
    await page.getByRole("link", { name: /Create New Campaign/i }).click();
    await expect(
      page.getByRole("heading", { name: "Create a New Campaign" }),
    ).toBeVisible();

    await page.getByLabel(/Campaign Name/i).fill("Playwright Test Campaign");
    await page
      .getByLabel(/Description/i)
      .fill("This is a test campaign created by Playwright.");
    // Assuming default values for other fields are acceptable or set by the form

    await page.getByRole("button", { name: /Create Campaign/i }).click();

    // Verify redirection to campaign details page
    await expect(page.url()).toMatch(/\/player\/campaigns\/[a-f0-9-]{36}$/);
    await expect(
      page.getByRole("heading", { name: "Playwright Test Campaign" }),
    ).toBeVisible();
    await expect(page.getByText("Campaign updated successfully")).toBeVisible();
  });

  test("should view campaign details", async ({ page }) => {
    // First, create a campaign to ensure one exists for viewing
    await page.getByRole("link", { name: /Create New Campaign/i }).click();
    await page.getByLabel(/Campaign Name/i).fill("Campaign for Viewing");
    await page.getByLabel(/Description/i).fill("Details to be viewed.");
    await page.getByRole("button", { name: /Create Campaign/i }).click();
    await expect(page.url()).toMatch(/\/player\/campaigns\/[a-f0-9-]{36}$/);

    // Navigate back to campaigns list and click on the created campaign
    await page.goto("/player/campaigns");
    await page.getByRole("link", { name: "Campaign for Viewing" }).click();

    // Verify details are displayed
    await expect(
      page.getByRole("heading", { name: "Campaign for Viewing" }),
    ).toBeVisible();
    await expect(page.getByText("Details to be viewed.")).toBeVisible();
    await expect(page.getByText(/Recurrence: weekly/i)).toBeVisible();
  });

  test("should update an existing campaign", async ({ page }) => {
    // Create a campaign to update
    await page.getByRole("link", { name: /Create New Campaign/i }).click();
    await page.getByLabel(/Campaign Name/i).fill("Campaign to Update");
    await page.getByRole("button", { name: /Create Campaign/i }).click();
    await expect(page.url()).toMatch(/\/player\/campaigns\/[a-f0-9-]{36}$/);

    // Click edit button
    await page.getByRole("button", { name: /Edit Campaign/i }).click();
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Modify campaign name and save
    await page.getByLabel(/Campaign Name/i).fill("Updated Campaign Name");
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Verify update and redirection
    await expect(page.getByText("Campaign updated successfully")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Updated Campaign Name" }),
    ).toBeVisible();
  });

  // Add test for deleting a campaign if the functionality exists and is exposed in UI
  // test("should delete a campaign", async ({ page }) => {
  //   // Create a campaign to delete
  //   await page.getByRole("link", { name: /Create New Campaign/i }).click();
  //   await page.getByLabel(/Campaign Name/i).fill("Campaign to Delete");
  //   await page.getByRole("button", { name: /Create Campaign/i }).click();
  //   await expect(page.url()).toMatch(/\/player\/campaigns\/[a-f0-9-]{36}$/);

  //   // Navigate back to campaigns list
  //   await page.goto("/player/campaigns");
  //   await expect(page.getByText("Campaign to Delete")).toBeVisible();

  //   // Implement deletion steps (e.g., click delete button, confirm dialog)
  //   // This part depends on your UI implementation for deletion
  //   // For example:
  //   // await page.locator("text=Campaign to Delete").locator("~ button[aria-label='Delete']").click();
  //   // await page.getByRole("button", { name: "Confirm Delete" }).click();

  //   // Verify campaign is no longer in the list
  //   // await expect(page.getByText("Campaign to Delete")).not.toBeVisible();
  //   // await expect(page.getByText("Campaign deleted successfully")).toBeVisible();
  // });
});
