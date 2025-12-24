import { expect, test } from "@playwright/test";
import path from "node:path";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

test("rejects file uploads with disallowed mime types", async ({ page }) => {
  await clearAuthState(page);
  await gotoWithAuth(page, "/dashboard/admin/sin", {
    email: process.env["E2E_TEST_ADMIN_EMAIL"]!,
    password: process.env["E2E_TEST_ADMIN_PASSWORD"]!,
  });

  const formsHeading = page.getByRole("heading", { name: "Dynamic Forms" });
  await formsHeading.scrollIntoViewIfNeeded();

  await page
    .getByRole("button", { name: /E2E SIN Upload Form/i })
    .scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /E2E SIN Upload Form/i }).click();

  const previewSection = page
    .getByRole("heading", { name: "Preview & submit" })
    .locator("..")
    .locator("..");

  const fileInput = previewSection.getByLabel("Supporting document");
  const filePath = path.join(process.cwd(), "e2e/fixtures/invalid.txt");
  await fileInput.setInputFiles(filePath);

  await previewSection.getByRole("button", { name: "Submit" }).click();

  await expect(previewSection.getByText(/File type .* is not allowed/i)).toBeVisible();
});
