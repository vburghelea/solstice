import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

const tenantKey = process.env["TENANT_KEY"] ?? process.env["VITE_TENANT_KEY"] ?? "qc";
const isViaSport = tenantKey === "viasport";

test.describe("SIN portal access", () => {
  test("QC tenant blocks SIN portal routes", async ({ page }) => {
    test.skip(isViaSport, "QC-only assertion");

    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard/sin", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/dashboard\/forbidden/);
    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  });

  test("viaSport redirects /dashboard to SIN", async ({ page }) => {
    test.skip(!isViaSport, "viaSport-only assertion");

    await clearAuthState(page);
    await gotoWithAuth(page, "/dashboard", {
      email: process.env["E2E_TEST_EMAIL"]!,
      password: process.env["E2E_TEST_PASSWORD"]!,
    });

    await expect(page).toHaveURL(/\/dashboard\/select-org/);
    const redirectTarget = new URL(page.url()).searchParams.get("redirect") ?? "";
    expect(decodeURIComponent(redirectTarget)).toContain("/dashboard/sin");
  });
});
