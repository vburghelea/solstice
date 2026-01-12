#!/usr/bin/env tsx
/**
 * DM-AGG-006: Record import wizard flow with error → success path.
 * Shows template download, validation errors, mapping, run import, and history/submissions.
 */

import path from "node:path";

import {
  config,
  createScreenshotHelper,
  finalizeVideo,
  getTimestamp,
  safeGoto,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "DM-AGG-006";
const stamp = getTimestamp();
const videoName = `${reqId}-import-wizard-flow-${stamp}.mp4`;
const errorCsv = path.resolve(
  "docs/sin-rfp/legacy-data-samples/import-demo-annual-stats-errors.csv",
);
const successCsv = path.resolve(
  "docs/sin-rfp/legacy-data-samples/import-demo-annual-stats-large.csv",
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const { browser, context, page, videoDir, screenshotDir } = await setupEvidenceCapture(
    reqId,
    { recordLogin: false },
  );
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  await waitForIdle(page);

  console.log("Navigating to import wizard...");
  try {
    await page.goto(`${config.baseUrl}/dashboard/admin/sin/imports?tab=wizard`, {
      waitUntil: "domcontentloaded",
    });
  } catch (error) {
    console.log("Navigation triggered a download, continuing to wizard view...");
  }
  await waitForIdle(page);
  await takeScreenshot("00-import-wizard.png");

  console.log("Selecting organization and form...");
  // Organization dropdown - it's a combobox/select component
  const orgSelect = page.locator('button:has-text("Select organization")').first();
  if (await orgSelect.isVisible().catch(() => false)) {
    await orgSelect.click();
    await wait(500);
    // Look for viaSport BC option
    const orgOption = page.getByRole("option", { name: /viaSport BC/i }).first();
    if (await orgOption.isVisible().catch(() => false)) {
      await orgOption.click();
    } else {
      // Fallback to first option
      const firstOption = page.getByRole("option").first();
      await firstOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      await firstOption.click().catch(() => {});
    }
    await wait(500);
  }

  // Form dropdown
  const formSelect = page.locator('button:has-text("Select form")').first();
  if (await formSelect.isVisible().catch(() => false)) {
    await formSelect.click();
    await wait(500);
    const annualStatsOption = page
      .getByRole("option", { name: /Annual Statistics|Facility Usage/i })
      .first();
    if (await annualStatsOption.isVisible().catch(() => false)) {
      await annualStatsOption.click();
    } else {
      const firstOption = page.getByRole("option").first();
      await firstOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      await firstOption.click().catch(() => {});
    }
    await wait(500);
  }

  await wait(800);
  await takeScreenshot("00b-setup-complete.png");

  console.log("Downloading XLSX template...");
  const downloadButton = page.getByRole("button", { name: /Download XLSX template/i });
  // Wait for button to be enabled (org and form must be selected)
  await downloadButton.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});

  // Check if button is enabled before trying to click
  const isEnabled = await downloadButton.isEnabled().catch(() => false);
  if (isEnabled) {
    const templateDownload = page
      .waitForEvent("download", { timeout: 10_000 })
      .catch(() => null);
    await downloadButton.click();
    const download = await templateDownload;
    if (download) {
      await download.saveAs(path.join("outputs", download.suggestedFilename()));
    }
  } else {
    console.log("Download button not enabled - skipping template download");
  }
  await wait(500);

  console.log("Uploading error CSV to show validation issues...");
  const fileInput = page.getByLabel("Source file");
  await fileInput.setInputFiles(errorCsv);
  await wait(1500);
  await takeScreenshot("01-validation-errors.png");

  const errorPanel = page.getByText(/missing required|invalid/i).first();
  await errorPanel.waitFor({ timeout: 5000 }).catch(() => {});

  console.log("Uploading clean CSV with 50 rows...");
  await fileInput.setInputFiles(successCsv);
  await wait(1800);
  await page
    .getByText(/Columns detected: 7/i)
    .waitFor({ timeout: 8000 })
    .catch(() => {});
  await takeScreenshot("02-mapping-applied.png");

  const createButton = page.getByRole("button", { name: /Create import job/i });
  if (await createButton.isEnabled().catch(() => false)) {
    await createButton.click();
    await wait(1200);
  }

  const reviewCheckbox = page.getByRole("checkbox", {
    name: /reviewed the validation preview/i,
  });
  if (await reviewCheckbox.isVisible().catch(() => false)) {
    await reviewCheckbox.check({ force: true });
  }

  console.log("Running import...");
  const runImportButton = page.getByRole("button", {
    name: /Run import|Run batch import/i,
  });
  if (await runImportButton.isEnabled().catch(() => false)) {
    await runImportButton.click();
  }

  await wait(1500);
  await takeScreenshot("03-import-running.png");

  const completedBadge = page.getByText(/completed/i).first();
  await completedBadge.waitFor({ timeout: 12_000 }).catch(() => {});
  await wait(600);
  await takeScreenshot("04-import-complete.png");

  console.log("Showing import history...");
  const historyHeading = page.getByRole("heading", { name: /Import history/i });
  if (await historyHeading.isVisible().catch(() => false)) {
    await historyHeading.scrollIntoViewIfNeeded();
  }
  await wait(800);
  await takeScreenshot("05-import-history.png");

  // Navigate to Annual Statistics form submissions to verify imported rows
  console.log("Navigating to Annual Statistics form to show submissions...");
  try {
    await safeGoto(page, `${config.baseUrl}/dashboard/sin/forms`);
    await waitForIdle(page);
    await wait(800);
  } catch (error) {
    console.warn(
      "   → Could not navigate to forms (likely download intercept); skipping submissions view.",
      error,
    );
  }

  const annualCard = page
    .getByRole("link", { name: /Annual Statistics Report/i })
    .first();
  if (await annualCard.isVisible().catch(() => false)) {
    await annualCard.click();
  } else {
    const openFormLink = page.getByRole("link", { name: "Open form" }).first();
    if (await openFormLink.isVisible().catch(() => false)) {
      await openFormLink.click();
    }
  }
  await waitForIdle(page);
  await wait(800);

  const submissionsTab = page.getByRole("tab", { name: /Submissions/i }).first();
  if (await submissionsTab.isVisible().catch(() => false)) {
    await submissionsTab.click();
    await waitForIdle(page);
    await wait(800);
  }

  await takeScreenshot("06-imported-submissions.png");

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
