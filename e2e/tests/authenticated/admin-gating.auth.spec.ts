import { expect, test } from "@playwright/test";
import { authenticator } from "otplib";
import { clearAuthState, gotoWithAuth, uiLoginWithMfa } from "../../utils/auth";

const adminEmail = process.env["E2E_TEST_ADMIN_EMAIL"]!;
const adminPassword = process.env["E2E_TEST_ADMIN_PASSWORD"]!;
const totpSecret = process.env["E2E_TEST_ADMIN_TOTP_SECRET"];

const generateTotp = () => {
  if (!totpSecret) return "";
  authenticator.options = { step: 30, window: 1 };
  return authenticator.generate(totpSecret);
};

test.describe("Admin gating", () => {
  test("non-admin users are blocked from admin routes", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/admin/roles", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/dashboard\/forbidden/);
    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  });

  test("admins can access admin routes with MFA", async ({ page }) => {
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
      redirect: "/dashboard/admin/roles",
      mfaCode,
    });

    await expect(page.getByRole("heading", { name: "Role Management" })).toBeVisible();
  });
});
