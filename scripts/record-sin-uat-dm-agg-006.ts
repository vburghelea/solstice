#!/usr/bin/env tsx
/**
 * DM-AGG-006: Record import wizard flow.
 *
 * DOWNLOAD BUG FIX (see docs/issues/PLAYWRIGHT-DOWNLOAD-BUG-FIX.md):
 * - Don't use storageState option (causes downloads)
 * - Clear cookies, then manually add them with addCookies()
 * - Navigate to audit page first, then click to imports
 *
 * Pacing: 0.5-2s between actions for smooth viewing.
 */

import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";

const baseUrl = "https://sinuat.solsticeapp.ca";
const storageStatePath = path.resolve("outputs/sin-uat-storage.json");

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .slice(0, 12);

const evidenceDir = "docs/sin-rfp/review-plans/evidence/2026-01-10";
const videoDir = path.resolve(evidenceDir, "videos");
const screenshotDir = path.resolve(evidenceDir, "screenshots/DM-AGG-006");
const videoName = `DM-AGG-006-import-wizard-flow-${stamp}.mp4`;

// Use aligned CSV that matches Annual Statistics Report form fields
const successFile = path.resolve(
  "docs/sin-rfp/legacy-data-samples/import-demo-annual-stats.csv",
);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  if (!existsSync(storageStatePath)) {
    throw new Error(
      `Storage state not found at ${storageStatePath}. Run save-sin-uat-storage-state.ts first.`,
    );
  }

  await mkdir(videoDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  // Use headed mode for proper video capture (headless can produce blank frames)
  const browser = await chromium.launch({ headless: false });

  // DON'T use storageState option - it causes the download bug
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    acceptDownloads: true,
  });

  const page = await context.newPage();

  // DOWNLOAD BUG FIX: Clear cookies first, then manually add them
  await page.context().clearCookies();
  const storageState = JSON.parse(await readFile(storageStatePath, "utf-8"));
  await page.context().addCookies(storageState.cookies);

  const takeScreenshot = async (name: string) => {
    await page.screenshot({ path: path.join(screenshotDir, name) });
    console.log(`Screenshot: ${name}`);
  };

  // CRITICAL: Storage state only has session cookies, not activeOrganizationId context.
  // We must first select an organization to establish the React app context.
  console.log("Navigating to select-org page to establish organization context...");
  await page.goto(`${baseUrl}/dashboard/select-org`, { waitUntil: "networkidle" });
  await wait(1000);

  // Check if we need to select an org or if we're redirected
  if (page.url().includes("/select-org")) {
    console.log("Selecting organization...");
    const orgCombo = page.getByRole("combobox");
    await orgCombo.click();
    await wait(500);

    const viasportOpt = page.getByRole("option", { name: /viaSport BC/i });
    if (await viasportOpt.isVisible().catch(() => false)) {
      await viasportOpt.click();
    } else {
      await page.getByRole("option").first().click();
    }
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await wait(1000);
  }

  console.log("Organization context established. URL:", page.url());

  // Navigate directly to admin imports URL (org context is now set)
  console.log("Navigating to Admin Imports page...");
  await page.goto(`${baseUrl}/dashboard/admin/sin/imports?tab=wizard`, {
    waitUntil: "networkidle",
  });
  await wait(1500);

  console.log("URL after navigating to admin imports:", page.url());
  await takeScreenshot("01-import-admin-page.png");

  // Scroll to see the full form
  await page.evaluate(() => window.scrollBy(0, 200));
  await wait(500);

  // Select Organization
  console.log("Selecting organization...");
  const orgSelect = page
    .locator("button")
    .filter({ hasText: /Select organization/i })
    .first();
  if (await orgSelect.isVisible().catch(() => false)) {
    await orgSelect.click();
    await wait(800);
    const viasportOption = page.getByRole("option", { name: /viaSport BC/i });
    if (await viasportOption.isVisible().catch(() => false)) {
      await viasportOption.click();
    } else {
      await page.getByRole("option").first().click();
    }
    await wait(1000);
  }

  // Select Target form
  console.log("Selecting target form...");
  const formSelect = page
    .locator("button")
    .filter({ hasText: /Select form/i })
    .first();
  if (await formSelect.isVisible().catch(() => false)) {
    await formSelect.click();
    await wait(800);
    await page.getByRole("option").first().click();
    await wait(1000);
  }
  await takeScreenshot("02-import-config-selected.png");

  // Scroll down to see file upload area
  await page.evaluate(() => window.scrollBy(0, 300));
  await wait(800);
  await takeScreenshot("03-import-file-area.png");

  // Upload the CSV file
  console.log("Uploading CSV file...");
  const fileInput = page.locator("input[type='file']");
  const fileCount = await fileInput.count();
  console.log(`Found ${fileCount} file inputs`);

  if (fileCount > 0) {
    await fileInput.first().setInputFiles(successFile);
    await wait(2000);
    await takeScreenshot("04-import-file-uploaded.png");
  }

  // Check Create import job button status
  console.log("Checking Create import job button...");
  const createButton = page.getByRole("button", { name: /Create import job/i });
  const isVisible = await createButton.isVisible().catch(() => false);
  const isEnabled = await createButton.isEnabled().catch(() => false);
  console.log(`Create button - visible: ${isVisible}, enabled: ${isEnabled}`);

  // Scroll down to show field mapping section fully
  await page.evaluate(() => window.scrollBy(0, 300));
  await wait(1000);
  await takeScreenshot("05-field-mapping-view.png");

  if (isEnabled) {
    await createButton.click();
    await wait(2000);
    await takeScreenshot("06-import-job-created.png");

    // Wait for processing
    console.log("Waiting for import to process...");
    await wait(3000);
  } else {
    console.log("Create button is disabled (possibly transient API error)");
  }

  // Always go to History tab to show past imports
  console.log("Navigating to History tab...");
  const historyTab = page.getByRole("tab", { name: /History/i });
  if (await historyTab.isVisible().catch(() => false)) {
    await historyTab.click();
    await page.waitForLoadState("networkidle");
    await wait(1500);
    await takeScreenshot("07-import-history.png");
  } else {
    // Try link-style History tab
    const historyLink = page.locator("a, button").filter({ hasText: /^History$/ });
    if (
      await historyLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await historyLink.first().click();
      await page.waitForLoadState("networkidle");
      await wait(1500);
      await takeScreenshot("07-import-history.png");
    }
  }

  // Hold final frame
  await wait(2000);

  // Finalize
  console.log("Finalizing video...");
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath) {
    throw new Error("Video recording failed.");
  }

  const finalPath = path.join(videoDir, videoName);
  await rename(videoPath, finalPath);
  console.log(`Video saved to ${finalPath}`);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
