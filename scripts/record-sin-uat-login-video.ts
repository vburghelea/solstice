import { chromium } from "@playwright/test";
import { authenticator } from "otplib";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

const email = process.env["SIN_UAT_EMAIL"] ?? "viasport-staff@example.com";
const password = process.env["SIN_UAT_PASSWORD"] ?? "testpassword123";
const totpSecret =
  process.env["SIN_UI_TOTP_SECRET_BASE32"] ??
  "ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA";
const baseUrl = "https://sinuat.solsticeapp.ca";

const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").slice(0, 12);

const outputDir = path.resolve("docs/sin-rfp/review-plans/evidence/2026-01-10/videos");
const outputName = `SEC-AGG-001-auth-mfa-login-flow-${stamp}.mp4`;

const waitForIdle = async (page: import("@playwright/test").Page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
};

const run = async () => {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();
  await page.context().clearCookies();
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(750);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Continue" }).click();
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ timeout: 60000 });
  await passwordInput.fill(password);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("button", { name: "Authenticator code" }).waitFor();
  await page.getByRole("button", { name: "Authenticator code" }).click();
  const code = authenticator.generate(totpSecret);
  await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Verify code" }).click();

  await page.waitForURL(/\/dashboard(\/select-org)?/, { timeout: 15000 });
  await page.waitForTimeout(750);

  if (page.url().includes("/dashboard/select-org")) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 15000 });
  }

  await waitForIdle(page);
  await page.waitForTimeout(1500);
  await context.close();
  await browser.close();

  const videoPath = await page.video()?.path();
  if (!videoPath) {
    throw new Error("Video recording failed to save.");
  }

  const finalPath = path.join(outputDir, outputName);
  await rename(videoPath, finalPath);

  console.log(`Video saved to ${finalPath}`);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
