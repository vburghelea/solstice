/**
 * Shared utilities for sin-uat evidence capture scripts.
 * Provides login helper, TOTP generation, and common functions.
 */

import { type Browser, type BrowserContext, type Page, chromium } from "@playwright/test";
import { authenticator } from "otplib";
import { mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// Configuration
export const config = {
  baseUrl: "https://sinuat.solsticeapp.ca",
  email: process.env["SIN_UAT_EMAIL"] ?? "viasport-staff@example.com",
  password: process.env["SIN_UAT_PASSWORD"] ?? "testpassword123",
  totpSecret:
    process.env["SIN_UI_TOTP_SECRET_BASE32"] ??
    "ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA",
  viewport: { width: 1440, height: 900 },
  evidenceDir: "docs/sin-rfp/review-plans/evidence/2026-01-10",
};

// Generate timestamp for file naming
export const getTimestamp = () =>
  new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").slice(0, 12);

// Get output directories
export const getScreenshotDir = (reqId: string) =>
  path.resolve(config.evidenceDir, "screenshots", reqId);

export const getVideoDir = () => path.resolve(config.evidenceDir, "videos");

// Wait for network idle
export const waitForIdle = async (page: Page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
};

// Generate fresh TOTP code
export const generateTOTP = () => authenticator.generate(config.totpSecret);

// Accept onboarding/privacy policy if shown
export const acceptOnboarding = async (page: Page) => {
  if (!page.url().includes("/onboarding")) return;

  const policyHeading = page.getByRole("heading", { name: "Privacy Policy" });
  if (!(await policyHeading.isVisible().catch(() => false))) return;

  const policyCheckbox = page.getByRole("checkbox", {
    name: /I have read and agree/i,
  });
  if (await policyCheckbox.isVisible().catch(() => false)) {
    await policyCheckbox.click();
  }

  const acceptButton = page.getByRole("button", { name: "Accept and Continue" });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
    await page.waitForURL(/\/dashboard\//, { timeout: 30_000 });
    return;
  }

  const continueButton = page.getByRole("button", { name: "Continue" });
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
    await page.waitForURL(/\/dashboard\//, { timeout: 30_000 });
  }
};

// Select organization if on select-org page
export const selectOrg = async (page: Page) => {
  if (!page.url().includes("/dashboard/select-org")) return;

  const combobox = page.getByRole("combobox");
  await combobox.waitFor({ state: "visible", timeout: 20_000 });
  await combobox.click();

  // Prefer BC Hockey or viaSport BC
  const preferredOption = page.getByRole("option", { name: /BC Hockey|viaSport BC/i });
  if (
    await preferredOption
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await preferredOption.first().click();
  } else {
    await page.getByRole("option").first().click();
  }

  await page.waitForURL((url) => !url.pathname.includes("/dashboard/select-org"), {
    timeout: 30_000,
  });
};

// Handle post-login navigation (onboarding, org selection)
export const settlePostLogin = async (page: Page) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (page.url().includes("/onboarding")) {
      await acceptOnboarding(page);
      continue;
    }
    if (page.url().includes("/dashboard/select-org")) {
      await selectOrg(page);
      continue;
    }
    break;
  }
};

// Complete full MFA login flow
export const login = async (page: Page) => {
  await page.context().clearCookies();
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(750);

  // Already logged in?
  if (page.url().includes("/dashboard") || page.url().includes("/onboarding")) {
    await settlePostLogin(page);
    return;
  }

  // Enter email
  await page.getByRole("textbox", { name: "Email" }).fill(config.email);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Continue" }).click();

  // Enter password
  await page.waitForTimeout(750);
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 60_000 });
  await passwordInput.fill(config.password);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Login" }).click();

  // Handle MFA if shown
  const authButton = page.getByRole("button", { name: "Authenticator code" });
  let nextStep: "auth" | "dashboard" | null = null;
  try {
    nextStep = await Promise.race([
      authButton
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => "auth" as const),
      page
        .waitForURL(/\/dashboard(\/select-org)?/, { timeout: 20_000 })
        .then(() => "dashboard" as const),
    ]);
  } catch {
    nextStep = null;
  }

  if (nextStep === "auth") {
    await authButton.click();
    const code = generateTOTP();
    await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Verify code" }).click();
    await page.waitForURL(/\/dashboard(\/select-org)?/, { timeout: 20_000 });
  } else if (nextStep !== "dashboard") {
    // Check for error toast
    const toast = await page.locator("[data-sonner-toast]").first().textContent();
    if (toast) {
      throw new Error(`Login failed: ${toast.trim()}`);
    }
    await page.waitForURL(/\/dashboard(\/select-org)?/, { timeout: 20_000 });
  }

  // Handle org selection
  await settlePostLogin(page);
};

