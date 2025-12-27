import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const tenantKey = process.env["TENANT_KEY"] ?? process.env["VITE_TENANT_KEY"] ?? "qc";
const isViaSport = tenantKey === "viasport";

test.describe("SIN admin access", () => {
  test("admin access respects tenant gating", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/admin/sin", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    if (!isViaSport) {
      await expect(page).toHaveURL(/\/dashboard\/forbidden/);
      await expect(
        page.getByRole("heading", { name: "Access restricted" }),
      ).toBeVisible();
      return;
    }

    await expect(page.getByRole("heading", { name: "SIN Admin" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage orgs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open security" })).toBeVisible();
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
