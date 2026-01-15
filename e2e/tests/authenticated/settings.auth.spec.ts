import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

test.describe("Dashboard Settings", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, "/player/settings", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Wait for page to be ready - check for Account Overview or settings content
    await expect(page.getByText(/Account Overview|Email|Password/i).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("renders account overview", async ({ page }) => {
    // Verify we're on settings page
    await expect(page).toHaveURL(/\/player\/settings/);

    // Check there's content on the page
    const content = page.locator("main");
    await expect(content).toBeVisible();

    // Should have some cards or form elements
    const cards = page.locator('[class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows settings sections", async ({ page }) => {
    // Check for settings-related content
    const textContent = await page.locator("main").textContent();
    expect(textContent?.length).toBeGreaterThan(0);

    // Verify there are interactive elements
    const buttons = page.getByRole("button");
    const links = page.getByRole("link");

    const hasInteractiveElements = (await buttons.count()) + (await links.count()) > 0;
    expect(hasInteractiveElements).toBe(true);
  });
});
