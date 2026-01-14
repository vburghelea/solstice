# DM-AGG-006 Import Wizard - Remediation Plan

**Video:** DM-AGG-006-import-wizard-flow-FINAL.mp4
**Duration:** 53.5 seconds (107 frames @ 2fps)
**Quality Rating:** 4/10
**Analysis Date:** 2026-01-12

---

## Executive Summary

The DM-AGG-006 import wizard video captures most of the workflow correctly but has critical issues:

1. Video ends without showing import completion (stuck on "pending" status)
2. Row count ("50 rows imported") never displayed
3. Excessive static content in mapping phase (15 seconds unchanged)
4. No success confirmation message

---

## Frame Analysis Summary

| Section                      | Frames | Duration | Status         |
| ---------------------------- | ------ | -------- | -------------- |
| Authentication (Login + MFA) | 2-14   | ~6s      | OK             |
| Organization Selection       | 15-19  | ~2s      | OK             |
| Admin Dashboard Navigation   | 20-24  | ~2s      | OK             |
| Import Wizard - Upload Tab   | 25-44  | ~10s     | OK             |
| Import Wizard - Map Tab      | 45-74  | ~15s     | **TOO LONG**   |
| Import Wizard - Review Tab   | 75-107 | ~16s     | **INCOMPLETE** |

---

## Issue Categorization

### 1. Script Issues (Recording Script Problems)

| Issue                               | Frames  | Severity | Description                                                                                   | Remediation                                                              |
| ----------------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Import not executed**             | 95-107  | CRITICAL | Script shows "Run import" button but import never completes; video ends with "pending" status | Add `await` for import completion; poll status until "completed"         |
| **Excessive wait in mapping phase** | 45-74   | HIGH     | 30 frames (15s) of static mapping interface                                                   | Reduce `wait()` calls in mapping section; add interactions               |
| **No navigation to submissions**    | 105-107 | CRITICAL | Script ends before showing imported data in Form Submissions                                  | Add navigation to `/dashboard/sin/forms` → select form → Submissions tab |
| **Template download not captured**  | 35-39   | MEDIUM   | Template download buttons visible but download action not shown                               | Script tries download but may not wait for completion indicator          |

**Script Fix Required:** `scripts/record-sin-uat-dm-agg-006.ts`

```typescript
// PROBLEM (lines 143-155):
const runImportButton = page.getByRole("button", { name: /Run import|Run batch import/i });
if (await runImportButton.isEnabled().catch(() => false)) {
  await runImportButton.click();
}
await wait(1500);  // Too short - doesn't wait for completion

// FIX: Wait for completion status
await runImportButton.click();
// Poll for completion instead of fixed wait
const completedStatus = page.getByText(/completed/i).first();
await completedStatus.waitFor({ state: 'visible', timeout: 30_000 });
await wait(2000); // Brief pause to capture completion state
```

### 2. Data Issues (Seed/Environment Problems)

| Issue                                   | Frames | Severity | Description                                               | Remediation                                                                       |
| --------------------------------------- | ------ | -------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Previous imports stuck in "pending"** | 95+    | MEDIUM   | Import history shows 2 pending imports from previous runs | Clear import history before recording OR ensure seed creates clean state          |
| **Error CSV validation not detailed**   | 85-89  | LOW      | Shows "Total errors: 12" but specific errors not visible  | Consider expanding error panel in script OR accept as-is (shows validation works) |

**Data Fix:** `scripts/seed-sin-data.ts`

Consider adding cleanup of existing import jobs before recording:

```typescript
// In Phase 11 or new cleanup phase:
// Delete any 'pending' or 'validating' import jobs for demo org
await db.delete(importJobs)
  .where(and(
    eq(importJobs.organizationId, IDS.viasportBcId),
    inArray(importJobs.status, ['pending', 'validating'])
  ));
```

### 3. Code Issues (Application Bugs)

