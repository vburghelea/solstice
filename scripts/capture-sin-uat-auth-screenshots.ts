import { chromium } from "@playwright/test";
import { authenticator } from "otplib";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = "https://sinuat.solsticeapp.ca";
const email = process.env["SIN_UAT_EMAIL"] ?? "viasport-staff@example.com";
const password = process.env["SIN_UAT_PASSWORD"] ?? "testpassword123";
const totpSecret =
  process.env["SIN_UI_TOTP_SECRET_BASE32"] ??
  "ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA";

const outputDir = path.resolve(
  "docs/sin-rfp/review-plans/evidence/2026-01-10/screenshots/SEC-AGG-001",
);

const waitForIdle = async (page: import("@playwright/test").Page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
};

const run = async () => {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.context().clearCookies();

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outputDir, "01-login-email-entry.png") });
  await page.getByRole("button", { name: "Continue" }).click();

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ timeout: 60000 });
  await passwordInput.fill(password);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("button", { name: "Authenticator code" }).waitFor();
  await page.getByRole("button", { name: "Authenticator code" }).click();
  await page.screenshot({ path: path.join(outputDir, "02-mfa-totp-challenge.png") });

  const code = authenticator.generate(totpSecret);
  await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Verify code" }).click();

  await page.waitForURL(/\/dashboard(\/select-org)?/, { timeout: 20000 });
  if (page.url().includes("/dashboard/select-org")) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
  }

  await waitForIdle(page);
  await page.screenshot({ path: path.join(outputDir, "03-post-login-dashboard.png") });

  await page.goto(`${baseUrl}/dashboard/settings`, { waitUntil: "domcontentloaded" });
  await page
    .getByText(/Multi-factor authentication|MFA/i)
    .first()
    .waitFor({
      timeout: 20000,
    });
  await waitForIdle(page);
  await page.screenshot({ path: path.join(outputDir, "04-mfa-status-settings.png") });

  await context.close();
  await browser.close();
};

run().catch((error) => {
  console.error("Auth screenshot capture failed:", error);
  process.exit(1);
});
