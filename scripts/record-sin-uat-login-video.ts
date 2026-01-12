#!/usr/bin/env tsx
/**
 * SEC-AGG-001: Auth + MFA badge + passkeys + active sessions walkthrough.
 */

import {
  config,
  createScreenshotHelper,
  finalizeVideo,
  getTimestamp,
  login,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "SEC-AGG-001";
const stamp = getTimestamp();
const videoName = `${reqId}-auth-mfa-login-flow-${stamp}.mp4`;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const { browser, context, page, videoDir, screenshotDir } =
    await setupEvidenceCapture(reqId);
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  console.log("Logging in with MFA...");
  await login(page);
  await waitForIdle(page);
  await takeScreenshot("00-dashboard-post-login.png");

  console.log("Opening settings...");
  await page.goto(`${config.baseUrl}/dashboard/settings`, { waitUntil: "networkidle" });
  await waitForIdle(page);

  // Look for MFA section - could be "Two-Factor Authentication" or "Multi-Factor Authentication"
  const mfaSection = page
    .getByText(/Two-Factor Authentication|Multi-Factor Authentication/i)
    .first();
  await mfaSection.waitFor({ timeout: 15_000 }).catch(() => {});
  await mfaSection.scrollIntoViewIfNeeded().catch(() => {});
  await wait(600);
  await takeScreenshot("01-mfa-section.png");

  console.log("Showing passkeys section...");
  const passkeysSection = page.getByText("Passkeys", { exact: true }).first();
  await passkeysSection.scrollIntoViewIfNeeded().catch(() => {});
  await wait(600);
  await takeScreenshot("02-passkeys.png");

  console.log("Showing active sessions...");
  const sessionsSection = page.getByText("Active Sessions", { exact: true }).first();
  await sessionsSection.scrollIntoViewIfNeeded().catch(() => {});
  await wait(600);
  await takeScreenshot("03-active-sessions.png");

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