| Issue           | Frames | Severity | Description                          | Remediation            |
| --------------- | ------ | -------- | ------------------------------------ | ---------------------- |
| None identified | -      | -        | Import wizard UI functions correctly | No code changes needed |

### 4. MCP/Capture Issues (Recording Artifacts)

| Issue                                 | Frames | Severity | Description                       | Remediation                                          |
| ------------------------------------- | ------ | -------- | --------------------------------- | ---------------------------------------------------- |
| **Blank opening frame**               | 1      | LOW      | Single white frame at video start | Add initial wait or trim first frame with ffmpeg     |
| **No transitions in static sections** | 45-74  | MEDIUM   | Appears frozen to viewer          | Add mouse movements or scrolling during wait periods |

---

## Remediation Priority

### Priority 1: CRITICAL (Must Fix)

1. **Script: Wait for import completion**
   - File: `scripts/record-sin-uat-dm-agg-006.ts`
   - Change: Replace fixed `wait(1500)` with polling for "completed" status
   - Expected result: Import history shows "completed" instead of "pending"

2. **Script: Navigate to imported submissions**
   - File: `scripts/record-sin-uat-dm-agg-006.ts`
   - Change: After import completes, navigate to Form Submissions tab and show imported rows
   - Expected result: Video shows "50 rows" or similar count confirmation

### Priority 2: HIGH (Should Fix)

3. **Script: Reduce mapping phase duration**
   - File: `scripts/record-sin-uat-dm-agg-006.ts`
   - Change: Reduce wait times in mapping section (lines ~128-140)
   - Expected result: Mapping phase under 5 seconds

4. **Data: Clean import history before recording**
   - File: `scripts/seed-sin-data.ts` OR pre-recording cleanup
   - Change: Delete stale pending imports for demo organization
   - Expected result: Import history starts clean, only shows current import

### Priority 3: LOW (Nice to Have)

5. **Capture: Trim blank opening frame**
   - Command: `ffmpeg -i input.mp4 -ss 0.5 -c copy output.mp4`
   - Expected result: Video starts immediately on login page

6. **Script: Add micro-interactions during static periods**
   - File: `scripts/record-sin-uat-dm-agg-006.ts`
   - Change: Add subtle mouse movements or scroll actions during mapping review
   - Expected result: Video feels more dynamic, less "frozen"

---

## Detailed Script Fixes

### Fix 1: Import Completion Wait

**Location:** `scripts/record-sin-uat-dm-agg-006.ts` lines 143-157

**Current Code:**

```typescript
console.log("Running import...");
const runImportButton = page.getByRole("button", {
  name: /Run import|Run batch import/i,
});
if (await runImportButton.isEnabled().catch(() => false)) {
  await runImportButton.click();
}

await wait(1500);
await takeScreenshot("03-import-running.png");

const completedBadge = page.getByText(/completed/i).first();
await completedBadge.waitFor({ timeout: 12_000 }).catch(() => {});
```

**Problem:** The `completedBadge.waitFor()` is finding ANY "completed" text, possibly from old imports in the history. The actual import job stays "pending".

**Fixed Code:**

```typescript
console.log("Running import...");
const runImportButton = page.getByRole("button", {
  name: /Run import|Run batch import/i,
});
if (await runImportButton.isEnabled().catch(() => false)) {
  await runImportButton.click();
  await takeScreenshot("03-import-running.png");

  // Wait for import to actually complete
  console.log("Waiting for import to complete...");

  // IMPORTANT: Tie completion to the SPECIFIC job by file name to avoid false positives
  // from old "completed" rows if table sorting changes or stale entries exist
  const csvFileName = "import-demo-annual-stats-large.csv";

  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max
  while (attempts < maxAttempts) {
    await wait(1000);

    // Find the row containing our specific file name, then check its status
    const jobRow = page.locator('table tbody tr', { hasText: csvFileName });
    const jobStatus = jobRow.getByText(/completed/i);

    if (await jobStatus.isVisible().catch(() => false)) {
      console.log(`Import completed for ${csvFileName}!`);
      break;
    }

    // Alternative: check if status changed from "pending"/"processing"
    const stillPending = jobRow.getByText(/pending|processing/i);
    if (!(await stillPending.isVisible().catch(() => false))) {
      // Status is neither pending nor processing - likely completed or error
      console.log("Status changed from pending/processing");
      break;
    }

    attempts++;
    console.log(`Import still running... attempt ${attempts}/${maxAttempts}`);
  }

  await wait(800);
  await takeScreenshot("04-import-complete.png");
}
```

