#!/usr/bin/env tsx
/**
 * Run automated WCAG checks with axe-core using Playwright.
 *
 * Usage:
 *   npx tsx scripts/run-sin-a11y-scan.ts
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { authenticator } from "otplib";

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
// Credentials must be provided via environment variables (no defaults for security)
const email = requireEnv("SIN_A11Y_EMAIL");
const password = requireEnv("SIN_A11Y_PASSWORD");
// TOTP secret for 2FA - base32-encoded (e.g., YOUR_TOTP_SECRET)
const totpSecret = requireEnv("SIN_A11Y_TOTP_SECRET");
const axeCdnUrl = "https://cdn.jsdelivr.net/npm/axe-core@4.11.0/axe.min.js";

const pagesToScan = [
  { name: "login", url: `${baseUrl}/auth/login`, requiresAuth: false },
  { name: "sin-dashboard", url: `${baseUrl}/dashboard/sin`, requiresAuth: true },
  {
    name: "sin-reporting",
    url: `${baseUrl}/dashboard/sin/reporting`,
    requiresAuth: true,
  },
  { name: "sin-imports", url: `${baseUrl}/dashboard/sin/imports`, requiresAuth: true },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function completeOnboardingIfNeeded(page: import("@playwright/test").Page) {
  if (!page.url().includes("/onboarding")) return;

  const policyHeading = page.getByRole("heading", { name: "Privacy Policy" });
  if (!(await policyHeading.isVisible().catch(() => false))) {
    return;
  }

  const policyLabel = page.getByLabel(/I have read and agree/i);
  if (await policyLabel.isVisible().catch(() => false)) {
    await policyLabel.click();
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
}

async function selectOrgIfNeeded(page: import("@playwright/test").Page) {
  if (!page.url().includes("/dashboard/select-org")) return;

  const combobox = page.getByRole("combobox");
  await combobox.click();
  const preferredOption = page.getByRole("option", { name: "BC Hockey" });
  if (await preferredOption.isVisible().catch(() => false)) {
    await preferredOption.click();
  } else {
    await page.getByRole("option").nth(1).click();
  }
  await page.waitForURL(/\/dashboard\//, { timeout: 30_000 });
}

async function settlePostLogin(page: import("@playwright/test").Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (page.url().includes("/onboarding")) {
      await completeOnboardingIfNeeded(page);
      continue;
    }

    if (page.url().includes("/dashboard/select-org")) {
      await selectOrgIfNeeded(page);
      continue;
    }

    break;
  }
}

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/dashboard") || page.url().includes("/onboarding")) {
    await settlePostLogin(page);
    return;
  }

  const loginForm = page.getByTestId("login-form");
  await loginForm.waitFor({ state: "visible", timeout: 20_000 });
  await page
    .locator('[data-testid="login-form"][data-hydrated="true"]')
    .waitFor({ state: "visible", timeout: 20_000 });

  const emailField = page.getByTestId("login-email");
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
  } else {
    await settlePostLogin(page);
    return;
  }

  const twoFactorForm = page.getByTestId("login-2fa-form");
  let requiresTwoFactor = false;
  try {
    await twoFactorForm.waitFor({ state: "visible", timeout: 10_000 });
    requiresTwoFactor = true;
  } catch {
    requiresTwoFactor = false;
  }

  if (requiresTwoFactor) {
    await page.getByRole("button", { name: "Authenticator code" }).click();
    const code = authenticator.generate(totpSecret);
    await page.getByTestId("login-2fa-code").fill(code);
    await page.getByRole("button", { name: "Verify code" }).click();
  }

  await page.waitForURL(/\/(dashboard|onboarding)\//, { timeout: 30_000 });
  await settlePostLogin(page);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  const results: Record<string, unknown> = {};
  const axeResponse = await fetch(axeCdnUrl);
  if (!axeResponse.ok) {
    throw new Error(`Failed to download axe-core: ${axeResponse.statusText}`);
  }
  const axeSource = await axeResponse.text();

  for (const target of pagesToScan) {
    console.log(`Scanning ${target.name}...`);
    if (target.requiresAuth) {
      await login(page);
    }
    try {
      await page.goto(target.url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) {
        throw error;
      }
    }

    await page
      .waitForURL(new RegExp(escapeRegExp(target.url)), { timeout: 30_000 })
      .catch(() => undefined);

    await page.addScriptTag({ content: axeSource });

    const scan = await page.evaluate(async () => {
      const axeHandle = (window as { axe?: { run: () => Promise<unknown> } }).axe;
      if (!axeHandle) {
        throw new Error("axe-core failed to load on the page.");
      }
      return await axeHandle.run();
    });

    results[target.name] = scan;
    console.log(`✓ Completed ${target.name}`);
  }

  await browser.close();

  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const outputPath = join(
    process.cwd(),
    "docs/sin-rfp/review-plans/evidence",
    `a11y-scan-${stamp}.json`,
  );

  await writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`A11y results saved to ${outputPath}`);
}

run().catch((error) => {
  console.error("A11y scan failed:", error);
  process.exit(1);
});
