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
const outputPath = path.resolve("outputs/sin-uat-storage.json");

const run = async () => {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.context().clearCookies();

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(750);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Continue" }).click();

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ timeout: 60000 });
  await passwordInput.fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  const authButton = page.getByRole("button", { name: "Authenticator code" });
  const authVisible = await authButton
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (authVisible) {
    await authButton.click();
    const code = authenticator.generate(totpSecret);
    await page.getByRole("textbox", { name: "Authentication code" }).fill(code);
    await page.getByRole("button", { name: "Verify code" }).click();
  }

  await page.waitForURL(/\/dashboard(\/select-org)?/, { timeout: 20000 });
  if (page.url().includes("/dashboard/select-org")) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.waitForURL(/\/dashboard\/sin/, { timeout: 20000 });
  }

  await context.storageState({ path: outputPath });
  await context.close();
  await browser.close();

  console.log(`Saved storage state to ${outputPath}`);
};

run().catch((error) => {
  console.error("Failed to save storage state:", error);
  process.exit(1);
});
