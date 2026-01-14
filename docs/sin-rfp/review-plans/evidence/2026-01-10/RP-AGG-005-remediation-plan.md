# RP-AGG-005 Remediation Plan

**Video:** RP-AGG-005 Analytics Export Flow
**Duration:** 53 frames / 26.5 seconds
**Analysis Date:** 2026-01-12
**Status:** NEEDS MAJOR REWORK

---

## Executive Summary

The RP-AGG-005 video fails to demonstrate the core analytics export workflow. 72% of the video (38 frames) shows a static, unconfigured pivot builder with no user interaction. The export button is never clicked, step-up authentication is never triggered, and only 1 organization appears in results (should be 10+). This video requires a complete script rewrite.

---

## Frame Analysis Summary

| Frame Range | Duration | Content                                    | Issue Level  |
| ----------- | -------- | ------------------------------------------ | ------------ |
| 1-38        | 19s      | Static pivot builder, no interaction       | **CRITICAL** |
| 39-41       | 1.5s     | Page scroll, loading starts                | OK           |
| 42-48       | 3.5s     | Loading spinner                            | Minor        |
| 49-53       | 2.5s     | Results with 1 org, export buttons visible | **CRITICAL** |

**Total Duration:** 26.5s
**Useful Content:** ~4s (frames 49-53)
**Wasted Frames:** 38/53 (72%)

---

## Issue Categorization

### 1. Script Issues (Recording Script Problems)

| Issue                       | Severity     | Description                                                                | Fix Location                                    |
| --------------------------- | ------------ | -------------------------------------------------------------------------- | ----------------------------------------------- |
| No pivot configuration      | **CRITICAL** | Script shows pivot builder but never drags fields to Rows/Columns/Measures | `scripts/record-sin-uat-rp-agg-005.ts:132-170`  |
| Export button never clicked | **CRITICAL** | Export CSV button visible in frame 49-53 but never activated               | `scripts/record-sin-uat-rp-agg-005.ts:193-208`  |
| No step-up auth triggered   | **CRITICAL** | Step-up auth is a key security feature but never appears                   | Blocked by export not clicking                  |
| No TOTP code entry          | **CRITICAL** | Should show MFA prompt for sensitive export operation                      | Blocked by step-up not triggering               |
| No success toast            | **CRITICAL** | "Export complete" toast never shown                                        | Blocked by export not completing                |
| Excessive static time       | **HIGH**     | 38 frames (19s) of identical content                                       | Script needs faster pacing, actual interactions |
| No "Save to Dashboard" flow | **MEDIUM**   | Feature exists but not demonstrated                                        | Script should navigate to saved dashboard       |

### 2. Data Issues

| Issue                          | Severity     | Description                                              | Fix Location                                            |
| ------------------------------ | ------------ | -------------------------------------------------------- | ------------------------------------------------------- |
| Only 1 organization in results | **CRITICAL** | Query returns single test org, should show 10+ for scale | `scripts/seed-sin-data.ts` - seed more form submissions |

### 3. Code Issues

| Issue           | Severity | Description              | Fix Location |
| --------------- | -------- | ------------------------ | ------------ |
| None identified | -        | Features appear to exist | N/A          |

### 4. MCP/Capture Issues

| Issue               | Severity | Description                      | Fix Location                                |
| ------------------- | -------- | -------------------------------- | ------------------------------------------- |
| Video ends abruptly | **LOW**  | No dashboard widget render shown | Script should wait for widget to fully load |

---

## Remediation Steps

### Priority 1: Script Rewrite (Required)

**File:** `scripts/record-sin-uat-rp-agg-005.ts`

The current script navigates to the analytics page but fails to perform the actual pivot building and export workflow. The `dragTo` helper is called but the drag operations appear to fail silently.

**Required Changes:**

1. **Fix drag-and-drop operations** (lines 132-170):
   - Verify `dragTo` helper actually performs the drag
   - Add explicit waits after each drag operation
   - Add visual verification that fields appear in dropzones

2. **Add explicit "Run Query" click** (after line 175):
   - The current script calls `page.getByRole("button", { name: "Run query" }).click()` but results suggest it's not executing
   - Add wait for results table to populate

3. **Complete the export flow with EXPLICIT ASSERTIONS** (lines 193-218):
   - The `completeStepUpIfNeeded` helper exists but is never reached because export button click fails
   - Add explicit screenshot before/after export click
   - **ASSERT step-up modal appears** - must verify modal is visible before proceeding:
     ```typescript
     await exportButton.click();
     // CRITICAL: Assert step-up modal appears (not just wait)
     const stepUpModal = page.getByRole('dialog').filter({ hasText: /verify|authentication|step-up/i });
     await expect(stepUpModal).toBeVisible({ timeout: 5000 });
     await takeScreenshot("step-up-modal-visible.png");
     ```
   - Generate and enter TOTP code
   - **ASSERT download occurs** - listen for download event or verify toast:

     ```typescript
     // Option 1: Listen for download event
     const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
     await verifyButton.click();
     const download = await downloadPromise;
     console.log('Downloaded file:', download.suggestedFilename());

     // Option 2: Assert toast appears with success message
     const exportToast = page.locator('[data-sonner-toast]').filter({ hasText: /export.*complete|downloaded/i });
     await expect(exportToast).toBeVisible({ timeout: 10000 });
     await takeScreenshot("export-complete-toast.png");
     ```

4. **Add Save to Dashboard flow** (new):
   - Click "Save to Dashboard" button
   - Enter dashboard name
   - Navigate to dashboard to show saved widget

**Revised Ideal Flow (60s):**

