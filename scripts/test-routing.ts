import { chromium } from "@playwright/test";

async function testRouting() {
  const browser = await chromium.launch({
    headless: false, // Set to true for CI
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1. Navigating to login page...");
  await page.goto("http://localhost:5173/auth/login");

  // Login
  console.log("2. Filling login form...");
  await page
    .getByLabel("Email")
    .fill(process.env["E2E_TEST_EMAIL"] || "test@example.com");
  await page
    .getByLabel("Password")
    .fill(process.env["E2E_TEST_PASSWORD"] || "password123");

  console.log("3. Clicking login button...");
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // Wait for dashboard
  console.log("4. Waiting for player hub...");
  await page.waitForURL("/player", { timeout: 10000 });
  console.log("✓ Successfully navigated to player hub");

  // Navigate to teams
  console.log("5. Navigating to teams page...");
  await page.goto("http://localhost:5173/player/teams");
  await page.waitForLoadState("networkidle");

  // Try clicking the Create Team button
  console.log("6. Looking for Create Team button...");
  const createButton = page.getByRole("button", { name: "Create Team" });
  const isVisible = await createButton.isVisible();
  console.log(`Create Team button visible: ${isVisible}`);

  if (isVisible) {
    console.log("7. Clicking Create Team button...");
    await createButton.click();

    // Wait a bit to see what happens
    await page.waitForTimeout(2000);

    // Check current URL
    console.log(`Current URL: ${page.url()}`);

    // Check if we're on the create page
    const createPageTitle = await page
      .getByRole("heading", { name: "Create a New Team" })
      .isVisible()
      .catch(() => false);
    console.log(`Create page title visible: ${createPageTitle}`);

    // Check page content
    const pageContent = await page.textContent("body");
    console.log(
      "Page contains 'Create a New Team':",
      pageContent?.includes("Create a New Team"),
    );
    console.log("Page contains 'My Teams':", pageContent?.includes("My Teams"));
  }

  await browser.close();
}

testRouting().catch(console.error);
