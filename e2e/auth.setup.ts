import { expect, test as setup } from "@playwright/test";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // First, try to login
  await page.goto("/auth/login");

  // Fill in credentials
  await page.getByLabel("Email").fill(process.env["E2E_TEST_EMAIL"]!);
  await page.getByLabel("Password").fill(process.env["E2E_TEST_PASSWORD"]!);

  // Click login button
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Check if login was successful by waiting for navigation
  try {
    await page.waitForURL("/dashboard", { timeout: 5000 });
    console.log("Login successful");
  } catch (e) {
    // Still on login page, login failed
    if (page.url().includes("/auth/login")) {
      const errorVisible = await page
        .getByText("Invalid email or password")
        .isVisible()
        .catch(() => false);
      if (errorVisible) {
        throw new Error(
          "Login failed: Invalid credentials. Make sure test user exists (run pnpm test:e2e:setup)",
        );
      } else {
        throw new Error("Login failed: Unknown error");
      }
    }
    throw e;
  }

  // Check if we're on an error page
  const errorText = page.getByText("Something went wrong");
  if (await errorText.isVisible().catch(() => false)) {
    console.log("Hit error page, clicking Try Again...");
    await page.getByRole("button", { name: "Try Again" }).click();
    await page.waitForTimeout(2000);
  }

  // Wait for successful navigation to dashboard
  await page.waitForURL("/dashboard", { timeout: 10000 });

  // Verify we're logged in by checking for the welcome message
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible({
    timeout: 5000,
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
