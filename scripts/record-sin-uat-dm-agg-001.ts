#!/usr/bin/env tsx
/**
 * DM-AGG-001: Record form creation and submission flow.
 * Demonstrates form builder, publishing, and user submission.
 */

import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";

import {
  config,
  createScreenshotHelper,
  finalizeVideo,
  getTimestamp,
  setupEvidenceCapture,
  waitForIdle,
} from "./sin-uat-evidence-utils";

const reqId = "DM-AGG-001";
const stamp = getTimestamp();
const videoName = `${reqId}-form-submission-flow-${stamp}.mp4`;
const pdfPath = path.join(process.cwd(), "tmp-usage-report.pdf");
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  // Create a minimal valid PDF for upload
  // This is the smallest valid PDF that passes most validators
  const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
196
%%EOF`;
  await writeFile(pdfPath, minimalPdf);

  const { browser, context, page, videoDir, screenshotDir } = await setupEvidenceCapture(
    reqId,
    { recordLogin: false },
  );
  const takeScreenshot = createScreenshotHelper(page, screenshotDir);

  await waitForIdle(page);
  await takeScreenshot("00-dashboard-post-login.png");

  // Navigate to Forms admin to show form builder
  console.log("Navigating to Forms admin...");
  await page.goto(`${config.baseUrl}/dashboard/admin/sin/forms`, {
    waitUntil: "networkidle",
  });
  await waitForIdle(page);
  await wait(1000);

  // Select the seeded Facility Usage Survey if visible
  const adminFormButton = page
    .getByRole("button")
    .filter({ hasText: /Facility Usage Survey/i })
    .first();
  if (await adminFormButton.isVisible().catch(() => false)) {
    await adminFormButton.click();
    await wait(800);
  }
  await takeScreenshot("01-form-builder-selected.png");

  // Attempt to publish (if button exists) to show success badge
  const publishButton = page.getByRole("button", { name: /Publish form/i });
  if (await publishButton.isVisible().catch(() => false)) {
    await publishButton.scrollIntoViewIfNeeded();
    await wait(300);
    await publishButton.click();
    await page
      .getByText(/published|success/i)
      .first()
      .waitFor({ timeout: 5_000 })
      .catch(() => {});
    await wait(400);
  }

  // Show form preview section with published badge
  const previewHeader = page.getByText("Preview & submit", { exact: false });
  if (await previewHeader.isVisible().catch(() => false)) {
    await previewHeader.scrollIntoViewIfNeeded();
    await wait(600);
  }
  await takeScreenshot("02-form-preview-admin.png");

  // Navigate to user forms view via sidebar (avoid download error)
  console.log("Navigating to user forms view via sidebar...");
  const formsLink = page.getByRole("link", { name: "Forms", exact: true }).first();
  await formsLink.waitFor({ state: "visible", timeout: 10_000 });
  await formsLink.click();
  await waitForIdle(page);
  await wait(1000);

  // Handle org selection if shown
  if (page.url().includes("/select-org")) {
    console.log("Selecting organization...");
    const combobox = page.getByRole("combobox");
    await combobox.waitFor({ state: "visible", timeout: 10_000 });
    await combobox.click();
    await wait(500);
    // Select viaSport BC
    const viasportOption = page.getByRole("option", { name: /viaSport BC/i });
    if (await viasportOption.isVisible().catch(() => false)) {
      await viasportOption.click();
    } else {
      await page.getByRole("option").first().click();
    }
    await wait(1500);
    await waitForIdle(page);
  }
  await takeScreenshot("03-forms-list-view.png");

  // Wait for forms to load, then click "Open form" link
  const openFormLink = page.getByRole("link", { name: "Open form" }).first();
  await openFormLink.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});

  let formClicked = false;
  if (await openFormLink.isVisible().catch(() => false)) {
    await openFormLink.click();
    formClicked = true;
  }

  if (formClicked) {
    await waitForIdle(page);
    await wait(1500);

    // Fill form fields (handle different field types)
    console.log("Filling form fields...");

    // Fill text fields - try each field gracefully
    const facilityInput = page.getByLabel("Facility Name");
    await facilityInput.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if (await facilityInput.isVisible().catch(() => false)) {
      await facilityInput.fill("Richmond Olympic Oval");
      console.log("Filled Facility Name");
    }

    // For date field - it's a complex picker with YYYY/MM/DD inputs
    // IMPORTANT: Date validation requires dates between 1906-2013
    // Use getByRole for more reliable selection
    const yearInput = page.getByRole("textbox", { name: "Year" });
    const monthInput = page.getByRole("textbox", { name: "Month" });
    const dayInput = page.getByRole("textbox", { name: "Day" });

    // Wait for date inputs to be available
    await yearInput.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});

    if (await yearInput.isVisible().catch(() => false)) {
      await yearInput.fill("2010");
      console.log("Filled Year: 2010");
      await wait(100);
    } else {
      console.log("Warning: Year input not visible");
    }
    if (await monthInput.isVisible().catch(() => false)) {
      await monthInput.fill("06");
      console.log("Filled Month: 06");
      await wait(100);
    } else {
      console.log("Warning: Month input not visible");
    }
    if (await dayInput.isVisible().catch(() => false)) {
      await dayInput.fill("15");
      console.log("Filled Day: 15");
      await wait(100);
    } else {
      console.log("Warning: Day input not visible");
    }

    // Number fields
    const hoursInput = page.getByLabel(/Total Hours Used|Hours/i);
    if (await hoursInput.isVisible().catch(() => false)) {
      await hoursInput.fill("42");
    }

    // Upload PDF file - the input is hidden but accessible via setInputFiles
    // Note: The file field is required for this form
    const fileInput = page.locator('input[type="file"]').first();
    const fileInputCount = await fileInput.count();
    if (fileInputCount > 0) {
      await fileInput.setInputFiles(pdfPath);
      console.log("PDF file uploaded");
      await wait(800);
    } else {
      console.log("Warning: No file input found");
    }

    await wait(500);
    await takeScreenshot("04-form-filled-entry.png");

    // Submit form - scroll to make sure Submit button is visible
    console.log("Submitting form...");
    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.scrollIntoViewIfNeeded();
    await wait(500);

    // Take screenshot before clicking to show filled form
    await takeScreenshot("04b-form-ready-to-submit.png");

    // Ensure button is enabled and click with retry
    await submitButton.waitFor({ state: "visible", timeout: 5000 });
    console.log("Submit button is visible, clicking...");

    // Click and wait for network activity
    await Promise.all([
      page
        .waitForResponse(
          (resp) => resp.url().includes("_serverFn") && resp.status() === 200,
          { timeout: 15_000 },
        )
        .catch(() => console.log("No server response detected")),
      submitButton.click(),
    ]);
    console.log("Submit button clicked, waiting for response...");

    // Wait for either success toast or new submission in history
    await wait(3000);

    // Check for success toast
    const successToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /success|submitted/i });
    const hasToast = await successToast.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasToast) {
      console.log("Success toast visible");
    } else {
      console.log("No toast visible - checking for new submission in history...");
    }

    // Reload page to ensure we see the new submission
    await page.reload({ waitUntil: "networkidle" });
    await wait(1500);
    await takeScreenshot("05-form-submission-success.png");

    // Scroll down to show submission history with new entry
    const submissionHistory = page.getByText("Submission history");
    if (await submissionHistory.isVisible().catch(() => false)) {
      await submissionHistory.scrollIntoViewIfNeeded();
      await wait(800);
      await takeScreenshot("06-submission-history.png");
    }

    // Check for submissions tab (alternative view)
    const submissionsTab = page.getByRole("tab", { name: /Submissions/i }).first();
    if (await submissionsTab.isVisible().catch(() => false)) {
      await submissionsTab.click();
      await wait(800);
      await takeScreenshot("07-my-submissions-list.png");
    }

    // Show latest submission detail for admin review context
    const submissionLink = page.getByRole("link", { name: /Submission|View/i }).first();
    if (await submissionLink.isVisible().catch(() => false)) {
      await submissionLink.click();
      await waitForIdle(page);
      await wait(700);
      await takeScreenshot("08-submission-detail.png");
    }
  } else {
    console.log("No form found to click, capturing current state...");
    await takeScreenshot("04-no-form-found.png");
  }

  // Cleanup
  await unlink(pdfPath).catch(() => {});

  await finalizeVideo(page, context, browser, videoDir, videoName);
};

run().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
