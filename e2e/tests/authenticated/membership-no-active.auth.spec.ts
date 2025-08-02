import { expect, test } from "@playwright/test";

// These tests are for users without active memberships
// They require a clean test user or manual membership deletion

test.describe("Membership Purchase Flow - No Active Membership", () => {
  test.skip("should show purchase flow for users without membership", async ({
    page,
  }) => {
    // This test is skipped by default because it requires a user without an active membership
    // To run this test, ensure the test user doesn't have an active membership

    await page.goto("/dashboard/membership");

    // Check no active membership status
    await expect(page.getByText("No Active Membership")).toBeVisible();
    await expect(
      page.getByText("Join today to participate in events and access member benefits"),
    ).toBeVisible();

    // Check purchase button is available
    const purchaseButton = page
      .locator('[data-testid="membership-card-annual-player-2025"]')
      .first()
      .getByRole("button", { name: "Purchase" });

    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).toBeEnabled();

    // Click purchase
    await purchaseButton.click();

    // Should redirect to checkout
    await page.waitForURL((url) => url.toString().includes("checkout.mock.com"), {
      timeout: 10000,
    });

    expect(page.url()).toContain("checkout.mock.com");
    expect(page.url()).toContain("session_id=");
  });

  test.skip("should handle payment confirmation for new membership", async ({ page }) => {
    // Simulate returning from payment provider with success
    const mockSessionId = "test-session-123";
    await page.goto(
      `/api/payments/square/callback?transactionId=${mockSessionId}&status=COMPLETED`,
    );

    // Should redirect to membership page with success message
    await page.waitForURL("/dashboard/membership", { timeout: 10000 });

    // Check for success toast notification
    await expect(page.getByText("Membership purchase confirmed!")).toBeVisible();

    // Should now show active membership
    await expect(page.getByText("Active Membership")).toBeVisible();
  });
});