```
1. Analytics Explore page (2s)
2. Select "Form Submissions" dataset (3s)
3. Drag "Organization" to Rows (3s) - VISIBLE DRAG OPERATION
4. Drag "Status" to Columns (3s) - VISIBLE DRAG OPERATION
5. Drag "Count" to Measures (3s) - VISIBLE DRAG OPERATION
6. Click "Run Query" → table shows 10+ orgs (5s)
7. Click "Bar Chart" tab → chart renders (5s)
8. Click "Export CSV" → **ASSERT step-up auth modal visible** (3s)
9. Enter TOTP code → verify → **ASSERT download event fires** (5s)
10. **ASSERT download toast "Export complete" visible** (3s)
11. Click "Save to Dashboard" → name dialog (5s)
12. Navigate to dashboard → show saved widget (5s)
13. Widget fully rendered (3s)
```

### Priority 2: Data Seeding (Required)

**File:** `scripts/seed-sin-data.ts`

**Current State:** Only 1 organization appears in query results.

**Required Changes:**

Verify Phase 10 seeding creates sufficient form submissions across multiple organizations:

```typescript
// Ensure 30+ form submissions exist across 10+ organizations
// with varied statuses (submitted, approved, under_review, draft)
// and varied dates (spread over 90 days)
```

Check `IDS` for organization UUIDs and verify they're being used in form submission seeding.

### Priority 3: Verification (After Fix)

After script changes:

1. Re-run recording: `npx tsx scripts/record-sin-uat-rp-agg-005.ts`
2. Extract frames: `ffmpeg -i [video] -vf "fps=2" frames/frame_%03d.png`
3. Verify:
   - [ ] Pivot builder shows drag operations
   - [ ] 10+ organizations in results
   - [ ] Bar chart renders
   - [ ] Export button clicked
   - [ ] Step-up auth modal appears
   - [ ] TOTP code entered
   - [ ] Export toast shown
   - [ ] Dashboard widget renders fully
   - [ ] No static periods >5 frames (2.5s)

---

## Root Cause Analysis

### Why did the script fail?

1. **Silent drag failure**: The `dragTo` helper likely fails to complete the drag operation but doesn't throw an error. The Playwright drag-and-drop API can be finicky with certain UI frameworks.

2. **Missing explicit waits**: The script has `wait(500)` calls but these may not be sufficient for the pivot builder's debounced state updates.

3. **Dataset selection issue**: The script selects "Organizations" dataset but the VIDEO-IMPROVEMENT-ANALYSIS.md recommended "Form Submissions" dataset for more meaningful data.

4. **No error handling**: The script doesn't log or handle failures in the pivot building steps, making debugging difficult.

### Recommended Script Architecture

```typescript
// 1. Use explicit assertions after each action
await dragTo(page, sourceField, targetDropzone);
await expect(targetDropzone.locator('.field-chip')).toBeVisible(); // Verify drag succeeded

// 2. Use longer waits for complex UI operations
await wait(1000); // Give pivot builder time to update

// 3. Add fallback for drag failures
const fieldInDropzone = await targetDropzone.locator('.field-chip').isVisible();
if (!fieldInDropzone) {
  console.error('Drag operation failed, retrying...');
  await dragTo(page, sourceField, targetDropzone); // Retry once
}

// 4. Select correct dataset
const formSubmissionsDataset = page.getByRole("option", { name: /Form Submissions/i });
await formSubmissionsDataset.click();
```

---

## Timeline Estimate

| Task                          | Effort | Dependencies |
| ----------------------------- | ------ | ------------ |
| Debug and fix `dragTo` helper | Medium | None         |
| Rewrite script pivot building | Medium | dragTo fix   |
| Add export + step-up flow     | Low    | Pivot fix    |
| Verify seed data              | Low    | None         |
| Re-record video               | Low    | All above    |
| Re-verify with frame analysis | Low    | Re-record    |

**Total Effort:** Medium-High

---

## Acceptance Criteria

The remediated video must demonstrate:

1. Clear pivot builder configuration with visible drag operations
2. Query returning 10+ organizations with status breakdown
3. Bar chart visualization
4. Export CSV button click
5. **Step-up authentication modal VISIBLE** (script must assert `expect(modal).toBeVisible()`)
6. TOTP code entry in step-up modal
7. **Download event fires** (script must use `page.waitForEvent('download')` or assert toast)
8. **"Export complete" success toast VISIBLE** (script must assert toast visibility)
9. Save to Dashboard flow
10. Dashboard widget fully rendered
11. No static periods exceeding 2.5 seconds (5 frames)
12. Total duration 45-60 seconds

### Required Script Assertions (Non-Negotiable)

The recording script MUST include these explicit assertions to pass review:

```typescript
// 1. Step-up modal assertion
const stepUpModal = page.getByRole('dialog').filter({ hasText: /step-up|verify/i });
await expect(stepUpModal).toBeVisible({ timeout: 5000 });

// 2. Download event assertion (pick one)
const download = await page.waitForEvent('download', { timeout: 10000 });
// OR
const exportToast = page.locator('[data-sonner-toast]').filter({ hasText: /export.*complete/i });
await expect(exportToast).toBeVisible({ timeout: 10000 });
```

Without these assertions, the video may show the buttons but miss the actual proof that step-up and export work.

---

## Related Documents

- [VIDEO-IMPROVEMENT-ANALYSIS.md](./VIDEO-IMPROVEMENT-ANALYSIS.md) - Original analysis
- [VIDEO-EXCELLENCE-PLAN.md](./VIDEO-EXCELLENCE-PLAN.md) - Quality standards
- `scripts/record-sin-uat-rp-agg-005.ts` - Recording script
- `scripts/seed-sin-data.ts` - Data seeding script
