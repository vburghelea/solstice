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

test.describe("MFA and step-up flows", () => {
  test("admin can complete MFA login", async ({ page }) => {
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
      redirect: "/dashboard",
      mfaCode,
    });

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("expired sessions prompt step-up on export", async ({ page }) => {
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
      redirect: "/dashboard",
      mfaCode,
    });

    await page.goto("/dashboard/select-org");
    await page.getByRole("button", { name: /select organization/i }).click();
    await page.getByRole("option", { name: "E2E SIN Test Org" }).click();
    await expect(page).toHaveURL(/\/dashboard\/sin/);

    await page.request.post("/api/test/cleanup", {
      data: {
        action: "expire-session",
        userEmail: adminEmail,
        ageMinutes: 20,
      },
    });

    await page.goto("/dashboard/sin/analytics");
    const exportHeading = page.getByRole("heading", { name: "Export data" });
    await exportHeading.scrollIntoViewIfNeeded();

    const exportSection = exportHeading.locator("..").locator("..");
    await exportSection.getByRole("button", { name: "Data source" }).click();
    await page.getByRole("option", { name: "Organizations" }).click();
    await exportSection.getByRole("button", { name: /^Export$/ }).click();

    await expect(
      page.getByRole("heading", { name: "Confirm your identity" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
