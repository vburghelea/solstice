# RP-AGG-003 Remediation Plan

**Video:** RP-AGG-003-reporting-workflow-flow-FINAL.mp4
**Duration:** ~10 seconds (20 frames at 2fps)
**Overall Assessment:** NEEDS_WORK
**Date:** 2026-01-12

---

## Executive Summary

The current RP-AGG-003 video is **NOT blank** (contradicting the previous report in VIDEO-IMPROVEMENT-ANALYSIS.md), but it fails to demonstrate the complete reporting workflow. The video shows partial cycle creation and task assignment forms but never completes any workflow steps. It stays entirely in the admin view with no user perspective shown.

---

## Frame Analysis Summary

| Metric                  | Value       |
| ----------------------- | ----------- |
| Total frames            | 20          |
| Duration                | ~10 seconds |
| Blank frames            | 0           |
| Static/duplicate frames | 14 (70%)    |
| Unique content frames   | 6           |

### Content Breakdown:

- **Frames 1-7 (3.5s):** Reporting admin page, mostly static
- **Frames 8-9 (1s):** Task assignment form visible
- **Frame 10 (0.5s):** Scrolled back up
- **Frames 11-12 (1s):** "Q2 2026 Quarterly" typed in cycle name field
- **Frames 13-20 (4s):** Static view of submissions table

---

## Issues by Category

### 1. Script Issues (Workflow Not Executed)

| Issue                     | Severity | Description                                                         |
| ------------------------- | -------- | ------------------------------------------------------------------- |
| Cycle creation incomplete | Critical | "Q2 2026 Quarterly" typed but Create button never clicked           |
| Task assignment skipped   | Critical | Form visible but never filled or submitted                          |
| No user perspective       | Critical | Video stays in admin view; no `/dashboard/sin/reporting` navigation |
| No task completion        | Critical | No form filling or submission from user perspective                 |
| No admin approval         | Critical | No review/approve workflow demonstrated                             |
| Excessive static frames   | Major    | 14 of 20 frames are duplicates                                      |
| Video too short           | Major    | 10 seconds insufficient for full workflow (target: 90s)             |

### 2. Data Issues

| Issue                 | Severity | Description                                                                                |
| --------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Existing data visible | None     | Submissions table shows 5 BC Hockey entries with varied statuses - data seeding is working |

### 3. Code Issues

| Issue                   | Severity | Description                                                      |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| No code issues detected | None     | UI appears functional; task form and cycle form render correctly |

### 4. MCP/Capture Issues

| Issue           | Severity | Description                                                                 |
| --------------- | -------- | --------------------------------------------------------------------------- |
| Video not blank | Fixed    | Previous report of "ALL BLANK FRAMES" was incorrect or from older recording |

---

## Root Cause Analysis

The script `record-sin-uat-rp-agg-003.ts` appears to have the correct workflow logic but execution may have:

1. Timed out before completing key steps
2. Failed silently on dropdowns/button clicks
3. Not waited long enough for toasts/confirmations
4. Encountered session/auth issues preventing user switch

The `adminOnly` option being set or the hasOpenForm=false check bypassing user flow is likely the cause.

---

## Remediation Actions

### Priority 1: Fix Script Execution (Script Issue)

**File:** `scripts/record-sin-uat-rp-agg-003.ts`

1. **Ensure cycle creation completes:**
   - Line 93: Verify `page.getByRole("button", { name: /Create cycle/i }).click()` executes
   - Add explicit wait for success toast with retry logic
   - Screenshot after toast confirms creation

2. **Ensure task assignment completes:**
   - Lines 116-188: Dropdown selections may fail silently
   - Add `.waitFor({ state: 'visible' })` before each dropdown click
   - Add retry logic for option selection
   - Verify "Create task" button click and success toast

3. **Remove user flow bypass:**
   - Line 228: `const hasOpenForm = false;` hardcodes skip of user flow
   - Change to dynamically check for openFormLink visibility
   - Add proper session handling for user perspective switch

4. **Extend wait times:**
   - Add longer waits after navigation (currently 800ms may be insufficient)
   - Wait for network idle after key actions

### Priority 2: Add User Perspective (Script Issue)

**Required additions to script:**

```typescript
// After admin creates task, navigate to user reporting view
await safeGoto(page, `${config.baseUrl}/dashboard/sin/reporting`);
await waitForIdle(page);
await takeScreenshot("user-task-queue.png");

// Find assigned task and click to open form
const myTask = page.getByText("Demo Task - viaSport BC").first();
await myTask.click();
await waitForIdle(page);

// Fill the Annual Statistics form
// ... fill required fields ...

// Submit
await page.getByRole("button", { name: "Submit" }).click();
await page.getByText(/submitted/i).waitFor({ timeout: 10_000 });
await takeScreenshot("user-submission-success.png");
```

### Priority 3: Add Admin Approval Flow (Script Issue)

**Required additions to script:**

```typescript
// Return to admin view
await safeGoto(page, `${config.baseUrl}/dashboard/admin/sin/reporting`);
await waitForIdle(page);

// Click on submitted entry
const submittedRow = page.getByRole("row").filter({ hasText: /submitted/i }).first();
await submittedRow.click();
await wait(800);

// Update status to approved
const statusSelect = page.getByRole("combobox", { name: /status/i });
await statusSelect.click();
await page.getByRole("option", { name: /approved/i }).click();
await page.getByRole("button", { name: /update/i }).click();
await takeScreenshot("admin-approval-complete.png");
```

### Priority 4: Improve Pacing (Script Issue)

1. Reduce static frame sequences by removing redundant waits
2. Target 90 seconds total duration
3. Ensure meaningful content in every 0.5s of video

---

## Verification Checklist

After re-recording, verify:

- [ ] Cycle creation: "Q2 2026 Quarterly" created with success toast
- [ ] Task assignment: Task assigned to viaSport BC with reminder preview
- [ ] User perspective: Switch to `/dashboard/sin/reporting` shows task queue
- [ ] Task completion: User fills and submits form successfully
- [ ] Admin approval: Admin changes status from "submitted" to "approved"
- [ ] Status transitions visible: At least one status change shown in table
- [ ] No blank frames
- [ ] No static sequences > 5 seconds
- [ ] Total duration 60-90 seconds

---

## Estimated Effort

| Task                         | Effort | Owner     |
| ---------------------------- | ------ | --------- |
| Fix script dropdown handling | Medium | Developer |
| Add user perspective flow    | High   | Developer |
| Add admin approval flow      | Medium | Developer |
| Re-record with fixed script  | Low    | Automated |
| Frame review verification    | Low    | Agent     |

**Total:** High effort - requires script rewrite with session handling

---

## Dependencies

- Script: `scripts/record-sin-uat-rp-agg-003.ts`
- Data: Seed script already provides cycles, tasks, and submissions
- Environment: sin-uat with MFA-enabled user

---

## Related Files

| File                                                                          | Purpose               |
| ----------------------------------------------------------------------------- | --------------------- |
| `scripts/record-sin-uat-rp-agg-003.ts`                                        | Main recording script |
| `scripts/record-sin-uat-rp-agg-003-admin.ts`                                  | Admin-only variant    |
| `scripts/sin-uat-evidence-utils.ts`                                           | Shared utilities      |
| `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md` | Master analysis doc   |
| `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md`      | Target flows          |
