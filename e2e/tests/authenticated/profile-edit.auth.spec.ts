import { expect, test } from "../../fixtures/auth-fixtures";

test.describe("Profile Edit", () => {
  test.beforeEach(async ({ page }) => {
    // Just navigate - we're already authenticated via storageState
    await page.goto("/dashboard/profile");

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
    await expect(page.getByText("profile-edit@example.com")).toBeVisible();
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
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Wait for edit mode to be fully activated
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();

    // Update privacy settings
    await page.getByLabel("Show my email address to team members").check();
    await page.getByLabel("Show my phone number to team members").check();

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

    // Check that privacy settings are displayed correctly
    await expect(page.getByText("Email visibility:")).toBeVisible();
    await expect(page.getByText("Visible to team members")).toBeVisible();
    await expect(page.getByText("Phone visibility:")).toBeVisible();
  });
});
