import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const tenantKey = process.env["TENANT_KEY"] ?? process.env["VITE_TENANT_KEY"] ?? "qc";
const isViaSport = tenantKey === "viasport";
const adminEmail = process.env["E2E_TEST_ADMIN_EMAIL"]!;
const adminPassword = process.env["E2E_TEST_ADMIN_PASSWORD"]!;
const totpSecret = process.env["E2E_TEST_ADMIN_TOTP_SECRET"];

test.describe("SIN admin privacy", () => {
  test("shows retention policies and legal holds", async ({ page }) => {
    test.skip(!isViaSport, "viaSport-only test");
    test.skip(!totpSecret, "Missing E2E_TEST_ADMIN_TOTP_SECRET");

    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/admin/sin/privacy", {
      email: adminEmail,
      password: adminPassword,
    });

    await expect(page.getByRole("heading", { name: "Retention Policies" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Legal Holds" })).toBeVisible();
  });
});
