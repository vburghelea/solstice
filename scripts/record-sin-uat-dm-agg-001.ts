#!/usr/bin/env tsx
/**
 * DM-AGG-001: Record form creation and submission flow.
 * Demonstrates form builder, publishing, and user submission.
 */

import { chromium } from "@playwright/test";
import { authenticator } from "otplib";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

const email = process.env["SIN_UAT_EMAIL"] ?? "viasport-staff@example.com";
const password = process.env["SIN_UAT_PASSWORD"] ?? "testpassword123";
const totpSecret =
  process.env["SIN_UI_TOTP_SECRET_BASE32"] ??
  "ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA";
const baseUrl = "https://sinuat.solsticeapp.ca";

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .slice(0, 12);

const evidenceDir = "docs/sin-rfp/review-plans/evidence/2026-01-10";
const videoDir = path.resolve(evidenceDir, "videos");
const screenshotDir = path.resolve(evidenceDir, "screenshots/DM-AGG-001");
const videoName = `DM-AGG-001-form-submission-flow-${stamp}.mp4`;

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

  // Login flow - clear all browser state first
  console.log("Clearing browser state...");
  await page.context().clearCookies();
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => {}); // May fail on about:blank

  console.log("Logging in...");
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Continue" }).click();

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 30000 });
  await passwordInput.fill(password);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Login" }).click();

  // Handle MFA
  console.log("Checking for MFA...");
  const authButton = page.getByRole("button", { name: "Authenticator code" });
  try {
    await authButton.waitFor({ state: "visible", timeout: 20000 });
    console.log("MFA prompt found, entering code...");
    await authButton.click();
    const code = authenticator.generate(totpSecret);
    console.log("Generated TOTP code:", code);
    await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Verify code" }).click();
    console.log("Clicked verify, waiting for navigation...");
    await page.waitForTimeout(3000);
    console.log("After verify, URL:", page.url());
  } catch (e) {
    console.log("MFA handling error or not shown:", e instanceof Error ? e.message : e);
  }

  // Wait for dashboard and handle org selection
  console.log("Waiting for dashboard...");
  try {
    await page.waitForURL(/\/dashboard(\/select-org|\/sin)?/, { timeout: 60000 });
  } catch (e) {
    console.log("Current URL:", page.url());
    throw e;
  }
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/dashboard/select-org")) {
    const combobox = page.getByRole("combobox");
    await combobox.waitFor({ state: "visible", timeout: 20000 });
    await combobox.click();
    await page.getByRole("option").first().click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
  }

  // Navigate to Forms admin
  console.log("Navigating to Forms admin...");
  await page.goto(`${baseUrl}/dashboard/admin/sin/forms`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Look for an existing form or create view
  const formsTab = page.getByRole("tab", { name: /Forms/i });
  if (await formsTab.isVisible().catch(() => false)) {
    await formsTab.click();
    await page.waitForTimeout(1000);
  }

  // Try to find form builder elements
  const formBuilderHeading = page.getByText(/Form Builder|Create Form|Configure form/i);
  const formsList = page.locator("table, [data-testid='forms-list']");

  if (await formBuilderHeading.isVisible().catch(() => false)) {
    console.log("Form builder visible, capturing state...");
    await page.waitForTimeout(1000);
    await takeScreenshot("01-form-builder-fields.png");
  } else if (await formsList.isVisible().catch(() => false)) {
    console.log("Forms list visible, capturing list...");
    await takeScreenshot("01-forms-admin-list.png");

    // Click on an existing form to open builder
    const formRow = page
      .locator("table tr")
      .filter({ hasText: /Facility|Usage|Survey/i })
      .first();
    if (await formRow.isVisible().catch(() => false)) {
      await formRow.click();
      await page.waitForTimeout(2000);
      await takeScreenshot("02-form-builder-detail.png");
    }
  } else {
    // Capture whatever is shown
    await takeScreenshot("01-forms-admin-view.png");
  }

  // Navigate to SIN dashboard first, then click Forms link (goto triggers download bug)
  console.log("Navigating to SIN dashboard...");
  await page.goto(`${baseUrl}/dashboard/sin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await takeScreenshot("02-sin-dashboard.png");

  // Now click Forms link in sidebar
  console.log("Clicking Forms link in sidebar...");
  const formsLink = page.getByRole("link", { name: "Forms", exact: true });
  if (await formsLink.isVisible().catch(() => false)) {
    await formsLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await takeScreenshot("03-forms-list-view.png");
  } else {
    console.log("Forms link not visible in sidebar");
  }

  // Try to find and click on a form
  const formCard = page
    .locator("[data-testid='form-card'], .card, a[href*='/forms/']")
    .filter({
      hasText: /Facility|Usage|Survey/i,
    })
    .first();

  const formLink = page
    .locator("a")
    .filter({ hasText: /Facility|Usage|Survey/i })
    .first();

  let formClicked = false;
  if (await formCard.isVisible().catch(() => false)) {
    await formCard.click();
    formClicked = true;
  } else if (await formLink.isVisible().catch(() => false)) {
    await formLink.click();
    formClicked = true;
  }

  if (formClicked) {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for form submission UI
    const submitButton = page.getByRole("button", { name: /Submit/i });
    const formFields = page.locator("input, textarea, select").first();

    if (await submitButton.isVisible().catch(() => false)) {
      console.log("Form submission UI found...");

      // Fill out form fields if visible
      const facilityNameInput = page.locator("input").filter({ hasText: "" }).first();
      const textInputs = page.locator("input[type='text'], input:not([type])");

      for (let i = 0; i < (await textInputs.count()) && i < 3; i++) {
        const input = textInputs.nth(i);
        if (await input.isVisible().catch(() => false)) {
          const currentValue = await input.inputValue().catch(() => "");
          if (!currentValue) {
            await input.fill(`Test Value ${i + 1}`);
          }
        }
      }

      await page.waitForTimeout(1000);
      await takeScreenshot("04-form-filled-entry.png");

      // Attempt submission
      console.log("Attempting form submission...");
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Capture result (success or error)
      await takeScreenshot("05-submission-result.png");
    } else {
      console.log("Form submission UI not found, capturing current state...");
      await takeScreenshot("04-form-detail-view.png");
    }
  } else {
    console.log("No form found to click, capturing current state...");
  }

  // Hold on final frame
  await page.waitForTimeout(2000);

  // Finalize
  console.log("Finalizing video...");
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath) {
    throw new Error("Video recording failed to save.");
  }

  const finalPath = path.join(videoDir, videoName);
  await rename(videoPath, finalPath);
  console.log(`Video saved to ${finalPath}`);
  console.log(`Screenshots saved to ${screenshotDir}`);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
