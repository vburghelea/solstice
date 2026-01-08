#!/usr/bin/env tsx
/**
 * Verify SIN data catalog entries render in admin UI.
 */

import { chromium } from "@playwright/test";
import { authenticator } from "otplib";

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const email = process.env["SIN_UI_EMAIL"] ?? "viasport-staff@example.com";
const password = process.env["SIN_UI_PASSWORD"] ?? "testpassword123";
const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required for MFA login.`);
  }
  return value;
};
const totpSecret = requireEnv("SIN_UI_TOTP_SECRET");
const defaultOrgId =
  process.env["SIN_UI_ORG_ID"] ?? "a0000000-0000-4000-8001-000000000002";

async function acceptOnboarding(page: import("@playwright/test").Page) {
  if (!page.url().includes("/onboarding")) return;

  const policyHeading = page.getByRole("heading", { name: "Privacy Policy" });
  if (!(await policyHeading.isVisible().catch(() => false))) {
    return;
  }

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
}

async function selectOrg(page: import("@playwright/test").Page) {
  if (!page.url().includes("/dashboard/select-org")) return;

  const combobox = page.getByRole("combobox");
  await combobox.waitFor({ state: "visible", timeout: 20_000 });
  await combobox.click();
  const preferredOption = page.getByRole("option", { name: "BC Hockey" });
  if (await preferredOption.isVisible().catch(() => false)) {
    await preferredOption.click();
  } else {
    await page.getByRole("option").nth(1).click();
  }
  await page.waitForURL((url) => !url.pathname.includes("/dashboard/select-org"), {
    timeout: 30_000,
  });
}

async function settlePostLogin(page: import("@playwright/test").Page) {
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
}

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/dashboard") || page.url().includes("/onboarding")) {
    await settlePostLogin(page);
    return;
  }

  await page
    .locator('[data-testid="login-form"][data-hydrated="true"]')
    .waitFor({ state: "visible", timeout: 20_000 });

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByRole("button", { name: "Login", exact: true }).click();

  const twoFactorForm = page.getByTestId("login-2fa-form");
  try {
    await twoFactorForm.waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "Authenticator code" }).click();
    const code = authenticator.generate(totpSecret);
    await page.getByTestId("login-2fa-code").fill(code);
    await page.getByRole("button", { name: "Verify code" }).click();
  } catch {
    // No 2FA required.
  }

  await page.waitForURL(/\/(dashboard|onboarding)\//, {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });
  await settlePostLogin(page);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const safeGoto = async (url: string) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) {
        throw error;
      }
    }
  };

  console.log("Logging in for data catalog verification...");
  await login(page);

  await context.addCookies([
    {
      name: "active_org_id",
      value: defaultOrgId,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.evaluate(
    (orgId) => window.localStorage.setItem("active_org_id", orgId),
    defaultOrgId,
  );

  await safeGoto(`${baseUrl}/dashboard/admin/sin/data-catalog`);
  await page.getByText("Data catalog", { exact: true }).waitFor({ timeout: 20_000 });

  const noEntries = page.getByText("No catalog entries yet.");
  if (await noEntries.isVisible().catch(() => false)) {
    throw new Error("Data catalog has no entries.");
  }

  await page.getByRole("table").waitFor({ timeout: 20_000 });

  await browser.close();
  console.log("Data catalog verification complete.");
}

run().catch((error) => {
  console.error("Data catalog verification failed:", error);
  process.exit(1);
});
