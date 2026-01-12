#!/usr/bin/env tsx
/**
 * RP-AGG-003: Record reporting workflow flow.
 * Demonstrates reporting cycles, task assignment, and submission tracking.
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
const screenshotDir = path.resolve(evidenceDir, "screenshots/RP-AGG-003");
const videoName = `RP-AGG-003-reporting-workflow-flow-${stamp}.mp4`;

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

  // Login flow
  console.log("Logging in...");
  await page.context().clearCookies();
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
  const authButton = page.getByRole("button", { name: "Authenticator code" });
  try {
    await authButton.waitFor({ state: "visible", timeout: 20000 });
    await authButton.click();
    const code = authenticator.generate(totpSecret);
    await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Verify code" }).click();
  } catch {
    // MFA might not be shown if session is fresh
  }

  // Wait for dashboard and handle org selection
  await page.waitForURL(/\/dashboard(\/select-org|\/sin)?/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/dashboard/select-org")) {
    const combobox = page.getByRole("combobox");
    await combobox.waitFor({ state: "visible", timeout: 20000 });
    await combobox.click();
    await page.getByRole("option").first().click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
  }

  // Navigate to Reporting admin
  console.log("Navigating to Reporting admin...");
  await page.goto(`${baseUrl}/dashboard/admin/sin/reporting`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2000);

  // Capture admin reporting dashboard
  await takeScreenshot("01-reporting-admin-dashboard.png");

  // Look for reporting cycles or creation UI
  const cyclesList = page.locator("table, [data-testid='cycles-list'], .cycles-list");
  const createCycleButton = page.getByRole("button", { name: /Create|New|Add/i }).filter({
    hasText: /Cycle|Period/i,
  });

  // Try to find and interact with reporting cycle UI
  const cyclesTab = page.getByRole("tab", { name: /Cycles/i });
  const tasksTab = page.getByRole("tab", { name: /Tasks/i });
  const submissionsTab = page.getByRole("tab", { name: /Submissions/i });

  if (await cyclesTab.isVisible().catch(() => false)) {
    await cyclesTab.click();
    await page.waitForTimeout(1500);
    await takeScreenshot("02-reporting-cycles.png");
  }

  if (await tasksTab.isVisible().catch(() => false)) {
    await tasksTab.click();
    await page.waitForTimeout(1500);
    await takeScreenshot("03-reporting-tasks.png");
  }

  if (await submissionsTab.isVisible().catch(() => false)) {
    await submissionsTab.click();
    await page.waitForTimeout(1500);
    await takeScreenshot("04-reporting-submissions.png");
  }

  // Navigate to user-facing reporting view
  console.log("Navigating to user reporting view...");
  await page.goto(`${baseUrl}/dashboard/sin/reporting`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await takeScreenshot("05-user-reporting-dashboard.png");

  // Look for assigned tasks
  const taskCards = page.locator("[data-testid='task-card'], .task-card, .card").filter({
    hasText: /Due|Pending|Assigned/i,
  });

  if (
    await taskCards
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    console.log("Found reporting tasks...");
    await taskCards.first().click();
    await page.waitForTimeout(2000);
    await takeScreenshot("06-task-detail.png");
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