> **Note:** This approach ties completion detection to the specific CSV file name (`import-demo-annual-stats-large.csv`) rather than relying on row position. This prevents false positives from old "completed" imports if table sorting changes or stale entries exist.

### Fix 2: Navigate to Imported Submissions

**Location:** `scripts/record-sin-uat-dm-agg-006.ts` lines 167-201

**Current Code:** Already attempts this but may fail. Ensure robust navigation:

```typescript
// After import history screenshot...
console.log("Navigating to Form Submissions to verify imported data...");

// Navigate to forms list
await safeGoto(page, `${config.baseUrl}/dashboard/sin/forms`);
await waitForIdle(page);

// Find and click the Annual Statistics form
const formCard = page.getByRole("link", { name: /Annual Statistics Report/i }).first();
await formCard.waitFor({ state: "visible", timeout: 10_000 });
await formCard.click();
await waitForIdle(page);

// Click Submissions tab
const submissionsTab = page.getByRole("tab", { name: /Submissions/i });
await submissionsTab.waitFor({ state: "visible", timeout: 5_000 });
await submissionsTab.click();
await waitForIdle(page);
await wait(1500);

// Capture the submissions list showing imported data
await takeScreenshot("06-imported-submissions.png");

// Look for row count indicator
const rowCount = page.getByText(/showing \d+ of \d+|50 submissions|rows/i);
if (await rowCount.isVisible().catch(() => false)) {
  console.log("Row count visible - import verification complete");
}
```

---

## Validation Checklist

After re-recording, verify:

- [ ] Video starts cleanly (no blank frame)
- [ ] Authentication completes in <8 seconds
- [ ] Import wizard navigation is smooth
- [ ] File upload shows validation (12 errors for error CSV)
- [ ] Clean CSV upload shows "50 rows" or similar
- [ ] Import status changes from "pending" → "processing" → "completed"
- [ ] Import history shows "completed" status (not "pending")
- [ ] Final section shows imported submissions in form
- [ ] Total video duration: 60-90 seconds (current 53s may be too short)
- [ ] No static sections >5 seconds

---

## Re-Recording Command

```bash
# From project root:
npx tsx scripts/record-sin-uat-dm-agg-006.ts

# After recording, extract frames to verify:
VIDEO="DM-AGG-006-import-wizard-flow-$(date +%Y%m%dT%H%M).mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/${VIDEO%.mp4}"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

---

## Appendix: Frame-by-Frame Reference

| Frames | Content                     | Notes                                         |
| ------ | --------------------------- | --------------------------------------------- |
| 1      | Blank                       | Trim candidate                                |
| 2-14   | Login → MFA                 | Good flow                                     |
| 15-24  | Org selection → Dashboard   | Good flow                                     |
| 25-44  | Import wizard Upload tab    | Template buttons visible                      |
| 45-74  | Mapping interface           | **30 frames static - needs reduction**        |
| 75-89  | Review tab with validation  | Shows 12 errors                               |
| 90-94  | Import button state changes | "Importing..." visible                        |
| 95-107 | Import history              | **CRITICAL: Shows "pending" not "completed"** |

---

_Generated: 2026-01-12 | Agent: Claude Opus - DM-AGG-006 Video Review_
