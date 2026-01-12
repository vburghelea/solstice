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

// Robust dashboard navigation with fallback
export const ensureDashboard = async (page: Page) => {
  const target = /\/dashboard(\/select-org)?/;
  try {
    await page.waitForURL(target, { timeout: 30_000 });
    return;
  } catch {
    // Fallback: force navigation and wait again (handles odd download intercepts)
    try {
      await safeGoto(page, `${config.baseUrl}/dashboard/sin`);
    } catch {
      // ignore and rely on final wait
    }
    await page.waitForURL(target, { timeout: 15_000 }).catch(() => {});
  }
};

// Complete full MFA login flow
export const login = async (page: Page) => {
  await page.context().clearCookies();
  console.log("Login: navigating to auth/login...");
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(750);

  // Already logged in?
  if (page.url().includes("/dashboard") || page.url().includes("/onboarding")) {
    await settlePostLogin(page);
    return;
  }

  // Enter email
  console.log("Login: entering email...");
  await page.getByRole("textbox", { name: "Email" }).fill(config.email);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Continue" }).click();

  // Enter password - wait for field to be ready
  await page.waitForTimeout(2000);
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(500);

  // Simple fill approach
  console.log("Login: filling password...");
  await passwordInput.fill(config.password);
  await page.waitForTimeout(800);

  // Verify and log
  const passwordValue = await passwordInput.inputValue();
  console.log(`Login: password length entered: ${passwordValue?.length ?? 0}`);
  if (!passwordValue) {
    console.log("Login: password empty, trying click + fill...");
    await passwordInput.click();
    await page.waitForTimeout(300);
    await passwordInput.fill(config.password);
    await page.waitForTimeout(500);
  }

  console.log("Login: submitting password...");
  console.log(`Login: current URL before click: ${page.url()}`);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForTimeout(2000);
  console.log(`Login: current URL after click: ${page.url()}`);

  // Give the MFA form time to render before racing
  await page.waitForTimeout(3000);

  const authChoiceButton = page.getByRole("button", { name: "Authenticator code" });
  const immediateCodeInput = page.getByRole("textbox", { name: "Authentication code" });
  if (await authChoiceButton.isVisible().catch(() => false)) {
    console.log("Login: authenticator choice visible immediately, completing MFA...");
    await authChoiceButton.click();
    await immediateCodeInput
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});
    if (await immediateCodeInput.isVisible().catch(() => false)) {
      const code = generateTOTP();
      await immediateCodeInput.fill(code);
      await page.getByRole("button", { name: /Verify/ }).click();
      await ensureDashboard(page);
      await settlePostLogin(page);
      return;
    }
  }

  // Handle MFA if shown - detect either MFA code input or dashboard URL
  const mfaCodeInput = page.getByRole("textbox", { name: "Authentication code" });
  let nextStep: "auth" | "dashboard" | null = null;
  try {
    nextStep = await Promise.race([
      mfaCodeInput
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(() => "auth" as const),
      page
        .waitForURL(/\/dashboard(\/select-org)?/, { timeout: 30_000 })
        .then(() => "dashboard" as const),
    ]);
  } catch {
    nextStep = null;
  }

  if (nextStep === "auth") {
    console.log("Login: MFA challenge visible, entering code...");
    const code = generateTOTP();
    await mfaCodeInput.fill(code);
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Verify code" }).click();
    await ensureDashboard(page);
  } else if (nextStep !== "dashboard") {
    console.log("Login: dashboard not reached yet, checking for errors...");
    console.log(`Login: page URL after wait: ${page.url()}`);
    // Save debug screenshot
    await page.screenshot({ path: "outputs/debug-login-failure.png" }).catch(() => {});
    // Check for inline error message first
    const inlineError = await page
      .locator(".text-destructive, .text-red-500, [role='alert']")
      .first()
      .textContent({ timeout: 3000 })
      .catch(() => null);
    console.log(`Login: inline error text: ${inlineError ?? "none"}`);
    if (inlineError && /invalid|incorrect|error/i.test(inlineError)) {
      throw new Error(`Login failed: ${inlineError.trim()}`);
    }
    // Check for error toast
    const toast = await page
      .locator("[data-sonner-toast]")
      .first()
      .textContent({ timeout: 3000 })
      .catch(() => null);
    console.log(`Login: toast text: ${toast ?? "none"}`);
    if (toast && /invalid|incorrect|error|failed/i.test(toast)) {
      throw new Error(`Login failed: ${toast.trim()}`);
    }
    await ensureDashboard(page);
  }

  // Handle org selection
  if (!page.url().includes("/dashboard")) {
    const authButton = page.getByRole("button", { name: "Authenticator code" });
    const codeInput = page.getByRole("textbox", { name: "Authentication code" });
    if (await authButton.isVisible().catch(() => false)) {
      console.log("Login: retrying MFA via authenticator button...");
      await authButton.click();
      await codeInput.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
      if (await codeInput.isVisible().catch(() => false)) {
        const code = generateTOTP();
        await codeInput.fill(code);
        await page.getByRole("button", { name: /Verify/ }).click();
        await ensureDashboard(page);
      }
    }
  }

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
    const message = error instanceof Error ? error.message : "";
    const allowed =
      message.includes("net::ERR_ABORTED") || message.includes("Download is starting");
    if (!allowed) {
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
type SetupOptions = {
  recordVideo?: boolean;
  recordLogin?: boolean;
};

export const setupEvidenceCapture = async (reqId: string, options: SetupOptions = {}) => {
  const recordVideo = options.recordVideo ?? true;
  const recordLogin = options.recordLogin ?? true;
  const screenshotDir = getScreenshotDir(reqId);
  const videoDir = getVideoDir();

  await mkdir(screenshotDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  await mkdir("outputs", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  // If we want to avoid recording login, authenticate in a temporary context,
  // persist storage state, then start a recorded context reusing that state.
  if (!recordLogin && recordVideo) {
    const storageStatePath = path.join(
      "outputs",
      `storage-${reqId}-${getTimestamp()}.json`,
    );

    const stagingContext = await browser.newContext({
      viewport: config.viewport,
      acceptDownloads: true,
    });
    const stagingPage = await stagingContext.newPage();
    await login(stagingPage);
    await waitForIdle(stagingPage);
    await settlePostLogin(stagingPage);
    await stagingContext.storageState({ path: storageStatePath });
    await stagingContext.close();

    const recordedContext = await browser.newContext({
      viewport: config.viewport,
      acceptDownloads: true,
      storageState: storageStatePath,
      recordVideo: { dir: videoDir, size: config.viewport },
    });

    const page = await recordedContext.newPage();
    const takeScreenshot = createScreenshotHelper(page, screenshotDir);
    await safeGoto(page, `${config.baseUrl}/dashboard`);
    await settlePostLogin(page);
    await waitForIdle(page);

    return {
      browser,
      context: recordedContext,
      page,
      takeScreenshot,
      screenshotDir,
      videoDir,
    };
  }

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
