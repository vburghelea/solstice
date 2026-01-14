import { expect, test } from "@playwright/test";
import { checkA11y } from "../../utils/a11y";

test.describe("Accessibility - auth", () => {
  test("login page has no wcag2a/aa violations", async ({ page }) => {
    await page.goto("/auth/login");
    await checkA11y(page);
    await expect(page).toHaveTitle(/Login/i);
  });
});
