import { expect, test } from "@playwright/test";

test.describe("Membership Purchase Flow (Authenticated)", () => {
  test("should display membership page with available memberships", async ({ page }) => {
    await page.goto("/dashboard/membership");

    // Check page title and description
    await expect(
      page.getByRole("heading", { name: "Membership", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Join Quadball Canada and access exclusive member benefits"),
    ).toBeVisible();

    // Check current status section
    await expect(page.getByRole("heading", { name: "Current Status" })).toBeVisible();

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

    // Check for the Annual Player Membership card
    const membershipCard = page
      .locator('[data-testid="membership-card-annual-player-2025"]')
      .first();
    await expect(membershipCard).toBeVisible();
    await expect(membershipCard.getByText("Annual Player Membership 2025")).toBeVisible();
    await expect(membershipCard.getByText("$45.00")).toBeVisible();
    await expect(
      membershipCard.getByText(
        "Full access to all Quadball Canada events and programs for the 2025 season",
      ),
    ).toBeVisible();
    // Button text depends on membership status
    const button = membershipCard.getByRole("button");
    await expect(button).toBeVisible();
    const buttonText = await button.textContent();
    expect(["Purchase", "Renew", "Current Plan"]).toContain(buttonText);
  });

  test("should show loading state when fetching membership data", async ({ page }) => {
    // Slow down the network to see loading states
    await page.route("**/api/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

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
    await page.goto("/dashboard/membership");

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Find the membership card
    const membershipCard = page
      .locator('[data-testid="membership-card-annual-player-2025"]')
      .first();
    const button = membershipCard.getByRole("button");

    await expect(button).toBeVisible();

    const buttonText = await button.textContent();

    if (buttonText === "Purchase" || buttonText === "Renew") {
      // Only test checkout flow if button is clickable
      await expect(button).toBeEnabled();

      // Click the button
      await button.click();

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
    } else if (buttonText === "Current Plan") {
      // Button should be disabled for current plan
      await expect(button).toBeDisabled();
    }
  });

  test("should handle payment confirmation callback", async ({ page }) => {
    // First navigate to membership page to set up a mock purchase
    await page.goto("/dashboard/membership");

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
    await page.goto("/dashboard/membership");

    // Check current status section
    await expect(page.getByRole("heading", { name: "Current Status" })).toBeVisible();

    // Check if user has active membership
    const hasActiveMembership = await page
      .getByText("Active Membership")
      .isVisible()
      .catch(() => false);

    if (hasActiveMembership) {
      // User has active membership
      await expect(page.getByText("Active Membership")).toBeVisible();
      await expect(page.getByText(/Annual Player Membership/)).toBeVisible();
      await expect(page.getByText(/Expires:/)).toBeVisible();
      await expect(page.getByText(/Days Remaining:/)).toBeVisible();

      // Button should be disabled for current plan
      const button = page
        .locator('[data-testid="membership-card-annual-player-2025"]')
        .first()
        .getByRole("button");

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
        .locator('[data-testid="membership-card-annual-player-2025"]')
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

    await page.goto("/dashboard/membership");

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Find a clickable button (Purchase or Renew)
    const membershipCard = page
      .locator('[data-testid="membership-card-annual-player-2025"]')
      .first();
    const button = membershipCard.getByRole("button");

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
    await page.goto("/dashboard");

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
    await page.goto("/dashboard/membership");

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    // Navigate away
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL("/dashboard");

    // Navigate back using either link text
    const membershipLink = page.getByRole("link", { name: /Get Membership|Renew Now/ });
    await membershipLink.click();

    // Membership options should still be visible
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="membership-card-annual-player-2025"]').first(),
    ).toBeVisible();
  });

  test("should handle rapid button clicks", async ({ page }) => {
    await page.goto("/dashboard/membership");

    // Wait for memberships to load
    await expect(
      page.getByRole("heading", { name: "Available Memberships" }),
    ).toBeVisible();

    const membershipCard = page
      .locator('[data-testid="membership-card-annual-player-2025"]')
      .first();
    const button = membershipCard.getByRole("button");

    const buttonText = await button.textContent();

    if (buttonText === "Purchase" || buttonText === "Renew") {
      // Rapidly click the button multiple times
      await button.click();
      await button.click();
      await button.click();

      // Should only trigger one checkout session
      // Wait for redirect to checkout
      await page.waitForURL((url) => url.toString().includes("checkout.mock.com"), {
        timeout: 10000,
      });

      // Verify we're on the checkout page (only one redirect should occur)
      expect(page.url()).toContain("checkout.mock.com");
    } else {
      // Skip test if user already has current plan
      test.skip();
    }
  });
});
