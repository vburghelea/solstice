#!/usr/bin/env tsx
/**
 * Verify analytics pivot build + export with Playwright.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { authenticator } from "otplib";

const baseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const debug = process.env["SIN_ANALYTICS_DEBUG"] === "true";
const email = process.env["SIN_ANALYTICS_EMAIL"] ?? "viasport-staff@example.com";
const password = process.env["SIN_ANALYTICS_PASSWORD"] ?? "testpassword123";
const totpSecret =
  process.env["SIN_ANALYTICS_TOTP_SECRET"] ?? "JJBFGV2ZGNCFARKIKBFTGUCYKA";
const defaultOrgId =
  process.env["SIN_ANALYTICS_ORG_ID"] ?? "a0000000-0000-4000-8001-000000000002";

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
  const cookies = await page.context().cookies();
  const activeCookie = cookies.find((cookie) => cookie.name === "active_org_id");
  console.log(
    `Selected org; now at ${page.url()} (cookie=${activeCookie?.value ?? "none"})`,
  );
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
  const activeOrg = await page.evaluate(() =>
    window.localStorage.getItem("active_org_id"),
  );
  console.log(`Active org after login: ${activeOrg ?? "none"}`);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const logSessionTimes = async (label: string) => {
    if (!debug) return;
    try {
      const response = await page.request.get(`${baseUrl}/api/auth/get-session`);
      const raw = await response.text();
      console.log(`${label} session status`, response.status());
      let payload: Record<string, unknown> | null = null;
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        console.log(`${label} session raw`, raw.slice(0, 200));
      }
      if (!payload) return;
      const session =
        (payload?.["data"] as { session?: Record<string, unknown> } | undefined)
          ?.session ??
        (payload?.["session"] as Record<string, unknown> | undefined) ??
        payload ??
        {};
      const user = (payload?.["user"] as Record<string, unknown> | undefined) ?? null;
      const nestedSession = (session as Record<string, unknown>)["session"] as
        | Record<string, unknown>
        | undefined;
      console.log(`${label} session keys`, {
        payloadKeys: payload ? Object.keys(payload) : [],
        sessionKeys: session ? Object.keys(session) : [],
        nestedSessionKeys: nestedSession ? Object.keys(nestedSession) : [],
        userKeys: user ? Object.keys(user) : [],
      });
      const pick = (source: Record<string, unknown> | undefined, key: string) =>
        source ? source[key] : undefined;
      console.log(`${label} session times`, {
        authenticatedAt: pick(session as Record<string, unknown>, "authenticatedAt"),
        createdAt: pick(session as Record<string, unknown>, "createdAt"),
        lastMfaVerifiedAt: pick(session as Record<string, unknown>, "lastMfaVerifiedAt"),
        mfaVerifiedAt: pick(session as Record<string, unknown>, "mfaVerifiedAt"),
        last_mfa_verified_at: pick(
          session as Record<string, unknown>,
          "last_mfa_verified_at",
        ),
        mfa_verified_at: pick(session as Record<string, unknown>, "mfa_verified_at"),
        nested_authenticatedAt: pick(nestedSession, "authenticatedAt"),
        nested_lastMfaVerifiedAt: pick(nestedSession, "lastMfaVerifiedAt"),
        nested_mfa_verified_at: pick(nestedSession, "mfa_verified_at"),
      });
    } catch (error) {
      console.log(`${label} session times unavailable`, error);
    }
  };
  const safeGoto = async (url: string) => {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) {
        throw error;
      }
    }
  };
  const dragTo = async (sourceSelector: string, targetSelector: string) => {
    const source = page.locator(sourceSelector);
    const target = page.locator(targetSelector);
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error(`Unable to drag from ${sourceSelector} to ${targetSelector}.`);
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
  const completeStepUpIfNeeded = async () => {
    const stepUpTitle = page.getByRole("heading", { name: "Confirm your identity" });
    const stepUpVisible = await stepUpTitle
      .waitFor({ state: "visible", timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!stepUpVisible) {
      return false;
    }

    const emailInput = page.locator("#step-up-email");
    if (await emailInput.isVisible().catch(() => false)) {
      const isEnabled = await emailInput.isEnabled().catch(() => false);
      if (isEnabled) {
        await emailInput.fill(email);
      } else {
        await emailInput.waitFor({ state: "visible", timeout: 5_000 });
      }
    }

    const passwordInput = page.locator("#step-up-password");
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(password);
    }
    const continueButton = page.getByRole("button", { name: "Continue" });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }

    const codeInput = page.locator("#step-up-code");
    const codeVisible = await codeInput
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (codeVisible) {
      await page.getByRole("button", { name: "Authenticator code" }).click();
      const code = authenticator.generate(totpSecret);
      await codeInput.fill(code);
      await page.getByRole("button", { name: "Verify" }).click();
    }

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

  console.log("Logging in for analytics verification...");
  await login(page);
  await logSessionTimes("post-login");

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
  console.log(`Active org forced to ${defaultOrgId}`);

  console.log("Opening analytics explore...");
  await safeGoto(`${baseUrl}/dashboard/analytics/explore`);
  console.log(`Analytics URL: ${page.url()}`);
  if (page.url().includes("/onboarding")) {
    console.log("Completing onboarding before analytics access...");
    await acceptOnboarding(page);
    await safeGoto(`${baseUrl}/dashboard/analytics/explore`);
    console.log(`Analytics URL after onboarding: ${page.url()}`);
  }

  const accessRequiredText = page.getByText("Analytics access required", { exact: true });
  const datasetCombo = page.getByRole("combobox").first();
  try {
    await datasetCombo.waitFor({ state: "visible", timeout: 20_000 });
  } catch (error) {
    if (await accessRequiredText.isVisible().catch(() => false)) {
      throw new Error("Analytics access required for current user/org.");
    }
    throw error;
  }
  await datasetCombo.click();
  const datasetOption = page.getByRole("option", { name: "Organizations" });
  if (await datasetOption.isVisible().catch(() => false)) {
    await datasetOption.click();
  }
  await page.keyboard.press("Escape");

  console.log("Building pivot...");
  const fieldsLocator = page.locator("[data-testid^=field-]");
  try {
    await fieldsLocator.first().waitFor({ state: "visible", timeout: 20_000 });
  } catch (error) {
    const accessRequired = page.getByText("Analytics access required", { exact: true });
    if (await accessRequired.isVisible().catch(() => false)) {
      throw new Error("Analytics access required for current user/org.");
    }
    throw error;
  }
  await page.getByTestId("field-name").waitFor({ state: "visible", timeout: 20_000 });
  await dragTo("[data-testid=field-name] span", "[data-testid=rows-dropzone]");
  await dragTo("[data-testid=field-id] span", "[data-testid=measures-dropzone]");

  const rowCount = await page
    .locator("[data-testid=rows-dropzone] [data-testid^=field-]")
    .count();
  const measureCount = await page
    .locator("[data-testid=measures-dropzone] [data-testid^=field-]")
    .count();
  if (rowCount === 0 || measureCount === 0) {
    throw new Error(`Drag/drop failed (rows=${rowCount}, measures=${measureCount}).`);
  }

  await page.getByRole("button", { name: "Run query" }).click();
  try {
    const toastLocator = page.locator("[data-sonner-toast]");
    const toastText = await toastLocator
      .first()
      .textContent({ timeout: 5_000 })
      .catch(() => null);
    if (toastText && /failed|error/i.test(toastText)) {
      throw new Error(`Pivot query failed: ${toastText.trim()}`);
    }
    await page.getByTestId("pivot-table").waitFor({ timeout: 30_000 });
  } catch (error) {
    const toast = page.getByText(
      /Failed to run pivot|Organization context required|Organization context mismatch|Organization access required|Insufficient organization role|Select a dataset|Add at least one measure/i,
    );
    const toastText = await toast.textContent().catch(() => null);
    if (toastText) {
      throw new Error(`Pivot query failed: ${toastText.trim()}`);
    }
    throw error;
  }

  console.log("Exporting CSV...");
  const exportRequests: string[] = [];
  const exportResponses: string[] = [];
  type ExportPayload = {
    data: string;
    fileName: string;
    encoding?: "base64" | "utf-8";
  };
  const decodeTransport = (value: unknown): unknown => {
    if (!value || typeof value !== "object") return value;
    const record = value as {
      t?: number;
      s?: unknown;
      a?: unknown[];
      p?: { k?: unknown[]; v?: unknown[] };
    };
    if (typeof record.t !== "number") return value;
    switch (record.t) {
      case 1:
        return record.s ?? "";
      case 2:
        return null;
      case 9:
        return (record.a ?? []).map((item) => decodeTransport(item));
      case 10: {
        const keys = record.p?.k ?? [];
        const values = record.p?.v ?? [];
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < keys.length; i += 1) {
          const rawKey = keys[i];
          const key =
            typeof rawKey === "string" ? rawKey : String(decodeTransport(rawKey));
          obj[key] = decodeTransport(values[i]);
        }
        return obj;
      }
      default:
        return value;
    }
  };
  const requestHandler = (request: import("@playwright/test").Request) => {
    const url = request.url();
    const method = request.method();
    if (method === "POST") {
      exportRequests.push(`${method} ${url}`);
    }
  };
  const responseHandler = (response: import("@playwright/test").Response) => {
    const url = response.url();
    const method = response.request().method();
    if (method === "POST") {
      exportResponses.push(`${response.status()} ${url}`);
    }
  };
  const logExportDiagnostics = () => {
    if (!debug) return;
    if (exportRequests.length > 0) {
      console.log(`Export requests: ${exportRequests.join(", ")}`);
    }
    if (exportResponses.length > 0) {
      console.log(`Export responses: ${exportResponses.join(", ")}`);
    }
  };
  page.on("request", requestHandler);
  page.on("response", responseHandler);
  const extractPayload = (value: unknown): ExportPayload | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (typeof record["fileName"] === "string" && typeof record["data"] === "string") {
      return record as ExportPayload;
    }
    if (record["result"]) {
      const nested = extractPayload(record["result"]);
      if (nested) return nested;
    }
    if (record["data"] && typeof record["data"] === "object") {
      const nested = extractPayload(record["data"]);
      if (nested) return nested;
    }
    return null;
  };
  const extractErrorMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const errorCandidate =
      (record["error"] as { message?: unknown } | undefined)?.message ??
      (record["details"] as { message?: unknown } | undefined)?.message ??
      (record["data"] as { error?: { message?: unknown } } | undefined)?.error?.message;
    if (typeof errorCandidate === "string" && errorCandidate.trim()) {
      return errorCandidate;
    }
    return null;
  };
  const waitForExportPayload = (timeoutMs: number) =>
    new Promise<ExportPayload>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        page.off("response", handler);
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Export response not captured."));
      }, timeoutMs);
      const handler = async (response: import("@playwright/test").Response) => {
        if (response.request().method() !== "POST") return;
        const text = await response.text().catch(() => null);
        if (!text) return;
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          return;
        }
        const decoded = decodeTransport(parsed);
        const payload = extractPayload(decoded);
        if (payload) {
          cleanup();
          resolve(payload);
          return;
        }
        const errorMessage = extractErrorMessage(decoded);
        if (errorMessage) {
          cleanup();
          reject(new Error(errorMessage));
        }
      };
      page.on("response", handler);
    });
  const triggerExport = async (timeoutMs: number) => {
    const payloadPromise = waitForExportPayload(timeoutMs);
    await page.getByRole("button", { name: "Export CSV" }).click({ force: true });
    return payloadPromise;
  };

  let exportPayload: ExportPayload;
  try {
    exportPayload = await triggerExport(8_000);
  } catch (error) {
    if (await completeStepUpIfNeeded()) {
      try {
        exportPayload = await triggerExport(30_000);
      } catch (innerError) {
        page.off("request", requestHandler);
        page.off("response", responseHandler);
        logExportDiagnostics();
        throw innerError;
      }
    } else {
      page.off("request", requestHandler);
      page.off("response", responseHandler);
      logExportDiagnostics();
      throw error;
    }
  }
  page.off("request", requestHandler);
  page.off("response", responseHandler);
  if (exportRequests.length === 0) {
    throw new Error("Export action did not trigger a network request.");
  }
  logExportDiagnostics();

  if (!exportPayload.data || !exportPayload.fileName) {
    throw new Error("Export payload missing data.");
  }

  const buffer =
    exportPayload.encoding === "base64"
      ? Buffer.from(exportPayload.data, "base64")
      : Buffer.from(exportPayload.data, "utf8");
  if (buffer.length === 0) {
    throw new Error("Export payload was empty.");
  }

  await mkdir("outputs", { recursive: true });
  const outputPath = `outputs/${exportPayload.fileName}`;
  await writeFile(outputPath, buffer);

  await browser.close();

  console.log(`Analytics export saved to ${outputPath}`);
}

run().catch((error) => {
  console.error("Analytics verification failed:", error);
  process.exit(1);
});
