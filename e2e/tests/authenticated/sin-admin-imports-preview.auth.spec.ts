import { expect, test } from "@playwright/test";
import path from "node:path";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";
import {
  deleteImportJobs,
  ensureOrgMembership,
  removeOrgMembership,
} from "../../utils/cleanup";

const tenantKey = process.env["TENANT_KEY"] ?? process.env["VITE_TENANT_KEY"] ?? "qc";
const isViaSport = tenantKey === "viasport";
const adminEmail = process.env["E2E_TEST_ADMIN_EMAIL"]!;
const adminPassword = process.env["E2E_TEST_ADMIN_PASSWORD"]!;
const totpSecret = process.env["E2E_TEST_ADMIN_TOTP_SECRET"];
const hasArtifactsBucket = Boolean(process.env["SIN_ARTIFACTS_BUCKET"]);

const fixtureFileName = "import-preview-sample.csv";
const fixturePath = path.join(process.cwd(), "e2e/fixtures", fixtureFileName);

test.describe("SIN admin imports preview", () => {
  test("requires preview confirmation before running imports", async ({ page }) => {
    test.skip(!isViaSport, "viaSport-only test");
    test.skip(!totpSecret, "Missing E2E_TEST_ADMIN_TOTP_SECRET");
    test.skip(!hasArtifactsBucket, "Missing SIN_ARTIFACTS_BUCKET");

    await clearAuthState(page);

    let organizationId: string | null = null;
    let organizationName = "";

    try {
      const organization = await ensureOrgMembership(page, { userEmail: adminEmail });
      organizationId = organization.id;
      organizationName = organization.name;

      await deleteImportJobs(page, {
        userEmail: adminEmail,
        organizationId,
        fileName: fixtureFileName,
      });

      await gotoWithAuth(page, "/dashboard/admin/sin/imports", {
        email: adminEmail,
        password: adminPassword,
      });

      await page.getByLabel("Organization").click();
      await page.getByRole("option", { name: organizationName }).click();

      await page.getByLabel("Target form").click();
      const formOption = page.getByRole("option").first();
      const hasFormOption = await formOption.isVisible().catch(() => false);
      if (!hasFormOption) {
        test.skip(true, "No forms available for import.");
      }

      const formName = (await formOption.textContent())?.trim();
      if (!formName) {
        test.skip(true, "No form options available for import.");
      }
      await formOption.click();

      await page.getByLabel("Source file").setInputFiles(fixturePath);

      const createJobButton = page.getByRole("button", { name: "Create import job" });
      await expect(createJobButton).toBeEnabled({ timeout: 30_000 });
      await createJobButton.click();

      await expect(
        page.getByRole("button", { name: "Import job created" }),
      ).toBeVisible();

      const runImportButton = page.getByRole("button", { name: "Run import" });
      await expect(runImportButton).toBeVisible();
      await expect(runImportButton).toBeDisabled();

      await page.getByLabel(/reviewed the validation preview/i).check();

      const fileFieldWarning = page.getByText(
        /File field imports are not supported yet/i,
      );
      const hasFileFieldWarning = await fileFieldWarning.isVisible().catch(() => false);

      if (hasFileFieldWarning) {
        await expect(runImportButton).toBeDisabled();
      } else {
        await expect(runImportButton).toBeEnabled();
      }
    } finally {
      if (organizationId) {
        await deleteImportJobs(page, {
          userEmail: adminEmail,
          organizationId,
          fileName: fixtureFileName,
        }).catch(() => undefined);
        await removeOrgMembership(page, {
          userEmail: adminEmail,
          organizationId,
        }).catch(() => undefined);
      }
    }
  });
});
