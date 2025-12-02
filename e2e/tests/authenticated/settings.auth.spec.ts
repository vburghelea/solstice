import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

test.describe("Dashboard Settings", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/settings", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("renders account overview and security controls", async ({ page }) => {
    await expect(page.getByText("Account status")).toBeVisible();
    await expect(page.getByText("Change Password")).toBeVisible();
    await expect(page.getByText("Active Sessions")).toBeVisible();

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("cell", { name: /This device|Current/ })).toBeVisible();
  });

  test("shows connected accounts section", async ({ page }) => {
    const section = page.getByText("Connected accounts");
    await expect(section).toBeVisible();

    const connectButtons = page.getByRole("button", { name: /Connect|Disconnect/ });
    await expect(connectButtons.first()).toBeVisible();
  });

  test.describe("Password Change Form", () => {
    test("displays password change form fields", async ({ page }) => {
      // Check form fields exist
      await expect(page.getByLabel("Current password")).toBeVisible();
      await expect(page.getByLabel("New password")).toBeVisible();
      await expect(page.getByLabel("Confirm new password")).toBeVisible();
      await expect(page.getByLabel("Sign out of other devices")).toBeVisible();
      await expect(page.getByRole("button", { name: "Update password" })).toBeVisible();
    });

    test("shows password strength indicator when typing new password", async ({
      page,
    }) => {
      // Type a weak password
      await page.getByLabel("New password").fill("abc");
      await expect(page.getByText(/Password strength:/)).toBeVisible();

      // Clear and type stronger password
      await page.getByLabel("New password").fill("SecurePass123!");
      await expect(page.getByText(/Password strength:/)).toBeVisible();
    });

    test("validates password confirmation mismatch", async ({ page }) => {
      await page.getByLabel("Current password").fill("currentpassword");
      await page.getByLabel("New password").fill("NewSecurePass123!");
      await page.getByLabel("Confirm new password").fill("DifferentPass123!");

      await page.getByRole("button", { name: "Update password" }).click();

      // Should show mismatch error
      await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 5000 });
    });

    test("validates password requirements", async ({ page }) => {
      await page.getByLabel("Current password").fill("currentpassword");
      await page.getByLabel("New password").fill("weak");
      await page.getByLabel("Confirm new password").fill("weak");

      await page.getByRole("button", { name: "Update password" }).click();

      // Should show password requirements error
      await expect(page.getByText(/password/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Session Management", () => {
    test("shows current session as active", async ({ page }) => {
      // Look for current session indicator
      await expect(page.getByText("This device")).toBeVisible();
      await expect(page.getByRole("cell", { name: /Current/ })).toBeVisible();
    });

    test("displays session details", async ({ page }) => {
      // Check session table has expected columns
      await expect(page.getByRole("columnheader", { name: "Device" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Location" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Last active" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
    });
  });
});
