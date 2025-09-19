import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("Roles management", () => {
  test("admin can view role management dashboard", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/roles", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    await expect(page.getByRole("heading", { name: "Role Management" })).toBeVisible();
    await expect(page.getByText(/Assign and revoke administrator access/i)).toBeVisible();
  });

  test("non-admin users are redirected away from role management", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/roles", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).not.toHaveURL(/\/admin\/roles/);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
