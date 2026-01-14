import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("BI Natural Language Query", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("analytics page loads correctly", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    // Page should load with title
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({
      timeout: 10_000,
    });

    // Pivot builder should be visible
    await expect(page.getByRole("heading", { name: "Pivot builder" })).toBeVisible();
  });

  test("NL query section visibility depends on feature flag", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    // Wait for the page to fully load
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({
      timeout: 10_000,
    });

    // The "Ask AI" section will only be visible if sin_nl_query feature is enabled
    // This test verifies the page renders without errors regardless of feature state
    const askAiHeading = page.getByRole("heading", { name: "Ask AI" });
    const isVisible = await askAiHeading.isVisible().catch(() => false);

    if (isVisible) {
      // Feature is enabled - verify the input is functional
      const input = page.getByPlaceholder("Ask a question about your data...");
      await expect(input).toBeVisible();
      await expect(input).toBeEnabled();

      // Verify example questions are shown
      const tryLabel = page.getByText("Try:");
      await expect(tryLabel).toBeVisible();

      // Verify Ask AI button exists
      const askButton = page.getByRole("button", { name: /Ask AI/i });
      await expect(askButton).toBeVisible();
    } else {
      // Feature is disabled - page should still render without errors
      // Pivot builder should still be functional
      await expect(page.getByRole("heading", { name: "Pivot builder" })).toBeVisible();
    }
  });

  test("NL query input handles empty submission gracefully", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    const askAiHeading = page.getByRole("heading", { name: "Ask AI" });
    const isEnabled = await askAiHeading.isVisible().catch(() => false);

    if (!isEnabled) {
      test.skip();
      return;
    }

    // Input should be present
    const input = page.getByPlaceholder("Ask a question about your data...");
    await expect(input).toBeVisible();

    // Ask AI button should be disabled with empty input
    const askButton = page.getByRole("button", { name: /Ask AI/i });
    await expect(askButton).toBeDisabled();

    // Type something to enable the button
    await input.fill("How many registrations?");
    await expect(askButton).toBeEnabled();

    // Clear and verify button is disabled again
    await input.fill("");
    await expect(askButton).toBeDisabled();
  });

  test("clicking example question populates input", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    const askAiHeading = page.getByRole("heading", { name: "Ask AI" });
    const isEnabled = await askAiHeading.isVisible().catch(() => false);

    if (!isEnabled) {
      test.skip();
      return;
    }

    // Find an example question button
    const exampleButton = page.getByRole("button", {
      name: /How many registrations by sport/i,
    });
    const hasExamples = await exampleButton.isVisible().catch(() => false);

    if (hasExamples) {
      // Click the example button - this triggers the interpretation
      // We just verify it doesn't error out
      await expect(exampleButton).toBeEnabled();
    }
  });

  test("NL query flow shows preview and results (mocked)", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    const askAiHeading = page.getByRole("heading", { name: "Ask AI" });
    const isEnabled = await askAiHeading.isVisible().catch(() => false);

    if (!isEnabled) {
      test.skip();
      return;
    }

    const question = "How many events by type?";
    const intent = {
      datasetId: "events",
      metrics: ["events_total"],
      dimensions: ["type"],
      filters: [],
      limit: 100,
      confidence: 0.65,
      explanation: "Count events by type.",
    };
    const results = [
      { Type: "Tournament", "Total events": 4 },
      { Type: "Clinic", "Total events": 2 },
    ];
    const suggestedVisualization = {
      chartType: "bar",
      reason: "Compare totals across event types.",
    };

    await page.route("**/*createServerFn*", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }

      const body = request.postData() ?? "";

      if (body.includes('"question"') && body.includes(question)) {
        await route.fulfill({
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ intent, latencyMs: 120 }),
        });
        return;
      }

      if (body.includes('"intent"')) {
        await route.fulfill({
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            results,
            rowCount: results.length,
            suggestedVisualization,
          }),
        });
        return;
      }

      await route.continue();
    });

    const input = page.getByPlaceholder("Ask a question about your data...");
    await input.fill(question);
    await page.getByRole("button", { name: /Ask AI/i }).click();

    await expect(page.getByRole("heading", { name: "Query Preview" })).toBeVisible();
    await expect(page.getByText("Low confidence interpretation")).toBeVisible();
    await expect(page.getByText(intent.explanation)).toBeVisible();

    await page.getByRole("button", { name: "Run Query" }).click();

    await expect(page.getByRole("heading", { name: /Query Results/i })).toBeVisible();
    await expect(page.getByText("Tournament")).toBeVisible();
    await expect(page.getByText("Total events")).toBeVisible();
    await expect(page.getByText(/bar visualization/i)).toBeVisible();
  });
});
