import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("BI Pivot Builder", () => {
  test("builds a pivot and shows results", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/analytics/explore");

    await expect(page.getByTestId("field-type")).toBeVisible();

    await page.getByTestId("field-type").dragTo(page.getByTestId("rows-dropzone"));
    await page.getByTestId("field-status").dragTo(page.getByTestId("columns-dropzone"));
    await page.getByTestId("field-name").dragTo(page.getByTestId("measures-dropzone"));

    await page.getByRole("button", { name: /run query/i }).click();

    await expect(page.getByTestId("pivot-table")).toBeVisible();
  });
});
