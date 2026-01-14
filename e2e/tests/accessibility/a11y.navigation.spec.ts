import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const hasCreds =
  Boolean(process.env["E2E_TEST_EMAIL"]) && Boolean(process.env["E2E_TEST_PASSWORD"]);

test.describe("Accessibility - navigation & focus management", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("skip link focuses main content on auth pages", async ({ page }) => {
    await page.goto("/auth/login");

    // First tab reaches the skip link
    await page.keyboard.press("Tab");
    await expect(page.locator("a", { hasText: "Skip to main content" })).toBeFocused();

    // Activate skip link and confirm main content receives focus
    await page.keyboard.press("Enter");
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const active = document.activeElement;
          return active?.id || active?.getAttribute("id");
        }),
      )
      .toBe("main-content");
  });

  test("focus moves to main after client-side navigation", async ({ page }) => {
    test.skip(!hasCreds, "E2E creds not configured");

    await gotoWithAuth(page, "/dashboard", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
      expectRedirect: true,
    });

    await page.getByRole("link", { name: "Teams" }).click();
    await expect(page).toHaveURL(/dashboard\/teams/);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const active = document.activeElement;
          return active?.id || active?.getAttribute("id");
        }),
      )
      .toBe("main-content");
  });
});
