import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("Roles management (integrated in users page)", () => {
  test("admin can see role management features in users page", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/users", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    // Should see the User Directory with role features
    await expect(page.getByRole("heading", { name: "User governance" })).toBeVisible();

    // Should see role assignment button
    await expect(page.getByRole("button", { name: "Assign Role" })).toBeVisible();

    // Should see role filter dropdown
    await expect(page.getByPlaceholder("Filter by role")).toBeVisible();

    // Should see role summary section
    await expect(page.getByText("Role Summary")).toBeVisible();
  });

  test("admin can access role management via redirect from old route", async ({
    page,
  }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/roles", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    // Should be redirected to /admin/users
    await expect(page).toHaveURL(/\/admin\/users/);

    // Should see integrated role management features
    await expect(page.getByRole("button", { name: "Assign Role" })).toBeVisible();
  });

  test("non-admin users are redirected away from old roles route", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/roles", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    // Should be redirected away from admin area
    await expect(page).not.toHaveURL(/\/admin\/users/);
    await expect(page).toHaveURL(/\/player/);
  });

  test("role assignment dialog opens and can be cancelled", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/users", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    // Open role assignment dialog
    await page.getByRole("button", { name: "Assign Role" }).click();
    await expect(page.getByRole("heading", { name: "Assign a Role" })).toBeVisible();

    // Should see user search field
    await expect(page.getByPlaceholder("Search users...")).toBeVisible();

    // Should see role selection
    await expect(page.getByText("Role")).toBeVisible();

    // Cancel the dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Assign a Role" })).not.toBeVisible();
  });

  test("admin can filter users by role", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/users", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    // Should see role filter dropdown
    const roleFilter = page.getByPlaceholder("Filter by role");
    await expect(roleFilter).toBeVisible();

    // Should have "All roles" as default
    await expect(page.getByText("All roles")).toBeVisible();
  });

  test("role assignments table displays correctly", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/admin/users", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    // Should see role assignments section
    await expect(page.getByText("Current Role Assignments")).toBeVisible();

    // Should see table headers
    await expect(page.getByText("User")).toBeVisible();
    await expect(page.getByText("Role")).toBeVisible();
    await expect(page.getByText("Scope")).toBeVisible();
    await expect(page.getByText("Actions")).toBeVisible();
  });
});
