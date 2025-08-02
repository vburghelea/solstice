import { expect, test } from "@playwright/test";

test.describe("Profile Edit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/profile");
  });

  test("should display current profile information", async ({ page }) => {
    // Check page title
    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();

    // Check basic information card
    await expect(page.getByText("Basic Information")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
  });

  test("should toggle edit mode", async ({ page }) => {
    // Click edit button
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Check that save and cancel buttons appear
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();

    // Check that input fields are visible
    await expect(page.getByLabel("Date of Birth")).toBeVisible();
    await expect(page.getByLabel("Phone Number")).toBeVisible();
    await expect(page.getByLabel("Gender")).toBeVisible();
    await expect(page.getByLabel("Pronouns")).toBeVisible();
  });

  test("should cancel editing", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Make some changes
    await page.getByLabel("Phone Number").fill("+1 (555) 123-4567");

    // Cancel editing
    await page.getByRole("button", { name: /Cancel/i }).click();

    // Check that edit button is back
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible();

    // Check that changes were not saved
    await expect(page.getByText("+1 (555) 123-4567")).not.toBeVisible();
  });

  test("should save profile changes", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Fill in some fields
    await page.getByLabel("Phone Number").fill("+1 (555) 987-6543");
    await page.getByLabel("Pronouns").fill("they/them");

    // Select gender
    await page.getByLabel("Gender").click();
    await page.getByRole("option", { name: "Non-binary" }).click();

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible();

    // Check that edit button is back
    await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible();

    // Check that changes are displayed
    await expect(page.getByText("+1 (555) 987-6543")).toBeVisible();
    await expect(page.getByText("they/them")).toBeVisible();
    await expect(page.getByText("non-binary")).toBeVisible();
  });

  test("should update emergency contact", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Fill emergency contact information
    await page.getByLabel("Contact Name").fill("Jane Doe");
    await page.getByLabel("Relationship").fill("Spouse");
    await page.getByLabel("Contact Phone").fill("+1 (555) 111-2222");
    await page.getByLabel("Contact Email").fill("jane.doe@example.com");

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible();

    // Check that emergency contact is displayed
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.getByText("Spouse")).toBeVisible();
    await expect(page.getByText("+1 (555) 111-2222")).toBeVisible();
    await expect(page.getByText("jane.doe@example.com")).toBeVisible();
  });

  test("should update privacy settings", async ({ page }) => {
    // Enter edit mode
    await page.getByRole("button", { name: /Edit Profile/i }).click();

    // Update privacy settings
    await page.getByLabel("Show my email address to team members").check();
    await page.getByLabel("Show my phone number to team members").check();

    // Save changes
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible();

    // Check that privacy settings are displayed correctly
    await expect(page.getByText("Email visibility:")).toBeVisible();
    await expect(page.getByText("Visible to team members")).toBeVisible();
    await expect(page.getByText("Phone visibility:")).toBeVisible();
  });
});
