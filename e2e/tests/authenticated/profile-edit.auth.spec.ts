import { expect, test } from "@playwright/test";
import { gotoWithAuth } from "../../utils/auth";

const PROFILE_USER = {
  email: "profile-edit@example.com",
  password: "testpassword123",
};

test.describe("Profile Edit", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page with authentication
    await gotoWithAuth(page, "/dashboard/profile", PROFILE_USER);

    // Wait for the page to be ready
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display current profile information", async ({ page }) => {
    // Already on profile page from beforeEach

    // Check page title
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible({
      timeout: 10000,
    });

    // Check basic information card
    await expect(page.getByText("Basic Information")).toBeVisible();
    await expect(page.getByText("Email", { exact: true })).toBeVisible();
    await expect(page.getByText(PROFILE_USER.email)).toBeVisible();
  });

  test("should toggle edit mode", async ({ page }) => {
    // Click edit button
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Check that save and cancel buttons appear
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();

    // Check that input fields are visible - use more specific selectors
    await expect(page.getByLabel("Date of Birth")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Phone Number" })).toBeVisible();
    await expect(page.getByLabel("Gender")).toBeVisible();
    await expect(page.getByLabel("Pronouns")).toBeVisible();
  });

  test("should cancel editing", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Wait for edit mode to be fully activated
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Make some changes
    await page.getByRole("textbox", { name: "Phone Number" }).fill("+1 (555) 123-4567");

    // Cancel editing
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Wait for the form to reset and edit mode to exit
    // The Cancel button should disappear first
    await expect(page.getByRole("button", { name: /Cancel/i })).not.toBeVisible({
      timeout: 10000,
    });

    // Then the edit button should be visible again
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible({
      timeout: 10000,
    });

    // Check that changes were not saved - the new phone number should not be visible
    await expect(page.getByText("+1 (555) 123-4567")).not.toBeVisible();
  });

  test("should save profile changes", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Wait for edit mode to be fully activated
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Fill in some fields
    await page.getByRole("textbox", { name: "Phone Number" }).fill("+1 (555) 987-6543");
    await page.getByLabel("Pronouns").fill("they/them");

    // Select gender
    await page.getByLabel("Gender").click();
    await page.getByRole("option", { name: "Non-binary" }).click();

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible({
      timeout: 10000,
    });

    // Wait for edit mode to exit - Save Changes button should disappear
    await expect(page.getByRole("button", { name: /Save Changes/i })).not.toBeVisible({
      timeout: 10000,
    });

    // Check that edit button is back (this waits for the UI to update)
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible({
      timeout: 10000,
    });

    // Check that changes are displayed
    await expect(page.getByText("+1 (555) 987-6543")).toBeVisible();
    await expect(page.getByText("they/them")).toBeVisible();
    await expect(page.getByText("non-binary")).toBeVisible();
  });

  test("should update emergency contact", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Wait for edit mode to be fully activated
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Fill emergency contact information
    await page.getByLabel("Contact Name").fill("Jane Doe");
    await page.getByLabel("Relationship").fill("Spouse");
    await page.getByLabel("Contact Phone").fill("+1 (555) 111-2222");
    await page.getByLabel("Contact Email").fill("jane.doe@example.com");

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible({
      timeout: 10000,
    });

    // Wait for edit mode to exit - Save Changes button should disappear
    await expect(page.getByRole("button", { name: /Save Changes/i })).not.toBeVisible({
      timeout: 10000,
    });

    // Check that edit mode is exited
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible({
      timeout: 10000,
    });

    // Check that emergency contact is displayed
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.getByText("Spouse")).toBeVisible();
    await expect(page.getByText("+1 (555) 111-2222")).toBeVisible();
    await expect(page.getByText("jane.doe@example.com")).toBeVisible();
  });

  test("should update privacy settings", async ({ page }) => {
    // First ensure the profile data is loaded
    await expect(page.getByText(PROFILE_USER.email)).toBeVisible();

    // Wait for privacy settings to be visible to ensure data is loaded
    await expect(page.getByText("Email visibility:")).toBeVisible();

    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Wait for edit mode to be fully activated
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Wait for the form to load completely and verify fields are populated
    await page.waitForTimeout(1000);

    // Verify that existing data is loaded (date of birth should be populated)
    const dateInput = page.getByLabel("Date of Birth");
    await expect(dateInput).toHaveValue(/\d{4}-\d{2}-\d{2}/);

    // Since we're just updating privacy settings, we only need to toggle the checkboxes
    // The test user already has a complete profile from the seed data

    // Toggle privacy checkboxes to ensure they're checked
    const emailCheckbox = page.getByLabel("Show my email address to team members");
    const phoneCheckbox = page.getByLabel("Show my phone number to team members");

    // Check them if not already checked
    if (!(await emailCheckbox.isChecked())) {
      await emailCheckbox.check();
    }
    if (!(await phoneCheckbox.isChecked())) {
      await phoneCheckbox.check();
    }

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast or handle error
    const toastResult = await Promise.race([
      page
        .waitForSelector("text=Profile updated successfully", { timeout: 10000 })
        .then(() => "success"),
      page
        .waitForSelector("text=Required", { timeout: 2000 })
        .then(() => "validation-error"),
    ]).catch(() => null);

    if (toastResult === "validation-error") {
      // Log the error for debugging
      const errorText = await page
        .locator("text=Required")
        .first()
        .locator("..")
        .textContent();
      console.log("Validation error:", errorText);
      throw new Error(`Profile update failed with validation error: ${errorText}`);
    }

    // If we got here, it should be success
    await expect(page.getByText("Profile updated successfully")).toBeVisible({
      timeout: 5000,
    });

    // Wait for edit mode to exit - Save Changes button should disappear
    await expect(page.getByRole("button", { name: /Save Changes/i })).not.toBeVisible({
      timeout: 10000,
    });

    // Check that edit mode is exited
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible({
      timeout: 10000,
    });

    // Check that privacy settings are displayed correctly
    await expect(page.getByText("Email visibility:")).toBeVisible();
    await expect(page.getByText("Phone visibility:")).toBeVisible();

    // Check that both are set to visible (find the paragraphs containing the visibility status)
    const emailVisibility = page.locator("p:has-text('Email visibility:')");
    const phoneVisibility = page.locator("p:has-text('Phone visibility:')");

    await expect(emailVisibility).toContainText("Visible to team members");
    await expect(phoneVisibility).toContainText("Visible to team members");
  });
});
