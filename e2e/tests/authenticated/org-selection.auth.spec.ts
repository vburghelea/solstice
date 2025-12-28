import { expect, test } from "@playwright/test";
import { authenticator } from "otplib";
import { clearAuthState, uiLoginWithMfa } from "../../utils/auth";

const adminEmail = process.env["E2E_TEST_ADMIN_EMAIL"]!;
const adminPassword = process.env["E2E_TEST_ADMIN_PASSWORD"]!;
const totpSecret = process.env["E2E_TEST_ADMIN_TOTP_SECRET"];

const generateTotp = () => {
  if (!totpSecret) return "";
  authenticator.options = { step: 30, window: 1 };
  return authenticator.generate(totpSecret);
};

test("org selection redirects to SIN dashboard", async ({ page }) => {
  test.skip(!totpSecret, "Missing E2E_TEST_ADMIN_TOTP_SECRET");

  await clearAuthState(page);
  await page.request.post("/api/test/cleanup", {
    data: {
      action: "set-mfa",
      userEmail: adminEmail,
      mfaRequired: true,
      twoFactorEnabled: true,
    },
  });

  const mfaCode = generateTotp();
  await uiLoginWithMfa(page, {
    email: adminEmail,
    password: adminPassword,
    redirect: "/dashboard/select-org",
    mfaCode,
  });

  await expect(
    page.getByRole("heading", { name: "Select an organization" }),
  ).toBeVisible();

  const trigger = page.getByRole("button", { name: /select organization/i });
  await trigger.click();
  const clearOption = page.getByRole("option", { name: "Clear selection" });
  if (await clearOption.isVisible().catch(() => false)) {
    await clearOption.click();
    await trigger.click();
  }

  await page.getByRole("option", { name: "E2E SIN Test Org" }).click();
  await expect(page).toHaveURL(/\/dashboard\/sin/);
});
