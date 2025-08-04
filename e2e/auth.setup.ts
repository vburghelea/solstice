import { expect, test as setup } from "@playwright/test";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { clearAuthState, uiLogin } from "./utils/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Clear any existing auth state first
  await clearAuthState(page);

  // Use the uiLogin helper to perform login
  await uiLogin(page, process.env["E2E_TEST_EMAIL"]!, process.env["E2E_TEST_PASSWORD"]!);

  // Verify we're logged in by checking for the welcome message
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible({
    timeout: 10_000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
