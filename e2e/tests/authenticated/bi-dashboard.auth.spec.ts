import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test.describe("BI Dashboards", () => {
  test("creates a dashboard and adds a widget", async ({ page }) => {
    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/analytics/dashboards/new");

    await page.getByRole("textbox").first().fill("E2E Dashboard");
    await page.getByRole("button", { name: /create dashboard/i }).click();

    await expect(page.getByRole("heading", { name: /e2e dashboard/i })).toBeVisible();

    await page.getByRole("button", { name: /add widget/i }).click();
    const dialog = page.getByRole("dialog", { name: /add widget/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox").fill("Active Orgs");

    const datasetTrigger = dialog.getByRole("button", {
      name: /select dataset|organizations/i,
    });
    await datasetTrigger.click();
    await page.getByRole("option", { name: /organizations/i }).click();

    await dialog.getByRole("button", { name: /add widget/i }).click();

    await expect(page.getByTestId("dashboard-widget")).toBeVisible();

    await page.getByRole("button", { name: /share/i }).click();
    const shareDialog = page.getByRole("dialog", { name: /share dashboard/i });
    await expect(shareDialog).toBeVisible();
    await shareDialog.getByLabel("Share with entire organization").check();
    await shareDialog.getByRole("button", { name: /save sharing settings/i }).click();
    await expect(page.getByText(/sharing settings updated/i)).toBeVisible();

    await page.getByRole("button", { name: /export/i }).click();
    const exportDialog = page.getByRole("dialog", { name: /export dashboard data/i });
    await expect(exportDialog).toBeVisible();

    const downloadPromise = page
      .waitForEvent("download", { timeout: 5000 })
      .catch(() => null);
    await exportDialog.getByRole("button", { name: /export data/i }).click();

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
