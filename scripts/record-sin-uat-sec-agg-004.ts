#!/usr/bin/env tsx
/**
 * SEC-AGG-004: Record audit trail and hash chain verification video.
 * Shows filter -> hash verify -> CSV export with clear pacing (0.5-2s between actions).
 */

import path from "node:path";

import {
  config,
  createScreenshotHelper,
  finalizeVideo,
  generateTOTP,
  getTimestamp,
  login,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "SEC-AGG-004";
const stamp = getTimestamp();
const evidenceDir = config.evidenceDir;
const videoName = `${reqId}-audit-verification-flow-${stamp}.mp4`;
const screenshotDir = path.resolve(evidenceDir, `screenshots/${reqId}`);
const videoDir = path.resolve(evidenceDir, "videos");

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const { browser, context, page } = await setupEvidenceCapture(reqId);
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  await login(page);
  await waitForIdle(page);
  console.log(`After login at ${page.url()}`);

  console.log("Navigating to audit page...");
  await page.goto(`${config.baseUrl}/dashboard/admin/sin/audit`, {
    waitUntil: "networkidle",
  });
  await waitForIdle(page);
  console.log(`Audit page URL: ${page.url()}`);
  await wait(800);
  await takeScreenshot("00-audit-page.png");

  const auditTab = page.getByRole("tab", { name: /Audit/i });
  if (await auditTab.isVisible().catch(() => false)) {
    await auditTab.click();
    await waitForIdle(page);
    await wait(500);
  }

  const auditHeading = page.getByRole("heading", { name: /Audit Log/i }).first();
  try {
    await auditHeading.waitFor({ timeout: 15_000 });
  } catch {
    console.warn("Audit heading not found, proceeding with fallback screenshot.");
  }
  await wait(800);
  await takeScreenshot("01-audit-log-loaded.png");

  console.log("Filtering by EXPORT category...");
  const categorySelect = page.locator("[aria-label='Filter by action category']");
  await categorySelect.click();
  await wait(400);
  await page.getByRole("option", { name: "EXPORT" }).click();
  await wait(1000);
  await takeScreenshot("02-audit-export-filter.png");

  console.log("Verifying hash chain...");
  const verifyButton = page.getByRole("button", { name: "Verify hash chain" });
  await verifyButton.scrollIntoViewIfNeeded();
  await verifyButton.click();
  await wait(400);

  const successText = page.getByText(/Hash chain verified/i);
  await successText.waitFor({ timeout: 15_000 }).catch(() => {});
  await wait(800);
  await takeScreenshot("03-hash-verified.png");

  console.log("Exporting audit log CSV...");
  const exportButton = page.getByRole("button", { name: "Export CSV" });
  const downloadPromise = page
    .waitForEvent("download", { timeout: 10_000 })
    .catch(() => null);
  await exportButton.click();

  const download = await downloadPromise;
  if (download) {
    console.log(`Download: ${download.suggestedFilename()}`);
    await download.saveAs(path.join("outputs", download.suggestedFilename()));
  }
  await wait(800);

  const stepUpTitle = page.getByRole("heading", { name: "Confirm your identity" });
  if (await stepUpTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
    const passwordInput = page.locator("#step-up-password");
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(config.password);
    }
    const authCodeButton = page.getByRole("button", { name: "Authenticator code" });
    if (await authCodeButton.isVisible().catch(() => false)) {
      await authCodeButton.click();
      await page.locator("#step-up-code").fill(generateTOTP());
    }
    await page.getByRole("button", { name: "Verify" }).click();
    await stepUpTitle.waitFor({ state: "hidden", timeout: 10_000 });
  }

  await wait(800);
  await takeScreenshot("04-export-complete.png");

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
