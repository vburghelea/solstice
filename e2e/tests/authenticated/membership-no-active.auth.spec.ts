import { expect, test } from "@playwright/test";
import { ANNUAL_MEMBERSHIP_NAME } from "../../helpers/constants";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

// These tests are for users without active memberships
// They use the membership-purchase@example.com account which has no membership

test.describe("Membership Purchase Flow - No Active Membership", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);

    // Use membership-purchase account which has no active membership
    await gotoWithAuth(page, "/dashboard", {
      email: "membership-purchase@example.com",
      password: "testpassword123",
    });
  });

  test("should show purchase flow for users without membership", async ({ page }) => {
    await page.goto("/dashboard/membership");

    // Check no active membership status
    await expect(page.getByText("No Active Membership")).toBeVisible();
    await expect(
      page.getByText("Join today to participate in events and access member benefits"),
    ).toBeVisible();

    // Check purchase button is available
    const purchaseButton = page
      .locator(`:has-text("${ANNUAL_MEMBERSHIP_NAME}")`)
      .first()
      .getByRole("button", { name: "Purchase" });

    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).toBeEnabled();

    // Click purchase
    await purchaseButton.click();

    // Should redirect to mock checkout
    await page.waitForURL((url) => url.toString().includes("mock_checkout=true"), {
      timeout: 10000,
    });

    expect(page.url()).toContain("/dashboard/membership");
    expect(page.url()).toContain("mock_checkout=true");
    expect(page.url()).toContain("session=");
  });

  test("should handle payment confirmation for new membership", async ({ page }) => {
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
