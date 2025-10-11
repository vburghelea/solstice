import { expect, test } from "@playwright/test";

test.describe("Game Session Management", () => {
  let campaignId: string;

  test.beforeEach(async ({ page }) => {
    // Create a campaign to associate game sessions with
    await page.goto("/player/campaigns/create");
    await page.getByLabel(/Campaign Name/i).fill("Game Session Test Campaign");
    await page.getByLabel(/Description/i).fill("Campaign for game session E2E tests.");
    await page.getByRole("button", { name: /Create Campaign/i }).click();
    await expect(page.url()).toMatch(/\/player\/campaigns\/[a-f0-9-]{36}$/);
    campaignId = page.url().split("/").pop()!;
  });

  test("should create a new game session within a campaign", async ({ page }) => {
    // Navigate to the campaign details page
    await page.goto(`/player/campaigns/${campaignId}`);
    await expect(
      page.getByRole("heading", { name: "Game Session Test Campaign" }),
    ).toBeVisible();

    // Click 'Create Game Session' button
    await page.getByRole("link", { name: /Create Game Session/i }).click();
    await expect(page.url()).toContain(`/player/games/create?campaignId=${campaignId}`);
    await expect(page.getByRole("heading", { name: "Create a New Game" })).toBeVisible();

    // Fill game session form
    await page.getByLabel(/Game Name/i).fill("Playwright Game Session");
    await page
      .getByLabel(/Description/i)
      .fill("This is a game session created by Playwright.");
    await page.getByLabel(/Date & Time/i).fill("2025-12-25T19:00"); // Example date and time
    await page.getByLabel(/Expected Duration/i).fill("180");

    // Submit form
    await page.getByRole("button", { name: /Create Game/i }).click();

    // Verify redirection to game session details page (or back to campaign details)
    await expect(page.url()).toMatch(/\/player\/games\/[a-f0-9-]{36}$/);
    await expect(page.getByText("Game created successfully")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Playwright Game Session" }),
    ).toBeVisible();
  });

  test("should update game session status to completed", async ({ page }) => {
    // Create a game session first
    await page.goto(`/player/campaigns/${campaignId}`);
    await page.getByRole("link", { name: /Create Game Session/i }).click();
    await page.getByLabel(/Game Name/i).fill("Game to Complete");
    await page.getByLabel(/Description/i).fill("This game will be completed.");
    await page.getByLabel(/Date & Time/i).fill("2025-12-20T10:00");
    await page.getByLabel(/Expected Duration/i).fill("60");
    await page.getByRole("button", { name: /Create Game/i }).click();
    await expect(page.url()).toMatch(/\/player\/games\/[a-f0-9-]{36}$/);

    // Navigate back to campaign details to see the session card
    await page.goto(`/player/campaigns/${campaignId}`);
    await expect(page.getByText("Game to Complete")).toBeVisible();

    // Click 'Mark Completed' button
    await page.getByRole("button", { name: /Mark Completed/i }).click();

    // Verify status change
    await expect(
      page.getByText("Game session status updated successfully!"),
    ).toBeVisible();
    await expect(page.getByText(/Status: completed/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Mark Completed/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel Session/i })).not.toBeVisible();
  });

  test("should update game session status to canceled", async ({ page }) => {
    // Create a game session first
    await page.goto(`/player/campaigns/${campaignId}`);
    await page.getByRole("link", { name: /Create Game Session/i }).click();
    await page.getByLabel(/Game Name/i).fill("Game to Cancel");
    await page.getByLabel(/Description/i).fill("This game will be canceled.");
    await page.getByLabel(/Date & Time/i).fill("2025-12-21T11:00");
    await page.getByLabel(/Expected Duration/i).fill("90");
    await page.getByRole("button", { name: /Create Game/i }).click();
    await expect(page.url()).toMatch(/\/player\/games\/[a-f0-9-]{36}$/);

    // Navigate back to campaign details to see the session card
    await page.goto(`/player/campaigns/${campaignId}`);
    await expect(page.getByText("Game to Cancel")).toBeVisible();

    // Click 'Cancel Session' button
    await page.getByRole("button", { name: /Cancel Session/i }).click();

    // Verify status change
    await expect(
      page.getByText("Game session status updated successfully!"),
    ).toBeVisible();
    await expect(page.getByText(/Status: canceled/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Mark Completed/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel Session/i })).not.toBeVisible();
  });
});
