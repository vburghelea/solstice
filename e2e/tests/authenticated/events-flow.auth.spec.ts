import { expect, test } from "@playwright/test";
import { clearAuthState, gotoWithAuth } from "../../utils/auth";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isoDateDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test.describe("Events flow", () => {
  test("admin creates event, member registers, admin manages", async ({ page }) => {
    const adminEmail = requiredEnv("E2E_TEST_ADMIN_EMAIL");
    const adminPassword = requiredEnv("E2E_TEST_ADMIN_PASSWORD");
    const memberEmail = requiredEnv("E2E_TEST_EMAIL");
    const memberPassword = requiredEnv("E2E_TEST_PASSWORD");

    const uniqueSuffix = Date.now().toString(36);
    const eventName = `E2E Automation Showcase ${uniqueSuffix}`;
    const eventSlug = generateSlug(eventName);
    const startDate = isoDateDaysFromNow(30);
    const endDate = isoDateDaysFromNow(31);

    await test.step("Admin creates an event", async () => {
      await clearAuthState(page);
      await gotoWithAuth(page, "/dashboard/events/create", {
        email: adminEmail,
        password: adminPassword,
      });

      await page.getByLabel("Event Name").fill(eventName);
      await expect(page.getByLabel("URL Slug")).toHaveValue(eventSlug, { timeout: 5000 });

      await page.getByLabel("Initial Status").click();
      await page.getByRole("option", { name: "Registration Open" }).click();
      await page.getByRole("button", { name: "Next" }).click();

      await page.getByLabel("Start Date").fill(startDate);
      await page.getByLabel("End Date").fill(endDate);
      await page.getByLabel("City").fill("Toronto");
      await page.getByLabel("Province").click();
      await page.getByRole("option", { name: "Ontario" }).click();
      await page.getByRole("button", { name: "Next" }).click();

      await page.getByLabel("Registration Type").click();
      await page.getByRole("option", { name: "Individual" }).click();
      await page.getByLabel("Individual Registration Fee ($)").fill("25");
      await page.getByRole("button", { name: "Next" }).click();

      await page.getByLabel("Contact Email").fill("events@quadballcanada.com");
      await page.getByLabel("Contact Phone").fill("+1 (555) 987-0003");
      await page.getByRole("button", { name: "Create Event" }).click();

      await expect(page.getByText("Event created successfully!")).toBeVisible({
        timeout: 10000,
      });
      await page.waitForURL(new RegExp(`/dashboard/events/${eventSlug}$`), {
        timeout: 10000,
      });
      await expect(
        page.getByRole("heading", { name: eventName, exact: true }),
      ).toBeVisible();
    });

    await test.step("Member registers for the new event", async () => {
      await clearAuthState(page);
      await gotoWithAuth(page, `/dashboard/events/${eventSlug}/register`, {
        email: memberEmail,
        password: memberPassword,
      });

      await expect(
        page.getByRole("heading", { name: `Register for ${eventName}` }),
      ).toBeVisible();

      const termsCheckbox = page.getByRole("checkbox", {
        name: "I agree to the event terms and code of conduct",
      });
      const waiverCheckbox = page.getByRole("checkbox", {
        name: "I have read and accepted the liability waiver",
      });

      await termsCheckbox.click();
      await waiverCheckbox.click();
      await expect(termsCheckbox).toBeChecked();
      await expect(waiverCheckbox).toBeChecked();

      await page.getByRole("button", { name: "Complete Registration" }).click();

      await page.waitForURL(/\/dashboard\/events$/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    });

    await test.step("Admin manages the registration", async () => {
      await clearAuthState(page);
      await gotoWithAuth(page, `/dashboard/events/${eventSlug}`, {
        email: adminEmail,
        password: adminPassword,
      });

      await page.getByRole("link", { name: "Manage Event" }).click();

      await page.waitForURL(/\/dashboard\/events\/.+\/manage$/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Manage Event" })).toBeVisible();
      await expect(page.getByText(eventName)).toBeVisible();

      await page.getByRole("tab", { name: "Registrations" }).click();
      await expect(page.getByRole("row", { name: /test user/i })).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("tab", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Registration Closed" }).click();
      await expect(page.getByText("Event updated successfully")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("tab", { name: "Overview" }).click();
      await expect(page.getByText("registration closed")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("tab", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Registration Open" }).click();
      await expect(page.getByText("Event updated successfully")).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("tab", { name: "Overview" }).click();
      await expect(page.getByText("registration open")).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
