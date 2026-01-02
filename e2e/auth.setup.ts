import { expect, test as setup } from "@playwright/test";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { clearAuthState, uiLogin } from "./utils/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // 1. Start with a clean slate
  await clearAuthState(page);

  // 2. Use the robust uiLogin helper
  await uiLogin(page, process.env["E2E_TEST_EMAIL"]!, process.env["E2E_TEST_PASSWORD"]!);

  // 3. Verify login was successful - wait for any dashboard URL pattern
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  // 4. CRITICAL: Wait for network to be idle. This ensures any final
  //    session/cookie setting requests have completed.
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // 5. Extra verification: Check for a persistent element that confirms auth,
  //    like the logout button in the sidebar. This ensures the app's UI has
  //    fully rendered in its authenticated state.
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({
    timeout: 10_000,
  });

  // 6. Navigate to SIN Portal to trigger privacy policy modal (if needed)
  await page.goto("http://localhost:5173/dashboard/sin/", { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // 7. Accept privacy policy if prompted
  const privacyCheckbox = page.getByRole("checkbox", {
    name: /I have read and agree to the Privacy Policy/i,
  });
  if (await privacyCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("Privacy policy modal detected, accepting...");
    await privacyCheckbox.check();
    await page.getByRole("button", { name: "Accept and Continue" }).click();
    // Wait for modal to close and page to load
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
    console.log("Privacy policy accepted.");
  }

  // 8. Select organization if prompted (org selection page)
  const orgSelectCombobox = page.getByRole("combobox");
  if (await orgSelectCombobox.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("Organization selection detected, selecting viaSport BC...");
    await orgSelectCombobox.click();
    await page.getByRole("option", { name: /viaSport BC/i }).click();
    // Wait for navigation to complete
    await page.waitForLoadState("networkidle", { timeout: 10_000 });
    console.log("Organization selected.");
  }

  // 9. Now that we are certain the auth state is stable, save it.
  await page.context().storageState({ path: authFile });

  // Optional: Log cookies for debugging
  const cookies = await page.context().cookies();
  console.log(`Saved ${cookies.length} cookies to auth state.`);
});
