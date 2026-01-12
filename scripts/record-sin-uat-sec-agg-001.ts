#!/usr/bin/env tsx
/**
 * SEC-AGG-001: Record complete MFA login flow video with settings page.
 * Shows MFA login, then settings page with MFA badge, passkeys, and sessions.
 */

import {
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

const reqId = "SEC-AGG-001";
const stamp = getTimestamp();
const videoName = `${reqId}-auth-mfa-login-flow-${stamp}.mp4`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  // Setup with video recording including login
  const { browser, context, page, videoDir, screenshotDir } = await setupEvidenceCapture(
    reqId,
    { recordLogin: true },
  );
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  // Login (recorded in video) - handles MFA automatically
  console.log("Starting MFA login flow...");
  await login(page);
  await waitForIdle(page);

  // Handle org selection if needed
  if (page.url().includes("/select-org")) {
    console.log("Selecting organization...");
    await selectOrg(page);
    await waitForIdle(page);
  }

  // Capture dashboard briefly
  console.log("Capturing dashboard...");
  await wait(1000);
  await takeScreenshot("01-post-login-dashboard.png");

  // Navigate to settings via sidebar (avoid direct URL issues)
  console.log("Navigating to settings...");
  const settingsLink = page.getByRole("link", { name: /Settings/i });
  if (await settingsLink.isVisible().catch(() => false)) {
    await settingsLink.click();
  } else {
    await safeGoto(page, `${config.baseUrl}/dashboard/settings`);
  }
  await waitForIdle(page);
  await wait(800);
  await takeScreenshot("02-settings-page.png");

  // Find and scroll to Two-Factor Authentication section
  console.log("Capturing MFA enabled badge...");
  const mfaSection = page.getByText("Two-Factor Authentication").first();
  if (await mfaSection.isVisible().catch(() => false)) {
    await mfaSection.scrollIntoViewIfNeeded();
    await wait(600);
    await takeScreenshot("03-mfa-enabled-badge.png");
  }

  // Find Passkeys section
  console.log("Capturing passkeys section...");
  const passkeySection = page.getByText("Passkeys").first();
  if (await passkeySection.isVisible().catch(() => false)) {
    await passkeySection.scrollIntoViewIfNeeded();
    await wait(600);
    await takeScreenshot("04-passkeys-section.png");
  }

  // Find Active Sessions section
  console.log("Capturing active sessions...");
  const sessionsSection = page.getByText("Active sessions").first();
  if (await sessionsSection.isVisible().catch(() => false)) {
    await sessionsSection.scrollIntoViewIfNeeded();
    await wait(600);
    await takeScreenshot("05-active-sessions.png");
  }

  // Scroll back to top for final view
  await page.mouse.wheel(0, -1000);
  await wait(500);

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
