#!/usr/bin/env tsx
/**
 * Verify SIN end-user submission tracking flow.
 */

import { chromium } from "@playwright/test";
import { authenticator } from "otplib";

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const debug = process.env["SIN_UI_DEBUG"] === "true";
const email = process.env["SIN_UI_EMAIL"] ?? "austinwallacetech@gmail.com";
const password = process.env["SIN_UI_PASSWORD"] ?? "testpassword123";
const totpSecret = process.env["SIN_UI_TOTP_SECRET"] ?? "JJBFGV2ZGNCFARKIKBFTGUCYKA";
const defaultOrgId =
  process.env["SIN_UI_ORG_ID"] ?? "a0000000-0000-4000-8001-000000000002";
const formId = process.env["SIN_UI_FORM_ID"] ?? "a0000000-0000-4000-8002-000000000002";

const numericFields = [
  "Revenue - Grants",
  "Revenue - Membership Fees",
  "Revenue - Events",
  "Expenses - Programs",
  "Expenses - Administration",
  "Expenses - Facilities",
];

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
    page.on("response", (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes("server") || url.includes("_server")) {
          console.error(`[network ${response.status()}] ${url}`);
        }
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

  console.log("Logging in for SIN form submission verification...");
  await login(page);
  if (debug) {
    try {
      const sessionResponse = await page.request.get(`${baseUrl}/api/auth/get-session`);
      const sessionText = await sessionResponse.text();
      console.log("session status", sessionResponse.status(), sessionText.slice(0, 200));
    } catch (error) {
      console.error("session check failed", error);
    }
  }

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

  await safeGoto(`${baseUrl}/dashboard/sin/forms`);
  await page.getByRole("heading", { name: "Forms" }).waitFor({ timeout: 20_000 });
  const selectOrgPrompt = page.getByText(
    "Select an organization to view assigned forms.",
  );
  if (await selectOrgPrompt.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Choose organization" }).click();
    await selectOrg(page);
    await safeGoto(`${baseUrl}/dashboard/sin/forms`);
  }
  await page.getByText("Quarterly Financial Summary").waitFor({ timeout: 20_000 });
  await safeGoto(`${baseUrl}/dashboard/sin/forms/${formId}`);
  await page.waitForURL(/\/dashboard\/sin\/forms\//, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");

  const notFound = page.getByText("Form not found.");
  if (await notFound.isVisible().catch(() => false)) {
    throw new Error("Form not found after navigation.");
  }

  const submitHeader = page.getByText("Submit response", { exact: true });
  const submitVisible = await submitHeader
    .waitFor({ timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (!submitVisible) {
    if (debug) {
      const snapshot = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((node) =>
          node.textContent?.trim(),
        );
        const bodyText = document.body?.innerText?.slice(0, 200);
        return { url: window.location.href, headings, bodyText };
      });
      console.error("[form submission debug]", snapshot);
    }
    throw new Error("Submit response section not visible.");
  }

  for (const label of numericFields) {
    const input = page.getByLabel(label);
    await input.fill("100");
  }

  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForTimeout(1_000);
  await page.reload({ waitUntil: "domcontentloaded" });

  await page
    .getByText("Submission history", { exact: true })
    .waitFor({ timeout: 20_000 });
  const submissionEntry = page.getByText(/Submission [a-f0-9]{8}/i).first();
  await submissionEntry.waitFor({ timeout: 20_000 });

  const viewDetails = page.getByRole("link", { name: "View details" }).first();
  await viewDetails.click();
  await page
    .getByRole("heading", { name: "Submission details" })
    .waitFor({ timeout: 20_000 });

  await browser.close();
  console.log("SIN form submission verification complete.");
}

run().catch((error) => {
  console.error("SIN form submission verification failed:", error);
  process.exit(1);
});
