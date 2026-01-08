#!/usr/bin/env tsx
/**
 * Verify SIN gap UI surfaces (templates, tours, search, submission files).
 */

import { chromium } from "@playwright/test";
import { authenticator } from "otplib";

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const debug = process.env["SIN_UI_DEBUG"] === "true";
const email = process.env["SIN_UI_EMAIL"] ?? "pso-admin@example.com";
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
const submissionId =
  process.env["SIN_UI_SUBMISSION_ID"] ?? "a0000000-0000-4000-8007-000000000002";

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
  if (debug) {
    page.on("console", (message) => {
      if (message.type() === "error") {
        console.error(`[browser console] ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      console.error(`[browser error] ${error.message}`);
    });
  }
  const safeGoto = async (url: string) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) {
        throw error;
      }
    }
  };

  console.log("Logging in for SIN UI verification...");
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

  const failures: string[] = [];
  const runCheck = async (label: string, fn: () => Promise<void>) => {
    console.log(`Checking ${label}...`);
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${label}: ${message}`);
      console.error(`[${label}] ${message}`);
    }
  };

  await runCheck("templates", async () => {
    await safeGoto(`${baseUrl}/dashboard/sin/templates?context=reporting`);
    await page.getByRole("heading", { name: "Templates" }).waitFor({ timeout: 20_000 });
    const orgPrompt = page.getByText("Select an organization to view templates.");
    if (await orgPrompt.isVisible().catch(() => false)) {
      const chooseOrg = page.getByRole("button", { name: "Choose organization" });
      if (await chooseOrg.isVisible().catch(() => false)) {
        await chooseOrg.click();
      }
      await selectOrg(page);
      await safeGoto(`${baseUrl}/dashboard/sin/templates?context=reporting`);
    }
    const loadingTemplates = page.getByText("Loading templates…");
    if (await loadingTemplates.isVisible().catch(() => false)) {
      await loadingTemplates.waitFor({ state: "hidden", timeout: 20_000 });
    }
    const noTemplates = page.getByText("No templates available.");
    if (await noTemplates.isVisible().catch(() => false)) {
      throw new Error("Templates missing on /dashboard/sin/templates.");
    }
    const templateDownload = page.getByRole("button", { name: "Download" });
    const downloadCount = await templateDownload.count();
    if (downloadCount === 0) {
      throw new Error("No template download buttons found.");
    }
  });

  await runCheck("guided walkthroughs", async () => {
    await safeGoto(`${baseUrl}/dashboard/sin`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    const startTour = page.getByRole("button", { name: "Start tour" }).first();
    const resumeTour = page.getByRole("button", { name: "Resume tour" }).first();
    const startVisible = await startTour
      .waitFor({ state: "visible", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (startVisible) {
      await startTour.click();
    } else {
      const resumeVisible = await resumeTour
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (!resumeVisible) {
        throw new Error("No guided tour start/resume button found.");
      }
      await resumeTour.click();
    }
    await page.waitForTimeout(500);
    const exitTour = page.getByRole("button", { name: "Exit tour" });
    const exitVisible = await exitTour
      .waitFor({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!exitVisible) {
      if (debug) {
        const snapshot = await page.evaluate(() => {
          const buttonTexts = Array.from(document.querySelectorAll("button"))
            .map((button) => button.textContent?.trim())
            .filter(Boolean);
          return {
            url: window.location.href,
            buttonTexts: buttonTexts.slice(0, 12),
            hasTourOverlay: Boolean(
              document.querySelector("div.fixed[style*='box-shadow']") ||
              document.querySelector("div.fixed.inset-0"),
            ),
          };
        });
        console.error("[guided walkthroughs debug]", snapshot);
      }
      throw new Error("Exit tour button not found after starting tour.");
    }
    await exitTour.click();
  });

  await runCheck("global search", async () => {
    await page.mouse.click(10, 10);
    await page.keyboard.press("Control+K");
    await page
      .getByPlaceholder("Search actions, templates, forms, and more...")
      .waitFor({ timeout: 10_000 });
    await page.keyboard.press("Escape");
  });

  await runCheck("submission files", async () => {
    await safeGoto(`${baseUrl}/dashboard/sin/submissions/${submissionId}`);
    const currentUrl = page.url();
    if (!currentUrl.includes(`/dashboard/sin/submissions/${submissionId}`)) {
      throw new Error(`Redirected to ${currentUrl}`);
    }
    const submissionHeading = page.getByRole("heading", {
      name: "Submission details",
    });
    const submissionFound = await submissionHeading
      .waitFor({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!submissionFound) {
      const notFound = page.getByText("Submission not found.");
      if (await notFound.isVisible().catch(() => false)) {
        throw new Error("Submission not found.");
      }
      throw new Error("Submission details page did not load.");
    }
    await page.getByText("Files", { exact: true }).waitFor({ timeout: 10_000 });
    await page.waitForLoadState("networkidle");
    const fileName = page.getByText("supporting-docs.txt");
    const fileVisible = await fileName
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!fileVisible) {
      const noFiles = page.getByText("No files uploaded.");
      if (await noFiles.isVisible().catch(() => false)) {
        throw new Error("Submission shows no files uploaded.");
      }
      throw new Error("Submission files did not render.");
    }
    await page.getByRole("button", { name: "Replace" }).first().waitFor({
      timeout: 10_000,
    });
    const deleteButton = page.getByRole("button", { name: "Delete" }).first();
    await deleteButton.waitFor({ timeout: 10_000 });
    await deleteButton.click();
    await page.getByRole("button", { name: "Delete file" }).waitFor({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  await browser.close();
  if (failures.length > 0) {
    throw new Error(`SIN UI checks failed: ${failures.join(" | ")}`);
  }
  console.log("SIN UI verification complete.");
}

run().catch((error) => {
  console.error("SIN UI verification failed:", error);
  process.exit(1);
});
