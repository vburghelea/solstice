/* eslint-disable react-hooks/rules-of-hooks */
import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

// Define test accounts for parallel execution
const testAccounts = [
  { email: "test1@example.com", password: "password123" },
  { email: "test2@example.com", password: "password123" },
  { email: "test3@example.com", password: "password123" },
  { email: "test4@example.com", password: "password123" },
  { email: "test5@example.com", password: "password123" },
];

type AuthFixtures = {
  authenticatedPage: Page;
  testUser: { email: string; password: string };
};

// Extend base test with authentication fixtures
export const test = base.extend<AuthFixtures>({
  // Use a different account for each worker
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use, workerInfo) => {
    // Use worker index to assign unique account
    const account = testAccounts[workerInfo.workerIndex % testAccounts.length];
    await use(account);
  },

  // Provide an authenticated page
  authenticatedPage: async ({ page, testUser }, use) => {
    // Login with the test user
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();

    // Wait for authentication to complete
    await page.waitForURL("/dashboard");

    // Use the authenticated page in the test
    await use(page);

    // Cleanup if needed
    // await page.goto('/logout');
  },
});

export { expect } from "@playwright/test";