// Complete step-up auth if shown
export const completeStepUpIfNeeded = async (
  page: Page,
  onVisible?: () => Promise<void>,
): Promise<boolean> => {
  const stepUpTitle = page.getByRole("heading", { name: "Confirm your identity" });
  const stepUpVisible = await stepUpTitle
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (!stepUpVisible) return false;

  if (onVisible) {
    await onVisible();
  }

  // Fill email if needed
  const emailInput = page.locator("#step-up-email");
  if (await emailInput.isVisible().catch(() => false)) {
    const isEnabled = await emailInput.isEnabled().catch(() => false);
    if (isEnabled) {
      await emailInput.fill(config.email);
    }
  }

  // Fill password if needed
  const passwordInput = page.locator("#step-up-password");
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(config.password);
  }

  // Click continue
  const continueButton = page.getByRole("button", { name: "Continue" });
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
  }

  // Enter TOTP code
  const codeInput = page.locator("#step-up-code");
  const codeVisible = await codeInput
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (codeVisible) {
    await page.getByRole("button", { name: "Authenticator code" }).click();
    const code = generateTOTP();
    await codeInput.fill(code);
    await page.getByRole("button", { name: "Verify" }).click();
  }

  // Check for errors
  const errorMessage = await page
    .locator(".text-destructive")
    .first()
    .textContent()
    .catch(() => null);
  if (errorMessage) {
    throw new Error(`Step-up failed: ${errorMessage.trim()}`);
  }

  await stepUpTitle.waitFor({ state: "hidden", timeout: 30_000 });
  return true;
};

// Create browser context with video recording
export const createRecordingContext = async (
  browser: Browser,
  videoDir: string,
): Promise<BrowserContext> => {
  await mkdir(videoDir, { recursive: true });
  return browser.newContext({
    viewport: config.viewport,
    recordVideo: { dir: videoDir, size: config.viewport },
    acceptDownloads: true,
  });
};

// Finalize video recording
export const finalizeVideo = async (
  page: Page,
  context: BrowserContext,
  browser: Browser,
  outputDir: string,
  outputName: string,
) => {
  await page.waitForTimeout(1500); // Let final state render
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath) {
    throw new Error("Video recording failed to save.");
  }

  const finalPath = path.join(outputDir, outputName);
  await rename(videoPath, finalPath);
  console.log(`Video saved to ${finalPath}`);
  return finalPath;
};

// Create screenshot helper
export const createScreenshotHelper = (page: Page, screenshotDir: string) => {
  return async (name: string) => {
    await mkdir(screenshotDir, { recursive: true });
    const filePath = path.join(screenshotDir, name);
    await page.screenshot({ path: filePath });
    console.log(`Screenshot saved: ${filePath}`);
    return filePath;
  };
};

// Safe navigation that handles ERR_ABORTED
export const safeGoto = async (page: Page, url: string) => {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) {
      throw error;
    }
  }
};

// Drag field to dropzone helper for analytics
export const dragTo = async (
  page: Page,
  sourceSelector: string | import("@playwright/test").Locator,
  targetSelector: string,
) => {
  const source =
    typeof sourceSelector === "string" ? page.locator(sourceSelector) : sourceSelector;
  const target = page.locator(targetSelector);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error(`Unable to drag to ${targetSelector}.`);
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
  );
  await page.mouse.up();
};

// Launch browser and setup for evidence capture
export const setupEvidenceCapture = async (reqId: string, recordVideo = true) => {
  const screenshotDir = getScreenshotDir(reqId);
  const videoDir = getVideoDir();

  await mkdir(screenshotDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = recordVideo
    ? await createRecordingContext(browser, videoDir)
    : await browser.newContext({
        viewport: config.viewport,
        acceptDownloads: true,
      });

  const page = await context.newPage();
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  return { browser, context, page, takeScreenshot, screenshotDir, videoDir };
};
