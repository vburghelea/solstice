import { Page } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  // Wait for navigation to complete
  await page.waitForURL("/dashboard");
}

export async function signup(page: Page, name: string, email: string, password: string) {
  await page.goto("/auth/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();

  // Wait for navigation to complete
  await page.waitForURL("/onboarding");
}

export async function logout(page: Page) {
  // Navigate to settings page (more reliable than looking for menu)
  await page.goto("/dashboard/settings");
  // Click logout button
  await page.getByRole("button", { name: "Sign out" }).click();

  // Wait for navigation to home
  await page.waitForURL("/");
}
