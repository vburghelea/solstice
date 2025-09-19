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
});
