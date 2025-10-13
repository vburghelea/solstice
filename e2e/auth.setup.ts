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

  // 3. Verify login was successful and we are on the dashboard
  await page.waitForURL("/player", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible({
    timeout: 10_000,
  });

  // 4. CRITICAL: Wait for network to be idle. This ensures any final
  //    session/cookie setting requests have completed.
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // 5. Extra verification: Check for a persistent element that confirms auth,
  //    like the logout button in the sidebar. This ensures the app's UI has
  //    fully rendered in its authenticated state.
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  // 6. Now that we are certain the auth state is stable, save it.
  await page.context().storageState({ path: authFile });

  // Optional: Log cookies for debugging
  const cookies = await page.context().cookies();
  console.log(`Saved ${cookies.length} cookies to auth state.`);
});
