import { expect, test } from "@playwright/test";
import { checkA11y } from "../../utils/a11y";
import { gotoWithAuth } from "../../utils/auth";

const hasCreds =
  Boolean(process.env["E2E_TEST_EMAIL"]) && Boolean(process.env["E2E_TEST_PASSWORD"]);

test.describe("Accessibility - dashboard", () => {
  test.skip(!hasCreds, "E2E creds not configured");

  test("dashboard has no wcag2a/aa violations", async ({ page }) => {
    await gotoWithAuth(page, "/dashboard", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
      expectRedirect: true,
    });
    await expect(page).toHaveURL(/dashboard/);
    await checkA11y(page);
  });
});
