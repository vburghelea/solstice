#!/usr/bin/env tsx
/**
 * RP-AGG-005: Record analytics pivot and export video.
 * Logs in (will be trimmed with FFmpeg), shows dataset selection, pivot building, and export.
 * Pacing: 0.5-2s between actions for smooth viewing.
 */

import { chromium } from "@playwright/test";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { authenticator } from "otplib";

const baseUrl = "https://sinuat.solsticeapp.ca";
const email = "viasport-staff@example.com";
const password = "testpassword123";
const totpSecret = "ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA";

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .slice(0, 12);

const evidenceDir = "docs/sin-rfp/review-plans/evidence/2026-01-10";
const videoDir = path.resolve(evidenceDir, "videos");
const screenshotDir = path.resolve(evidenceDir, "screenshots/RP-AGG-005");
const videoName = `RP-AGG-005-analytics-export-flow-${stamp}.mp4`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  await mkdir(videoDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    acceptDownloads: true,
  });

  const page = await context.newPage();
  const takeScreenshot = async (name: string) => {
    await page.screenshot({ path: path.join(screenshotDir, name) });
    console.log(`Screenshot: ${name}`);
  };

  // Quick login (will be trimmed from final video)
  console.log("Logging in...");
  await page.context().clearCookies();
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => {});

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  await wait(500);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await wait(300);
  await page.getByRole("button", { name: "Continue" }).click();

  const passwordInput = page.locator("input[type='password']");
  await passwordInput.waitFor({ state: "visible", timeout: 30000 });
  await passwordInput.fill(password);
  await wait(300);
  await page.getByRole("button", { name: "Login" }).click();

  // Handle MFA
  const authButton = page.getByRole("button", { name: "Authenticator code" });
  try {
    await authButton.waitFor({ state: "visible", timeout: 15000 });
    await authButton.click();
    const code = authenticator.generate(totpSecret);
    await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
    await wait(300);
    await page.getByRole("button", { name: "Verify code" }).click();
  } catch {
    // MFA might not be shown
  }

  // Wait for dashboard
  await page.waitForURL(/\/dashboard(\/select-org|\/sin)?/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  console.log("URL after login:", page.url());

  // Select org if prompted
  if (page.url().includes("/dashboard/select-org")) {
    console.log("Selecting organization...");
    const combobox = page.getByRole("combobox");
    await combobox.waitFor({ state: "visible", timeout: 20000 });
    await combobox.click();
    await page.getByRole("option", { name: "viaSport BC" }).click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
  }

  // Wait for sidebar to fully load with Analytics link
  await wait(1500);

  // Debug: log available links
  const links = await page.getByRole("link").allTextContents();
  console.log("Sidebar links:", links.filter((l) => l.length < 30).join(", "));

  // ===== CONTENT STARTS HERE =====
  console.log("Recording content...");

  // Click Analytics link in sidebar
  const analyticsLink = page.getByRole("link", { name: "Analytics", exact: true });
  if (await analyticsLink.isVisible().catch(() => false)) {
    await analyticsLink.click();
  } else {
    // Try Analytics Audit as fallback
    const auditLink = page.getByRole("link", { name: "Analytics Audit" });
    if (await auditLink.isVisible().catch(() => false)) {
      console.log("Using Analytics Audit link instead");
      await auditLink.click();
    } else {
      throw new Error("No Analytics link found");
    }
  }
  await page.waitForLoadState("networkidle");
  await wait(1200);
  await takeScreenshot("01-analytics-loaded.png");

  // Select dataset if we're on explore page
  if (page.url().includes("/analytics/explore")) {
    console.log("Selecting dataset...");
    const datasetCombo = page.getByRole("combobox").first();
    await datasetCombo.click();
    await wait(600);

    const orgOption = page.getByRole("option", { name: /Organizations/i });
    if (await orgOption.isVisible().catch(() => false)) {
      await orgOption.click();
    } else {
      await page.getByRole("option").first().click();
    }
    await wait(1000);
    await takeScreenshot("02-dataset-selected.png");

    // Drag field to Rows
    console.log("Building pivot...");
    const nameField = page.getByTestId("field-name");
    const rowsDropzone = page.locator("[data-testid=rows-dropzone]");

    if (await nameField.isVisible().catch(() => false)) {
      const nameBox = await nameField.boundingBox();
      const rowsBox = await rowsDropzone.boundingBox();
      if (nameBox && rowsBox) {
        await page.mouse.move(
          nameBox.x + nameBox.width / 2,
          nameBox.y + nameBox.height / 2,
        );
        await wait(400);
        await page.mouse.down();
        await wait(300);
        await page.mouse.move(
          rowsBox.x + rowsBox.width / 2,
          rowsBox.y + rowsBox.height / 2,
        );
        await wait(300);
        await page.mouse.up();
        await wait(800);
      }
    }
    await takeScreenshot("03-row-field-added.png");

    // Run query
    console.log("Running query...");
    const runButton = page.getByRole("button", { name: "Run query" });
    if (await runButton.isVisible().catch(() => false)) {
      await runButton.click();
      await wait(1500);
    }
    await takeScreenshot("04-query-results.png");
  }

  // Export CSV
  console.log("Exporting CSV...");
  const exportButton = page.getByRole("button", { name: "Export CSV" });
  if (await exportButton.isVisible().catch(() => false)) {
    await exportButton.click();
    await wait(1000);

    // Handle step-up auth if needed
    const stepUpTitle = page.getByRole("heading", { name: "Confirm your identity" });
    if (await stepUpTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Step-up auth required...");
      await takeScreenshot("05-step-up.png");

      const stepUpPassword = page.locator("#step-up-password");
      if (await stepUpPassword.isVisible().catch(() => false)) {
        await stepUpPassword.fill(password);
        await wait(500);
      }

      const continueBtn = page.getByRole("button", { name: "Continue" });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await wait(800);
      }

      const codeInput = page.locator("#step-up-code");
      if (await codeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await page.getByRole("button", { name: "Authenticator code" }).click();
        await wait(400);
        const code = authenticator.generate(totpSecret);
        await codeInput.fill(code);
        await wait(400);
        await page.getByRole("button", { name: "Verify" }).click();
        await wait(1500);
      }
    }
  }
  await wait(1200);
  await takeScreenshot("06-export-complete.png");

  // Hold final frame
  await wait(1500);

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
  console.log("NOTE: Use FFmpeg to trim login portion from video");
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
