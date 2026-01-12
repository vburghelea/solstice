#!/usr/bin/env tsx
/**
 * SEC-AGG-004: Audit trail walkthrough with filters, hash verification, and export.
 */

import path from "node:path";

import {
  completeStepUpIfNeeded,
  config,
  createScreenshotHelper,
  finalizeVideo,
  getTimestamp,
  login,
  safeGoto,
  selectOrg,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "SEC-AGG-004";
const stamp = getTimestamp();
const videoName = `${reqId}-audit-verification-flow-${stamp}.mp4`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const { browser, context, page, videoDir, screenshotDir } = await setupEvidenceCapture(
    reqId,
    { recordLogin: true },
  );
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  // Login during recording for fresh session
  await login(page);
  await waitForIdle(page);

  // Handle org selection if needed
  if (page.url().includes("/select-org")) {
    console.log("Selecting organization...");
    await selectOrg(page);
    await waitForIdle(page);
  }

  console.log("Opening audit log...");
  await safeGoto(page, `${config.baseUrl}/dashboard/admin/sin/audit`);
  await waitForIdle(page);

  const firstRow = page
    .getByRole("row")
    .filter({ hasText: /SECURITY|AUTH|DATA|EXPORT/i })
    .first();
  await firstRow.waitFor({ timeout: 15_000 }).catch(() => {});
  await wait(700);
  await takeScreenshot("00-audit-loaded.png");

  console.log("Scrolling to show more categories...");
  await page.mouse.wheel(0, 600);
  await wait(400);
  await takeScreenshot("01-entries-visible.png");

  console.log("Filtering to EXPORT category for PII + step-up badges...");
  const categorySelect = page
    .getByRole("combobox")
    .filter({ hasText: /All categories/i })
    .first();
  await categorySelect.click();
  await wait(200);
  await page.getByRole("option", { name: "EXPORT" }).click();
  await wait(900);
  await page
    .getByText(/PII/i)
    .first()
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  await takeScreenshot("02-export-filter.png");

  console.log("Verifying hash chain...");
  const verifyButton = page.getByRole("button", { name: /Verify hash chain/i });
  await verifyButton.scrollIntoViewIfNeeded();
  await verifyButton.click();
  await page
    .getByText(/Hash chain verified/i)
    .waitFor({ timeout: 15_000 })
    .catch(() => {});
  await wait(700);
  await takeScreenshot("03-hash-verified.png");

  console.log("Exporting CSV with step-up...");
  const exportButton = page.getByRole("button", { name: /Export CSV/i });
  await exportButton.scrollIntoViewIfNeeded();
  await wait(300);

  // Set up download listener before clicking
  const downloadPromise = page
    .waitForEvent("download", { timeout: 20_000 })
    .catch(() => null);
  await exportButton.click();
  console.log("Export button clicked");

  // Handle step-up auth if required
  const stepUpCompleted = await completeStepUpIfNeeded(page, async () => {
    console.log("Step-up auth required for export");
    await takeScreenshot("04a-step-up-auth.png");
  });

  if (stepUpCompleted) {
    console.log("Step-up auth completed");
    await wait(500);
  }

  // Wait for download
  const download = await downloadPromise;
  if (download) {
    const filename = download.suggestedFilename();
    await download.saveAs(path.join("outputs", filename));
    console.log(`Export saved: ${filename}`);
  } else {
    console.log("No download triggered - may not require step-up");
  }

  await wait(1000);

  // Check for export success toast
  const exportToast = page
    .locator("[data-sonner-toast]")
    .filter({ hasText: /export|download|success/i });
  await exportToast.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

  await takeScreenshot("04-export-complete.png");

  console.log("Applying date filter to tighten range...");
  const today = new Date();
  const from = new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30);
  const fromInput = page.getByLabel("Filter from date");
  const toInput = page.getByLabel("Filter to date");
  await fromInput.fill(from.toISOString().slice(0, 10));
  await toInput.fill(today.toISOString().slice(0, 10));
  await waitForIdle(page);
  await wait(600);
  await takeScreenshot("05-date-filter.png");

  console.log("Switching to AUTH entries for coverage...");
  // Re-locate the category select since its text changed after filtering
  const categorySelectForAuth = page
    .getByRole("combobox")
    .filter({ hasText: /EXPORT|All categories/i })
    .first();
  if (await categorySelectForAuth.isVisible().catch(() => false)) {
    await categorySelectForAuth.click();
    await wait(200);
    const authOption = page.getByRole("option", { name: "AUTH" });
    if (await authOption.isVisible().catch(() => false)) {
      await authOption.click();
      await wait(900);
    }
  }
  await takeScreenshot("06-auth-filter.png");

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
