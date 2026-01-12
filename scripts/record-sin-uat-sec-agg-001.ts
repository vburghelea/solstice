#!/usr/bin/env tsx
/**
 * SEC-AGG-001: Record complete MFA login flow video with settings page.
 * Improved version with better pacing to avoid loading states.
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
const screenshotDir = path.resolve(evidenceDir, "screenshots/SEC-AGG-001");
const videoName = `SEC-AGG-001-auth-mfa-login-flow-${stamp}.mp4`;

const run = async () => {
  await mkdir(videoDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();
  await page.context().clearCookies();

  // Step 1: Navigate to login page
  console.log("Step 1: Navigating to login page...");
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000); // Let page settle

  // Step 2: Enter email and continue
  console.log("Step 2: Entering email...");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.waitForTimeout(750);
  await page.screenshot({ path: path.join(screenshotDir, "01-login-email-entry.png") });
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: Wait for password field (avoid capturing "Checking..." state)
  console.log("Step 3: Waiting for password field...");
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(500); // Extra wait for UI to settle

  // Step 4: Enter password and login
  console.log("Step 4: Entering password...");
  await passwordInput.fill(password);
  await page.waitForTimeout(750);
  await page.getByRole("button", { name: "Login" }).click();

  // Step 5: Wait for MFA prompt (avoid "Logging in..." state)
  console.log("Step 5: Waiting for MFA prompt...");
  const authButton = page.getByRole("button", { name: "Authenticator code" });
  await authButton.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(500);

  // Step 6: Complete MFA
  console.log("Step 6: Completing MFA...");
  await page.screenshot({ path: path.join(screenshotDir, "02-mfa-totp-challenge.png") });
  await authButton.click();
  await page.waitForTimeout(500);

  const code = authenticator.generate(totpSecret);
  await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Verify code" }).click();

  // Step 7: Wait for dashboard (avoid "Verifying..." state)
  console.log("Step 7: Waiting for dashboard...");
  await page.waitForURL(/\/dashboard(\/select-org|\/sin)?/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Step 8: Handle org selection if needed
  if (page.url().includes("/dashboard/select-org")) {
    console.log("Step 8: Selecting organization...");
    const combobox = page.getByRole("combobox");
    await combobox.waitFor({ state: "visible", timeout: 20000 });
    await combobox.click();
    await page.waitForTimeout(500);

    // Try to select BC Hockey or first option
    const option = page.getByRole("option").first();
    await option.click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  }

  // Step 9: Capture dashboard
  console.log("Step 9: Capturing dashboard...");
  await page.screenshot({
    path: path.join(screenshotDir, "03-post-login-dashboard.png"),
  });
  await page.waitForTimeout(1500);

  // Step 10: Navigate to settings
  console.log("Step 10: Navigating to settings...");
  await page.goto(`${baseUrl}/dashboard/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll to MFA section
  const mfaSection = page.getByText("Multi-Factor Authentication");
  if (await mfaSection.isVisible().catch(() => false)) {
    await mfaSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  // Step 11: Capture settings with MFA section
  console.log("Step 11: Capturing MFA settings...");
  await page.screenshot({ path: path.join(screenshotDir, "04-mfa-status-settings.png") });
  await page.waitForTimeout(2000); // Hold on final frame

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
