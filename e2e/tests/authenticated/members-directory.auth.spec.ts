import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

test.describe("Members Directory (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithAuth(page, "/dashboard/members", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { name: "Members Directory", exact: true }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("should display seeded members", async ({ page }) => {
    await expect(page.getByPlaceholder("Search by name, email, or team")).toBeVisible();

    await expect(page.getByText("Test User").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Admin User").first()).toBeVisible();
  });

  test("should filter members by search input", async ({ page }) => {
    const searchInput = page.getByLabel("Search members");

    await searchInput.fill("Admin User");

    const adminRow = page.getByRole("row", { name: /Admin User/ });
    await expect(adminRow).toBeVisible({ timeout: 10000 });
    await expect(adminRow.getByText("Hidden").first()).toBeVisible();

    const testUserRow = page.getByRole("row", { name: /Test User/ });
    await expect(testUserRow).not.toBeVisible();

    await searchInput.fill("");
    await expect(page.getByText("Test User").first()).toBeVisible({ timeout: 10000 });
  });

  test("should open member detail dialog", async ({ page }) => {
    const searchInput = page.getByLabel("Search members");
    await searchInput.fill("Test User");

    const targetRow = page.getByRole("row", { name: /Test User/ });
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    await targetRow.getByRole("button", { name: "View" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Membership history")).toBeVisible();
    await expect(dialog.getByText("Open to Team Invitations")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
