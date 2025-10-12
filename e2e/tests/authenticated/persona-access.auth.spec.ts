import { expect, test } from "@playwright/test";

import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("Persona access control", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("admin persona can access admin workspace", async ({ page }) => {
    await gotoWithAuth(page, "/admin", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Administration workspace" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin/);
  });

  test("player persona is redirected away from admin workspace", async ({ page }) => {
    await gotoWithAuth(page, "/admin", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/player/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Player workspace" }),
    ).toBeVisible();
  });

  test("authorized persona can access operations workspace", async ({ page }) => {
    await gotoWithAuth(page, "/ops", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Operations workspace" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/ops/);
  });

  test("player persona is redirected away from operations workspace", async ({
    page,
  }) => {
    await gotoWithAuth(page, "/ops", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/player/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Player workspace" }),
    ).toBeVisible();
  });

  test("authorized persona can access game master workspace", async ({ page }) => {
    await gotoWithAuth(page, "/gm", {
      email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
      password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Game Master workspace" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/gm/);
  });

  test("player persona is redirected away from game master workspace", async ({
    page,
  }) => {
    await gotoWithAuth(page, "/gm", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/player/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Player workspace" }),
    ).toBeVisible();
  });

  test("player workspace requires authentication", async ({ page }) => {
    await clearAuthState(page);
    await page.goto("/player");

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("player persona can access player workspace", async ({ page }) => {
    await gotoWithAuth(page, "/player", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Player workspace" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/player/);
  });
});
