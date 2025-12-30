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

test.describe("Group Registration Flow", () => {
  test.describe("Registration with Group Types", () => {
    test("shows group type options on registration page", async ({ page }) => {
      const adminEmail = requiredEnv("E2E_TEST_ADMIN_EMAIL");
      const adminPassword = requiredEnv("E2E_TEST_ADMIN_PASSWORD");
      const memberEmail = requiredEnv("E2E_TEST_EMAIL");
      const memberPassword = requiredEnv("E2E_TEST_PASSWORD");

      const uniqueSuffix = Date.now().toString(36);
      const eventName = `Group Reg Test ${uniqueSuffix}`;
      const eventSlug = generateSlug(eventName);
      const startDate = isoDateDaysFromNow(45);
      const endDate = isoDateDaysFromNow(46);

      await test.step("Admin creates an event that supports both registration types", async () => {
        await clearAuthState(page);
        await gotoWithAuth(page, "/dashboard/events/create", {
          email: adminEmail,
          password: adminPassword,
        });

        await page.getByLabel("Event Name").fill(eventName);
        await expect(page.getByLabel("URL Slug")).toHaveValue(eventSlug, {
          timeout: 5000,
        });

        await page.getByLabel("Initial Status").click();
        await page.getByRole("option", { name: "Registration Open" }).click();
        await page.getByRole("button", { name: "Next" }).click();

        await page.getByLabel("Start Date").fill(startDate);
        await page.getByLabel("End Date").fill(endDate);
        await page.getByLabel("City").fill("Vancouver");
        await page.getByLabel("Province").click();
        await page.getByRole("option", { name: "British Columbia" }).click();
        await page.getByRole("button", { name: "Next" }).click();

        // Select "Both" to allow individual and team registration
        await page.getByLabel("Registration Type").click();
        await page.getByRole("option", { name: "Both" }).click();
        await page.getByLabel("Individual Registration Fee ($)").fill("20");
        await page.getByLabel("Team Registration Fee ($)").fill("100");
        await page.getByRole("button", { name: "Next" }).click();

        await page.getByLabel("Contact Email").fill("events@test.com");
        await page.getByLabel("Contact Phone").fill("+1 (555) 123-4567");
        await page.getByRole("button", { name: "Create Event" }).click();

        await expect(page.getByText("Event created successfully!")).toBeVisible({
          timeout: 10000,
        });
      });

      await test.step("Member sees group type options on registration page", async () => {
        await clearAuthState(page);
        await gotoWithAuth(page, `/dashboard/events/${eventSlug}/register`, {
          email: memberEmail,
          password: memberPassword,
        });

        await expect(
          page.getByRole("heading", { name: `Register for ${eventName}` }),
        ).toBeVisible();

        // Verify group type radio options are present
        await expect(page.getByText("Group Type")).toBeVisible();
        await expect(page.getByLabel("Individual")).toBeVisible();
        await expect(page.getByLabel("Pair")).toBeVisible();
        await expect(page.getByLabel("Relay")).toBeVisible();
        await expect(page.getByLabel("Team")).toBeVisible();
        await expect(page.getByLabel("Family")).toBeVisible();
      });

      await test.step("Selecting non-individual group type shows invite section", async () => {
        // Click on "Pair" option
        await page.getByLabel("Pair").click();

        // Should show the invite section
        await expect(page.getByText("Invite Group Members")).toBeVisible();
        await expect(page.getByPlaceholder("teammate@example.com")).toBeVisible();
        await expect(page.getByRole("button", { name: "Add Invite" })).toBeVisible();
      });

      await test.step("Can add invites to the group", async () => {
        // Fill in an invite
        await page.getByPlaceholder("teammate@example.com").fill("partner@example.com");
        await page.getByRole("button", { name: "Add Invite" }).click();

        // Verify the invite was added
        await expect(page.getByText("partner@example.com")).toBeVisible();
        await expect(page.getByText("Pending invite")).toBeVisible();
      });

      await test.step("Can remove invites from the group", async () => {
        // Find and click the remove button for the invite
        const inviteRow = page.locator(".rounded-lg.border", {
          hasText: "partner@example.com",
        });
        await inviteRow.getByRole("button").click();

        // Verify the invite was removed
        await expect(page.getByText("partner@example.com")).not.toBeVisible();
      });

      await test.step("Switching back to Individual hides invite section", async () => {
        await page.getByLabel("Individual").click();

        // Invite section should be hidden
        await expect(page.getByText("Invite Group Members")).not.toBeVisible();
      });
    });
  });

  test.describe("Invite Acceptance Page", () => {
    test("shows invalid invite message for non-existent token", async ({ page }) => {
      const memberEmail = requiredEnv("E2E_TEST_EMAIL");
      const memberPassword = requiredEnv("E2E_TEST_PASSWORD");

      await clearAuthState(page);
      await gotoWithAuth(page, "/join/registration/invalid-test-token-12345", {
        email: memberEmail,
        password: memberPassword,
      });

      // Should show the invite page with invalid state
      await expect(
        page.getByRole("heading", { name: "Registration Invitation" }),
      ).toBeVisible({
        timeout: 10000,
      });

      // Should show invalid invite alert
      await expect(page.getByText("Invalid Invitation")).toBeVisible();
      await expect(
        page.getByText("This invitation link is invalid or has already been used."),
      ).toBeVisible();

      // Should have back to events button
      await expect(page.getByRole("button", { name: "Back to events" })).toBeVisible();
    });

    test("unauthenticated user is redirected to login with redirect param", async ({
      page,
    }) => {
      await clearAuthState(page);
      await page.goto("/join/registration/some-test-token");

      // Should redirect to login with the invite URL as redirect param
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("redirect=");
      expect(page.url()).toContain("join%2Fregistration");
    });
  });
});
