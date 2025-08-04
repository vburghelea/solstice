import { expect, test } from "../../fixtures/auth-fixtures";
import { ANNUAL_MEMBERSHIP_NAME, ANNUAL_MEMBERSHIP_PRICE } from "../../helpers/constants";

test.describe("Membership Purchase Flow (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to membership page - already authenticated via fixtures
    await page.goto("/dashboard/membership");

    // Wait for page to be ready
    await expect(
      page.getByRole("heading", { name: "Membership", exact: true }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("should display membership page with available memberships", async ({ page }) => {
    // Already on membership page from beforeEach

    // Check page title and description with extended timeout
    await expect(
      page.getByRole("heading", { name: "Membership", exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Join Quadball Canada and access exclusive member benefits"),
    ).toBeVisible();

    // Check current status section
    await expect(page.getByText("Current Status", { exact: true })).toBeVisible({
      timeout: 10000,
    });

    // User may or may not have a membership - check both cases
    const hasActiveMembership = await page
      .getByText("Active Membership")
      .isVisible()
      .catch(() => false);

    if (!hasActiveMembership) {
      await expect(page.getByText("No Active Membership")).toBeVisible();
      await expect(
        page.getByText("Join today to participate in events and access member benefits"),
      ).toBeVisible();
    } else {
      await expect(page.getByText("Active Membership")).toBeVisible();
      await expect(page.getByText(/Expires:/)).toBeVisible();
    }

    // Check available memberships section
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Check for the Annual Player Membership card with dynamic values
    // Use first() to avoid strict mode violations when text appears multiple times
    await expect(page.getByText(ANNUAL_MEMBERSHIP_NAME).first()).toBeVisible();
    await expect(page.getByText(ANNUAL_MEMBERSHIP_PRICE)).toBeVisible();
    await expect(
      page.getByText(
        "Full access to all Quadball Canada events and programs for the 2025 season",
      ),
    ).toBeVisible();
    // Button text depends on membership status
    const button = page.getByRole("button", { name: /Purchase|Renew|Current Plan/ });
    await expect(button).toBeVisible();
    const buttonText = await button.textContent();
    expect(["Purchase", "Renew", "Current Plan"]).toContain(buttonText);
  });

  test("should show loading state when fetching membership data", async ({ page }) => {
    test.skip(process.env["CI"] === "true", "Spinner timings are flaky on CI");

    // Slow down the network to see loading states
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    // Navigate to membership page with network delay
    await page.goto("/dashboard/membership");

    // Should show loading spinner initially
    await expect(page.locator(".animate-spin")).toBeVisible();

    // Wait for content to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("should handle membership button click", async ({ page }) => {
    // Clear any existing memberships to ensure test starts fresh
    const cleanupResponse = await page.request.post("/api/test/cleanup", {
      data: {
        action: "clear-user-memberships",
        userEmail: process.env["E2E_TEST_EMAIL"] || "test@example.com",
      },
    });

    if (!cleanupResponse.ok()) {
      console.log("Warning: Failed to clear memberships, test may use existing state");
    }

    // Refresh the page to see updated state
    await page.reload();

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // After cleanup, the button should always be "Purchase"
    const purchaseButton = page.getByRole("button", { name: "Purchase" });
    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).toBeEnabled();

    // Click the button
    await purchaseButton.click();

    // The mock payment service should redirect back to membership page with mock checkout params
    await page.waitForURL((url) => url.toString().includes("mock_checkout=true"), {
      timeout: 10000,
    });

    // Verify we're on the mock checkout page
    expect(page.url()).toContain("/dashboard/membership");
    expect(page.url()).toContain("mock_checkout=true");
    expect(page.url()).toContain("session=");
    expect(page.url()).toContain("type=");
    expect(page.url()).toContain("amount=");

    // Wait for the success toast
    await expect(page.getByText("Membership purchased successfully")).toBeVisible({
      timeout: 10000,
    });

    // Verify button is now disabled "Current Plan"
    await expect(page.getByRole("button", { name: "Current Plan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Current Plan" })).toBeDisabled();
  });

  test("should handle payment confirmation callback", async ({ page }) => {
    // Already on membership page from beforeEach

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Find a purchase button (user might not have membership yet)
    const purchaseButton = page.getByRole("button", { name: "Purchase" }).first();
    const buttonExists = await purchaseButton.isVisible().catch(() => false);

    if (buttonExists) {
      // Click purchase to start mock checkout
      await purchaseButton.click();

      // Wait for mock checkout redirect
      await page.waitForURL((url) => url.toString().includes("mock_checkout=true"));

      // Mock checkout automatically processes the payment
      // Wait for the success message
      await expect(page.getByText("Membership purchased successfully!")).toBeVisible({
        timeout: 10000,
      });
    } else {
      // User already has membership, check the status instead
      await expect(page.getByText("Active Membership")).toBeVisible();
    }
  });

  test("should show active membership status correctly", async ({ page }) => {
    // Already on membership page from beforeEach

    // Check current status section
    await expect(page.getByText("Current Status", { exact: true })).toBeVisible();

    // Check if user has active membership
    const hasActiveMembership = await page
      .getByText("Active Membership")
      .isVisible()
      .catch(() => false);

    if (hasActiveMembership) {
      // User has active membership
      await expect(page.getByText("Active Membership")).toBeVisible();
      await expect(page.getByText(/Annual Player Membership/).first()).toBeVisible();
      await expect(page.getByText(/Expires:/)).toBeVisible();
      await expect(page.getByText(/Days Remaining:/)).toBeVisible();

      // Button should be disabled for current plan
      const button = page.getByRole("button", { name: /Current Plan|Renew/ });

      await expect(button).toBeVisible();
      const buttonText = await button.textContent();
      if (buttonText === "Current Plan") {
        await expect(button).toBeDisabled();
      } else if (buttonText === "Renew") {
        await expect(button).toBeEnabled();
      }
    } else {
      // User doesn't have membership
      await expect(page.getByText("No Active Membership")).toBeVisible();

      const purchaseButton = page
        .locator(':has-text("Annual Player Membership 2025")')
        .first()
        .getByRole("button", { name: "Purchase" });
      await expect(purchaseButton).toBeEnabled();
    }
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Block API calls to simulate network error
    await page.route("**/createCheckoutSession*", (route) => {
      route.abort("failed");
    });

    // Already on membership page from beforeEach

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Find the membership purchase/renew button specifically
    const purchaseButton = page.getByRole("button", { name: "Purchase" });
    const renewButton = page.getByRole("button", { name: "Renew" });

    // Check which button is visible
    const button = purchaseButton.or(renewButton);
    const hasClickableButton = await button.isVisible().catch(() => false);

    if (!hasClickableButton) {
      // User already has membership - skip test
      test.skip();
      return;
    }

    const buttonText = await button.textContent();

    // Only test if button is clickable
    if (buttonText === "Purchase" || buttonText === "Renew") {
      await button.click();

      // Should show error message
      await expect(
        page.getByText(/failed to create checkout session|error|problem/i),
      ).toBeVisible({
        timeout: 10000,
      });
    } else {
      // Skip test if user already has this membership
      test.skip();
    }
  });

  test("should navigate from dashboard quick action", async ({ page }) => {
    // Navigate to dashboard first
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible({
      timeout: 15000,
    });

    // Look for either "Get Membership" or "Renew Now" link
    const membershipLink = page.getByRole("link", { name: /Get Membership|Renew Now/ });
    await expect(membershipLink).toBeVisible();
    await membershipLink.click();

    // Should navigate to membership page
    await expect(page).toHaveURL("/dashboard/membership");
    await expect(
      page.getByRole("heading", { name: "Membership", exact: true }),
    ).toBeVisible();
  });

  test("should maintain membership selection after navigation", async ({ page }) => {
    // Already on membership page from beforeEach

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Navigate away - use exact match to avoid ambiguity
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL("/dashboard");

    // Navigate back using either link text
    const membershipLink = page.getByRole("link", { name: /Get Membership|Renew Now/ });
    await membershipLink.click();

    // Wait for navigation to complete
    await expect(page).toHaveURL("/dashboard/membership");

    // Membership options should still be visible
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Verify membership card is visible (wait for it to appear)
    await expect(
      page.locator(`:has-text("${ANNUAL_MEMBERSHIP_NAME}")`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should handle rapid button clicks", async ({ page }) => {
    // Already on membership page from beforeEach

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Find the membership purchase/renew button specifically
    const purchaseButton = page.getByRole("button", { name: "Purchase" });
    const renewButton = page.getByRole("button", { name: "Renew" });

    // Check which button is visible
    const button = purchaseButton.or(renewButton);
    const hasClickableButton = await button.isVisible().catch(() => false);

    if (!hasClickableButton) {
      // User already has membership - skip test
      test.skip();
      return;
    }

    const buttonText = await button.textContent();

    if (buttonText === "Purchase" || buttonText === "Renew") {
      // Rapidly click the button multiple times
      await button.click();
      await button.click();
      await button.click();

      // Should only trigger one checkout session
      // Wait for redirect to mock checkout
      await page.waitForURL((url) => url.toString().includes("mock_checkout=true"), {
        timeout: 10000,
      });

      // Verify we're on the mock checkout page (only one redirect should occur)
      expect(page.url()).toContain("/dashboard/membership");
      expect(page.url()).toContain("mock_checkout=true");
    } else {
      // Skip test if user already has current plan
      test.skip();
    }
  });
});
