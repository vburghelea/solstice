import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test("admin can export report data", async ({ page }) => {
  await clearAuthState(page);
  await gotoWithAuth(page, "/dashboard/admin/sin", {
    email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
    password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
  });

  const exportHeading = page.getByRole("heading", { name: "Export data" });
  await exportHeading.scrollIntoViewIfNeeded();

  const exportSection = exportHeading.locator("..").locator("..");
  await exportSection.getByRole("button", { name: "Data source" }).click();
  await page.getByRole("option", { name: "Organizations" }).click();

  const exportButton = exportSection.getByRole("button", { name: /^Export$/ });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportButton.click(),
  ]);

  const filename = download.suggestedFilename();
  expect(filename).toContain("report-export");
});
