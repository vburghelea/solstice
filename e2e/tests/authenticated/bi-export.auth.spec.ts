import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("BI Export", () => {
  test("exports CSV or prompts for step-up auth", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    await expect(page.getByTestId("field-type")).toBeVisible();

    await page.getByTestId("field-type").dragTo(page.getByTestId("rows-dropzone"));
    await page.getByTestId("field-status").dragTo(page.getByTestId("columns-dropzone"));
    await page.getByTestId("field-name").dragTo(page.getByTestId("measures-dropzone"));

    await page.getByRole("button", { name: /run query/i }).click();

    const downloadPromise = page
      .waitForEvent("download", { timeout: 5000 })
      .catch(() => null);
    await page.getByRole("button", { name: /export csv/i }).click();

    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    } else {
      await expect(
        page.getByRole("dialog", { name: "Confirm your identity" }),
      ).toBeVisible();
    }
  });
});
