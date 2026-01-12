#!/usr/bin/env tsx
/**
 * RP-AGG-005: Analytics pivot builder + export flow.
 * Shows pivot building, chart view, and CSV export with step-up auth.
 */

import path from "node:path";

import {
  completeStepUpIfNeeded,
  config,
  createScreenshotHelper,
  dragTo,
  finalizeVideo,
  getTimestamp,
  login,
  safeGoto,
  selectOrg,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "RP-AGG-005";
const stamp = getTimestamp();
const videoName = `${reqId}-analytics-export-flow-${stamp}.mp4`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const { browser, context, page, videoDir, screenshotDir } = await setupEvidenceCapture(
    reqId,
    { recordLogin: true },
  );
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  // Login (recorded in video)
  console.log("Starting login...");
  await login(page);
  await waitForIdle(page);

  // Handle org selection if needed - check multiple patterns
  if (page.url().includes("/select-org") || page.url().includes("Select")) {
    console.log("Selecting organization...");
    const orgCombo = page
      .getByRole("combobox")
      .filter({ hasText: /Select organization/i });
    if (await orgCombo.isVisible().catch(() => false)) {
      await orgCombo.click();
      await wait(500);
      const viaSportOption = page.getByRole("option", { name: /viaSport BC/i });
      if (await viaSportOption.isVisible().catch(() => false)) {
        await viaSportOption.click();
      } else {
        await page.getByRole("option").first().click();
      }
      await waitForIdle(page);
    } else {
      await selectOrg(page);
    }
    await waitForIdle(page);
  }

  // Navigate directly to analytics explore URL
  console.log("Opening analytics explore...");
  await safeGoto(page, `${config.baseUrl}/dashboard/analytics/explore`);
  await waitForIdle(page);

  // Check if we need to select org first (SIN portal org selection page)
  const selectOrgIfNeeded = async () => {
    const orgSelectCard = page.getByText("Select an organization", { exact: true });
    if (await orgSelectCard.isVisible().catch(() => false)) {
      console.log("On SIN org selection page, selecting viaSport BC...");
      const orgDropdown = page.getByRole("combobox");
      if (await orgDropdown.isVisible().catch(() => false)) {
        await orgDropdown.click();
        await wait(1000); // Wait for options to load
        // Must select viaSport BC for analytics access
        const viaSportOption = page.getByRole("option", { name: /viaSport BC/i });
        await viaSportOption.waitFor({ state: "visible", timeout: 10_000 });
        await viaSportOption.click();
        await waitForIdle(page);
        await wait(1000);
      }
    }
  };

  await selectOrgIfNeeded();

  // Click Analytics in sidebar (direct URL redirects to dashboard)
  console.log("Clicking Analytics link in sidebar...");
  const analyticsLink = page.getByRole("link", { name: "Analytics", exact: true });
  await analyticsLink.waitFor({ state: "visible", timeout: 15_000 });
  await analyticsLink.click();
  await waitForIdle(page);
  await wait(1500);

  // Check if we need org selection for analytics
  await selectOrgIfNeeded();

  // Verify we're on the analytics page (has dataset selector or pivot builder)
  const datasetSelector = page
    .getByText("Select a dataset")
    .or(page.getByRole("combobox").first());
  await datasetSelector.waitFor({ state: "visible", timeout: 15_000 }).catch(async () => {
    // If not visible, we might need to click Analytics again
    console.log("Dataset selector not found, re-clicking Analytics...");
    await analyticsLink.click();
    await waitForIdle(page);
    await wait(1000);
  });
  await wait(800);
  await takeScreenshot("00-analytics-loaded.png");

  // Select dataset
  console.log("Selecting dataset...");
  const datasetCombo = page.getByRole("combobox").first();
  await datasetCombo.waitFor({ state: "visible", timeout: 20_000 });
  await datasetCombo.click();
  await wait(500);

  // Try to select Organizations or first available dataset
  const orgDataset = page.getByRole("option", { name: /Organizations/i });
  if (await orgDataset.isVisible().catch(() => false)) {
    await orgDataset.click();
  } else {
    await page.getByRole("option").first().click();
  }
  await page.keyboard.press("Escape");
  await wait(800);
  await takeScreenshot("01-dataset-selected.png");

  // Build pivot - drag fields to dropzones
  console.log("Building pivot...");
  const fieldsLocator = page.locator("[data-testid^=field-]");
  await fieldsLocator.first().waitFor({ state: "visible", timeout: 20_000 });

  // Drag a row field (org name or similar)
  const rowField = page.locator("[data-testid^=field-]", {
    hasText: /Name|Organization|Type/i,
  });
  if (
    await rowField
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await dragTo(
      page,
      rowField.first().locator("span").first(),
      "[data-testid=rows-dropzone]",
    );
    await wait(500);
  }

  // Drag a measure field
  const measureField = page.locator("[data-testid^=field-]", {
    hasText: /Count|Total|ID/i,
  });
  if (
    await measureField
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await dragTo(
      page,
      measureField.first().locator("span").first(),
      "[data-testid=measures-dropzone]",
    );
    await wait(500);
  }
  await takeScreenshot("02-pivot-configured.png");

  // Run query
  console.log("Running query...");
  await page.getByRole("button", { name: "Run query" }).click();
  await page
    .getByTestId("pivot-table")
    .waitFor({ timeout: 30_000 })
    .catch(() => {});
  await wait(1000);
  await takeScreenshot("03-pivot-results.png");

  // Switch to chart view if available
  console.log("Switching to chart view...");
  const chartTab = page.getByRole("tab", { name: /chart/i });
  if (await chartTab.isVisible().catch(() => false)) {
    await chartTab.click();
    await wait(1000);
    await takeScreenshot("04-chart-view.png");
  }

  // Export CSV
  console.log("Exporting CSV...");
  const exportButton = page.getByRole("button", { name: "Export CSV" });
  await exportButton.scrollIntoViewIfNeeded();
  await wait(300);
  await exportButton.click();

  // Handle step-up auth if needed
  const stepUpCompleted = await completeStepUpIfNeeded(page, async () => {
    console.log("Step-up auth required for export");
    await takeScreenshot("05-step-up-auth.png");
  });

  if (stepUpCompleted) {
    console.log("Step-up auth completed");
    await wait(500);
  }

  // Wait for export success toast
  const exportToast = page
    .locator("[data-sonner-toast]")
    .filter({ hasText: /export|download|success/i });
  await exportToast.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await wait(800);
  await takeScreenshot("06-export-complete.png");

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
