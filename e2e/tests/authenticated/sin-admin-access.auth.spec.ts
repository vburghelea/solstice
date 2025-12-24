import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("SIN admin access", () => {
  test("admin can access SIN admin dashboard", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/admin/sin", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { name: "Organizations & Tenancy" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Audit Logging" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  });

  test("non-admin users are redirected to forbidden", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/admin/sin", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/dashboard\/forbidden/);
    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  });
});
