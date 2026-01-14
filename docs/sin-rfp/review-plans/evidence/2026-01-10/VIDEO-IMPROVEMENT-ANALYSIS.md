# Video Improvement Analysis

Evaluation of each RFP evidence video with opportunities to make them more impressive.

**Seeding note:** Apply data changes through `scripts/seed-sin-data.ts` (IDs in `IDS`, Phase 7+ seeds) instead of raw SQL snippets; see `VIDEO-EXCELLENCE-PLAN.md` for the canonical seed instructions.

**2026-01-12 update:** The seed script now clears and reseeds `auditLogs` every run, guaranteeing the SEC-AGG-004 dataset (PII + step-up + hash chain). Recording scripts still need expansion for DM-AGG-001, DM-AGG-006, and RP-AGG-003 to reach the target flows.

---

## SEC-AGG-001 - Auth & MFA Login (49 frames, 24.5s)

### Current State

- Login → password → MFA → org selection → dashboard → settings
- Frames 29-45 (17 frames) static on Account Settings page
- Settings shows password change form, MFA section

### Issues

1. **Too much time on static settings page** - 17 frames (8.5s) of the same view
2. **MFA section doesn't show "Enabled" state prominently** - shows form fields instead of status badge
3. **No passkey demonstration** - passkeys are a differentiator but not shown
4. **No session management shown** - active sessions list would demonstrate security

### Opportunities for Improvement

| Improvement                          | Impact | Required Changes                                                                                                                           |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Show "MFA Enabled" badge prominently | High   | **Data**: Ensure user has MFA enabled. **Code**: Add visible "MFA Active" badge to settings. **Script**: Navigate to show badge, not form. |
| Show passkey registration            | High   | **Code**: None (exists). **Script**: Add passkey registration flow after MFA verification.                                                 |
| Show active sessions list            | Medium | **Code**: None (exists). **Script**: Navigate to sessions tab, show "Revoke" buttons.                                                      |
| Show security audit for user         | Medium | **Code**: Add "My Security Activity" section. **Script**: Navigate to show recent auth events.                                             |
| Trim static frames                   | Low    | **Script**: Reduce wait times, faster pacing through settings.                                                                             |
| Show role-based access               | High   | **Script**: After login, briefly show admin menu items only visible to this role.                                                          |

### Ideal Flow (45s)

1. Login with email (3s)
2. Password entry (3s)
3. MFA challenge with TOTP (5s)
4. Dashboard with admin menu visible (3s)
5. Settings → "MFA Enabled" badge visible (3s)
6. Passkey section → register new passkey (10s)
7. Active sessions → show devices (5s)
8. Security activity log (5s)

**Remediation Plan:** [SEC-AGG-001-remediation-plan.md](./SEC-AGG-001-remediation-plan.md)

---

## SEC-AGG-004 - Audit Trail (50 frames, 25s)

### Current State

- Empty audit page (9 frames) → 2 entries load → filter to EXPORT → hash chain verified
- Only 2 audit entries visible
- 26 frames (13s) showing same 2 entries

### Issues

1. **Empty state shown for too long** - 9 frames (4.5s) of "No audit entries yet"
2. **Only 2 entries** - doesn't demonstrate scale or variety
3. **No PII badges visible** - PII detection is a key feature
4. **No step-up badges** - step-up auth for sensitive ops not shown
5. **Export not demonstrated** - just hash chain verification

### Opportunities for Improvement

| Improvement                                   | Impact | Required Changes                                                                                             |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Pre-populate diverse audit entries            | High   | **Data**: Seed 20+ entries across AUTH, DATA, EXPORT, SECURITY, ADMIN categories. Include PII access events. |
| Show PII detection badges                     | High   | **Data**: Ensure some entries have `pii_accessed: true`. **Code**: None (badge exists).                      |
| Show step-up authentication badges            | High   | **Data**: Entries with `step_up_verified: true`.                                                             |
| Show user/target details                      | Medium | **Code**: None. **Script**: Click an entry to show detail panel.                                             |
| Show date range filtering                     | Medium | **Script**: Use date pickers to filter, show results change.                                                 |
| Show CSV export with download                 | Medium | **Script**: Click Export CSV, show download toast.                                                           |
| Show hash chain verification with entry count | High   | **Data**: More entries = more impressive "Verified 47 entries" message.                                      |
| Start with entries already loaded             | Low    | **Script**: Use storage state, skip empty state.                                                             |

### Ideal Flow (45s)

1. Audit page with 20+ diverse entries (immediate, no loading) (3s)
2. Scroll to show variety of categories and timestamps (5s)
3. Click entry → show detail panel with actor, target, metadata (5s)
4. Filter by EXPORT category (3s)
5. Show BI:EXPORT entries with PII + Step-up badges (5s)
6. Click "Verify hash chain" → "47 entries verified successfully" (5s)
7. Click "Export CSV" → download toast (3s)
8. Filter by date range → show results update (5s)

### Required Data Seeding

```sql
-- Add diverse audit entries
INSERT INTO audit_log (action, category, actor_id, target_type, pii_accessed, step_up_verified, created_at)
VALUES
  ('AUTH:LOGIN_SUCCESS', 'AUTH', 'user-1', 'session', false, false, NOW() - INTERVAL '1 hour'),
  ('DATA:FORM_SUBMITTED', 'DATA', 'user-2', 'form_submission', true, false, NOW() - INTERVAL '2 hours'),
  ('BI:EXPORT', 'EXPORT', 'user-1', 'bi_dataset', true, true, NOW() - INTERVAL '3 hours'),
  -- ... 20+ more entries
```

**Remediation Plan:** [SEC-AGG-004-remediation-plan.md](./SEC-AGG-004-remediation-plan.md)

---

## RP-AGG-003 - Reporting Workflow (20 frames, 10s)

### Current State

- Reporting admin page → scroll → type "Q2 2026 Quarterly" → submissions table
- Very short, no actual workflow completion
- Shows 5 BC Hockey submissions with various statuses

### Issues

1. **Too short** - 10 seconds doesn't demonstrate the full workflow
2. **No cycle creation shown** - just typing a name
3. **No task assignment shown** - critical feature missing
4. **No user perspective** - only admin view
5. **No task completion** - doesn't show the end-to-end flow
6. **No reminder configuration** - key feature for compliance

### Opportunities for Improvement

| Improvement                         | Impact | Required Changes                                                                |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Show full cycle creation            | High   | **Script**: Fill all fields, click Create, show success toast.                  |
| Show task assignment with reminders | High   | **Script**: Assign form to org, set due date, configure email reminders.        |
| Switch to user view                 | High   | **Script**: Log in as different user OR navigate to user reporting view.        |
| Show task in user's queue           | High   | **Data**: Ensure assigned task appears for the user.                            |
| Complete a task                     | High   | **Script**: Open task, fill form, submit.                                       |
| Show status change in admin view    | High   | **Script**: Return to admin, show status changed from "pending" to "submitted". |
| Show overdue highlighting           | Medium | **Data**: Include overdue tasks with red highlighting.                          |
| Show bulk operations                | Medium | **Script**: Select multiple tasks, show bulk actions menu.                      |

### Ideal Flow (90s)

1. Admin reporting page with existing cycles (3s)
2. Click "Create cycle" → fill form → submit (10s)
3. Success toast, cycle appears in list (3s)
4. Click "Assign task" → select org, form, due date (10s)
5. Configure reminders (3 days before, 1 day before) (5s)
6. Create task → success (3s)
7. **Switch to user view** (navigate to `/dashboard/sin/reporting`) (5s)
8. Show task in "My Tasks" queue with due date (5s)
9. Click task → fill required fields (15s)
10. Submit task → success message (5s)
11. **Switch back to admin view** (5s)
12. Show submission in table with "submitted" status (5s)
13. Click to review → approve/request changes (10s)

### Required Changes

- **Script**: Complete rewrite to show full workflow
- **Data**: Ensure forms exist for assignment
- **Code**: None (features exist)

**Remediation Plan:** [RP-AGG-003-remediation-plan.md](./RP-AGG-003-remediation-plan.md)

**2026-01-12 Review Update:** Video is NOT blank (previous report incorrect). Contains 20 frames of partial workflow - cycle name typed but not created, task form visible but not submitted, 70% duplicate frames. Rating: 3/10. Critical issues: incomplete cycle creation, no task assignment, no user perspective, no admin approval. See remediation plan.

---

## RP-AGG-005 - Analytics Export (53 frames, 26.5s)

### Current State

- Pivot builder with Organizations dataset
- Parent Organization in Rows
- Scrolls to export buttons
- Loading spinner → results show 1 organization

### Issues

1. **38 frames (19s) of static pivot builder** - boring
2. **Only 1 organization in results** - not impressive
3. **No chart visualization** - tables are less engaging
4. **No actual export** - just shows buttons
5. **No step-up auth shown** - key security feature for exports
6. **Dataset not meaningful** - "Organizations" is generic

### Opportunities for Improvement

| Improvement                       | Impact | Required Changes                                                                       |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Use Reporting Submissions dataset | High   | **Data**: Seed form submissions across multiple orgs. **Script**: Select this dataset. |
| Show meaningful data (10+ rows)   | High   | **Data**: Multiple orgs with submission counts.                                        |
| Show chart visualization          | High   | **Script**: Switch to Bar chart after table.                                           |
| Trigger step-up auth on export    | High   | **Code**: Ensure step-up required. **Script**: Click Export CSV, complete step-up.     |
| Show successful download          | Medium | **Script**: Wait for download, show file.                                              |
| Show saved dashboard              | Medium | **Script**: Click "Save to Dashboard", show dashboard view.                            |
| Add filters                       | Medium | **Script**: Add date filter, show results change.                                      |
| Faster pacing                     | Low    | **Script**: Reduce wait times in pivot builder.                                        |

### Ideal Flow (60s)

1. Analytics Explore page (2s)
2. Select "Reporting Submissions" dataset (3s)
3. Drag "Organization" to Rows (3s)
4. Drag "Submission Status" to Columns (3s)
5. Drag "Count" to Measures (3s)
6. Click "Run Query" → table shows 10+ orgs with status breakdown (5s)
7. Click "Bar Chart" → visualization renders (5s)
8. Click "Export CSV" → **Step-up auth modal appears** (3s)
9. Enter TOTP code → verify (5s)
10. Download completes → toast "Export complete" (3s)
11. Click "Save to Dashboard" → name it → save (5s)
12. Navigate to dashboard → show saved visualization (5s)

### Required Data Seeding

```sql
-- Add form submissions across orgs
INSERT INTO form_submission (form_id, organization_id, status, created_at)
SELECT
  'form-annual-stats',
  org.id,
  (ARRAY['submitted', 'approved', 'changes_requested', 'draft'])[floor(random()*4)+1],
  NOW() - (random() * INTERVAL '90 days')
FROM organization org
WHERE org.type = 'pso';
-- Creates ~10 submissions with varied statuses
```

**Remediation Plan:** [RP-AGG-005-remediation-plan.md](./RP-AGG-005-remediation-plan.md)

---

## DM-AGG-001 - Form Submission (35 frames, 17.5s)

### Current State

- Org selection → dashboard → admin forms → dashboard again → empty forms page
- Ends on "No forms assigned yet" - **very unimpressive**
- Shows form builder briefly but no interaction
- Dashboard shown twice with loading states

### Issues

1. **Ends on empty state** - worst possible ending
2. **No form creation shown** - form builder visible but unused
3. **No form submission** - core feature not demonstrated
4. **Redundant navigation** - dashboard shown twice
5. **No file upload** - key capability not shown
6. **No validation** - required fields, error states not shown

### Opportunities for Improvement

| Improvement                         | Impact   | Required Changes                                                     |
| ----------------------------------- | -------- | -------------------------------------------------------------------- |
| Show form builder creating a form   | Critical | **Script**: Create form with multiple field types.                   |
| Show form preview                   | High     | **Script**: Click preview button.                                    |
| Show form assignment to org         | High     | **Script**: Assign form to organization.                             |
| Show user filling out form          | Critical | **Script**: Navigate to user view, fill all fields.                  |
| Show file upload                    | High     | **Data**: Prepare sample PDF. **Script**: Upload file to file field. |
| Show validation errors then success | High     | **Script**: Submit incomplete → show errors → fix → submit.          |
| Show submission in list             | High     | **Script**: After submit, show in submissions table.                 |
| Show admin reviewing submission     | Medium   | **Script**: Admin view of submitted form with approval actions.      |

### Ideal Flow (90s)

1. Admin Forms page with existing forms (3s)
2. Click "Create Form" (2s)
3. Add text field "Facility Name" (required) (5s)
4. Add date field "Report Date" (required) (5s)
5. Add number field "Total Participants" (5s)
6. Add file field "Supporting Document" (PDF) (5s)
7. Click Preview → show form preview (5s)
8. Click Publish → success toast (3s)
9. **Switch to user view** `/dashboard/sin/forms` (5s)
10. Form appears in list → click to open (5s)
11. Fill required fields (10s)
12. Upload PDF file → show upload progress (5s)
13. Click Submit → **validation error** (missing field) (3s)
14. Fix error → Submit again → **success** (5s)
15. Show submission in "My Submissions" (5s)
16. **Admin view**: Show submission pending review (5s)

### Required Changes

- **Script**: Complete rewrite
- **Data**: Sample PDF file for upload
- **Code**: None (features exist)

**Remediation Plan:** [DM-AGG-001-remediation-plan.md](./DM-AGG-001-remediation-plan.md)

**2026-01-12 Review Update:** Re-analyzed 57 frames from FINAL video. Video now shows **successful** form submission flow with all fields filled, PDF upload, and submission history update. Minor polish items identified but **NO RE-RECORDING NEEDED** - video is production-ready.

---

## DM-AGG-006 - Import Wizard (53 frames, 26.5s)

### Current State

- Loading → org selection → dashboard → import wizard
- Select org and form → upload CSV → auto-mapping → job created → history (Pending)

### Issues

1. **Blank frames at start** - frames 1-2 are white
2. **Unnecessary navigation** - goes through org selection and dashboard
3. **Only 1 row imported** - doesn't demonstrate scale
4. **Ends on "Pending"** - should show completed
5. **No error → success flow** - validation is a key feature
6. **No imported data verification** - doesn't show data landed correctly

### Opportunities for Improvement

| Improvement                      | Impact | Required Changes                                                                                  |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Start directly on import wizard  | Medium | **Script**: Use storage state, navigate directly.                                                 |
| Import larger dataset (50+ rows) | High   | **Data**: Create CSV with 50 rows of realistic data.                                              |
| Show validation errors first     | High   | **Data**: Create intentionally bad CSV. **Script**: Upload bad file, show errors, then good file. |
| Wait for import completion       | High   | **Script**: Poll/wait until status = "Completed".                                                 |
| Show imported data in system     | High   | **Script**: Navigate to form submissions, show imported records.                                  |
| Show field mapping intelligence  | Medium | **Script**: Pause on auto-mapping to highlight the feature.                                       |
| Show template download           | Medium | **Script**: Click "Download template" before upload.                                              |
| Trim blank frames                | Low    | **Script**: Remove initial wait.                                                                  |

### Ideal Flow (90s)

1. Import wizard (direct navigation, no blank frames) (2s)
2. Select viaSport BC, Annual Statistics Report (5s)
3. Click "Download XLSX Template" → show download (3s)
4. Upload **bad CSV** with errors (5s)
5. Show validation errors panel:
   - "Missing required column: certified_coaches"
   - "Invalid date format in row 3"
   - "Duplicate entry in row 7" (10s)
6. Upload **good CSV** (50 rows) (5s)
7. Show auto-mapping with all 7 fields mapped (5s)
8. Show "Columns detected: 7, Rows: 50" (3s)
9. Click "Create import job" (3s)
10. Show progress indicator (5s)
11. Status changes to "Processing" → "Completed" (10s)
12. Click to view import details → show 50 rows imported (5s)
13. Navigate to Form Submissions → show 50 new entries (10s)
14. Open one entry → show imported data (5s)

### Required Data Files

```csv
# import-demo-annual-stats-large.csv (50 rows)
total_registered_participants,male_participants,female_participants,youth_under_18,adults_18_plus,certified_coaches,events_competitions_held
500,250,250,300,200,15,12
450,220,230,280,170,12,8
... (48 more rows)

# import-demo-annual-stats-errors.csv (intentional errors)
total_registered,male_participants,female_participants,youth_under_18,adults_18_plus,events_held
500,250,250,300,200,12
"not a number",220,230,280,170,8
450,220,230,280,170,8
450,220,230,280,170,8  # duplicate
```

**Remediation Plan:** [DM-AGG-006-remediation-plan.md](./DM-AGG-006-remediation-plan.md)

**2026-01-12 Review Update:** Analyzed 107 frames from FINAL video. Rating: **4/10**. Critical issues: (1) Video ends with imports stuck on "pending" status - never shows completion, (2) "50 rows imported" count never displayed, (3) Excessive static content in mapping phase (15 seconds unchanged). Script fixes required to wait for import completion and navigate to show imported submissions.

---

## Summary: Priority Ranking

| Video       | Current Score          | Potential Score | Effort                 | Priority         |
| ----------- | ---------------------- | --------------- | ---------------------- | ---------------- |
| DM-AGG-001  | 3/10 (empty state)     | 9/10            | High (full rewrite)    | **1 - Critical** |
| RP-AGG-003  | 4/10 (incomplete flow) | 9/10            | High (full rewrite)    | **2 - High**     |
| SEC-AGG-004 | 5/10 (sparse data)     | 9/10            | Medium (data + script) | **3 - High**     |
| RP-AGG-005  | 5/10 (minimal data)    | 9/10            | Medium (data + script) | **4 - Medium**   |
| DM-AGG-006  | 7/10 (works but basic) | 9/10            | Medium (data + script) | **5 - Medium**   |
| SEC-AGG-001 | 7/10 (solid but long)  | 9/10            | Low (script only)      | **6 - Low**      |

## Quick Wins (Script-Only Changes)

1. **SEC-AGG-001**: Trim static frames, faster pacing
2. **DM-AGG-006**: Remove blank frames, start on wizard directly
3. **RP-AGG-005**: Faster pacing through pivot builder

## Medium Effort (Data + Script)

1. **SEC-AGG-004**: Seed 20+ diverse audit entries
2. **RP-AGG-005**: Seed form submissions for meaningful pivot
3. **DM-AGG-006**: Create larger CSV (50 rows), error CSV

## High Effort (Full Rewrites)

1. **DM-AGG-001**: Show form creation → assignment → submission → review
2. **RP-AGG-003**: Show cycle creation → task assignment → user completion → status update

---

## Final Video Frame Analysis (2026-01-12)

All 6 videos re-encoded with H.264/AAC for QuickTime compatibility.

### 1. DM-AGG-001 - Form Submission (57 frames, ~29s)

| Frame | Timestamp  | What Changed                                            |
| ----- | ---------- | ------------------------------------------------------- |
| 1     | 0s         | Blank/loading screen                                    |
| 2-3   | 0.5-1.5s   | Login page with email input                             |
| 4     | 2s         | Email populated (viasport-staff@example.com)            |
| 5-6   | 2.5-3s     | Password field appears                                  |
| 7-9   | 3.5-4.5s   | Password typed, "Logging in..." state                   |
| 10-11 | 5-5.5s     | MFA screen appears                                      |
| 12-15 | 6-7.5s     | TOTP code entered and verified                          |
| 20    | 10s        | Redirect in progress                                    |
| 25    | 12.5s      | Admin Console loads                                     |
| 30    | 15s        | Form builder with Facility Usage Survey                 |
| 35    | 17.5s      | Form configuration page                                 |
| 40    | 20s        | Form submission preview                                 |
| 45    | 22.5s      | Form filled (Richmond Olympic Oval, 2010/06/15, 42 hrs) |
| 50    | 25s        | Submission history visible                              |
| 55-57 | 27.5-28.5s | Final state                                             |

---

### 2. DM-AGG-006 - Import Wizard (107 frames, ~54s)

| Frame   | Timestamp  | What Changed                                             |
| ------- | ---------- | -------------------------------------------------------- |
| 1       | 0s         | Blank screen                                             |
| 2-10    | 0.5-5s     | Login page                                               |
| 11      | 5.5s       | Password field, "Logging in..."                          |
| 12-14   | 6-7s       | MFA prompt with code "047457"                            |
| 15-19   | 7.5-9.5s   | Dashboard/org selection                                  |
| 20      | 10s        | Admin Console loads                                      |
| 21-27   | 10.5-13.5s | Import Admin page, org selected                          |
| 28      | 14s        | Form dropdown: "Annual Statistics Report"                |
| 29-39   | 14.5-19.5s | File upload interface                                    |
| 40      | 20s        | CSV file selected (import-demo-annual-stats-errors.csv)  |
| 41-43   | 20.5-21.5s | Upload complete, Map tab active                          |
| 44-87   | 22-43.5s   | Field mapping auto-detected                              |
| 88      | 44s        | Data preview with sample data                            |
| 89-95   | 44.5-47.5s | Validation preview (4 rows, 12 errors), checkbox checked |
| 96      | 48s        | "Importing..." state                                     |
| 97-100  | 48.5-50s   | Import completing                                        |
| 101-107 | 50.5-53.5s | Import history with 2 pending imports                    |

---

### 3. RP-AGG-003 - Reporting Workflow (20 frames, ~10s)

| Frame | Timestamp | What Changed                                             |
| ----- | --------- | -------------------------------------------------------- |
| 1-4   | 0-2s      | Admin Console - Reporting page, "Create reporting cycle" |
| 5-7   | 2.5-3.5s  | Scrolled to "Assign reporting task" section              |
| 8-9   | 4-4.5s    | Task assignment form and submissions table               |
| 10    | 5s        | Scrolled back to top                                     |
| 11-12 | 5.5-6s    | Cycle name entered: "Q2 2026 Quarterly"                  |
| 13    | 6.5s      | Page scrolled down                                       |
| 14-20 | 7-10s     | Task assignment form and submissions table (stable)      |

---

### 4. RP-AGG-005 - Analytics Export (53 frames, ~27s)

| Frame | Timestamp  | What Changed                                                |
| ----- | ---------- | ----------------------------------------------------------- |
| 1-3   | 0-1.5s     | Analytics pivot builder loaded, Organizations dataset       |
| 4-5   | 2-2.5s     | Layout transition (sidebar collapses)                       |
| 6-10  | 3-5s       | Sidebar re-expands                                          |
| 11-35 | 5.5-17.5s  | Pivot builder (minor layout shifts)                         |
| 36-40 | 18-20s     | Query execution view with export buttons (CSV, Excel, JSON) |
| 41-45 | 20.5-22.5s | Query results - Preview table loads with org data           |
| 46-50 | 23-25s     | Data table fully rendered                                   |
| 51-53 | 25.5-26.5s | Final state - complete analytics view                       |

---

### 5. SEC-AGG-001 - Auth & MFA Login (49 frames, ~25s)

| Frame | Timestamp  | What Changed                               |
| ----- | ---------- | ------------------------------------------ |
| 1-3   | 0-1.5s     | Login page with email field                |
| 4-5   | 2-2.5s     | Email entered (viasport-staff@example.com) |
| 6     | 3s         | Password field appears                     |
| 7-8   | 3.5-4s     | Password populated                         |
| 9-10  | 4.5-5s     | "Logging in..." state                      |
| 11-12 | 5.5-6s     | Loading continues                          |
| 13-17 | 6.5-8.5s   | MFA prompt with code "123456"              |
| 18    | 9s         | Code changed to "887829"                   |
| 19-20 | 9.5-10s    | "Verifying..." state                       |
| 21    | 10.5s      | Auth succeeds, org selection modal         |
| 22-25 | 11-12.5s   | Organization selector loading/ready        |
| 26    | 13s        | SIN Portal dashboard loads                 |
| 27-29 | 13.5-14.5s | Dashboard fully rendered                   |
| 30-49 | 15-24.5s   | Account Settings - Password & MFA sections |

---

### 6. SEC-AGG-004 - Audit Trail Verification (50 frames, ~25s)

| Frame | Timestamp | What Changed                                          |
| ----- | --------- | ----------------------------------------------------- |
| 1-10  | 0-5s      | Audit Log page - "No audit entries yet"               |
| 11-25 | 5-12.5s   | AUTH and SECURITY entries appear (2 rows)             |
| 26-32 | 12.5-16s  | Filter dropdown opened (AUTH, DATA, EXPORT, SECURITY) |
| 33-40 | 16-20s    | Filter applied, EXPORT actions shown                  |
| 41-48 | 20-24s    | "Hash chain verified successfully" message appears    |
| 49-50 | 24-25s    | Final state with verification message                 |

---

## Video Frame Analysis (2026-01-12 T120 Recordings)

Re-recorded all 6 videos. Detailed frame-by-frame analysis follows.

### Critical Issues Summary

| Video          | Frames | Duration | Status        | Critical Issues                                                     |
| -------------- | ------ | -------- | ------------- | ------------------------------------------------------------------- |
| **RP-AGG-003** | 14     | ~7s      | **FAILED**    | ALL FRAMES BLANK - script crashed                                   |
| SEC-AGG-004    | 77     | ~38s     | **NEEDS FIX** | Hash chain FAILS ("invalid for 60 entries"), no PII/step-up badges  |
| DM-AGG-001     | 46     | ~23s     | **NEEDS FIX** | Submit never clicked, form resets without confirmation              |
| RP-AGG-005     | 39     | ~19s     | **NEEDS FIX** | Export not clicked, no step-up auth shown                           |
| SEC-AGG-001    | 39     | ~19s     | **NEEDS FIX** | No MFA Enabled badge (shows "Enable MFA"), no passkeys, no sessions |
| DM-AGG-006     | 106    | ~53s     | **NEEDS FIX** | All imports "pending", no completion shown                          |

---

### 1. RP-AGG-003 - Reporting Workflow (14 frames, ~7s) - **CRITICAL FAILURE**

**ALL 14 FRAMES ARE BLANK (pure white)** - The script completely failed.

| Frame | Timestamp | Content            | Issue                   |
| ----- | --------- | ------------------ | ----------------------- |
| 1-14  | 0-7s      | Blank white screen | **NO CONTENT CAPTURED** |

**Root Cause Investigation Needed:**

- Script may have crashed before navigation
- Browser may have failed to launch
- Auth may have failed silently
- Page may not have loaded before video capture started

**Required:** Debug `record-sin-uat-rp-agg-003.ts`, add error handling, re-record.

---

### 2. SEC-AGG-004 - Audit Trail (77 frames, ~38s)

| Frame | Timestamp | Content                                 | Issue                            |
| ----- | --------- | --------------------------------------- | -------------------------------- |
| 1-4   | 0-2s      | Blank/loading                           | Initial load delay               |
| 10-17 | 5-8s      | "No audit entries yet"                  | **EMPTY STATE**                  |
| 18-21 | 9-12s     | DATA, SECURITY entries appear           | Only 2 entries                   |
| 22-30 | 12-18s    | EXPORT filter applied                   |                                  |
| 31-41 | 18-25s    | **"Hash chain invalid for 60 entries"** | **RED ERROR - HASH CHAIN FAILS** |
| 43-61 | 26-38s    | Same EXPORT entries                     | **STATIC (19 frames)**           |
| 63-77 | 39-48s    | AUTH filter, date range applied         |                                  |

**Critical Issues:**

1. **Hash chain verification FAILS** - Shows "invalid for 60 entries" in red
2. **No PII badges visible** - Key security feature not shown
3. **No Step-up badges visible** - Key security feature not shown
4. **No CSV export demonstrated** - Export buttons visible but not clicked
5. **No entry detail panel shown** - Never clicked an entry
6. **Empty state shown for 4+ seconds** - Should pre-load data

**Required Fixes:**

1. Fix hash chain data in seed script (ensure valid prevHash chain)
2. Add metadata `{ includesPii: true, stepUpAuthUsed: true }` to EXPORT entries
3. Update script to click Export CSV, show detail panel

---

### 3. DM-AGG-001 - Form Submission (46 frames, ~23s)

| Frame | Timestamp  | Content                              | Issue                              |
| ----- | ---------- | ------------------------------------ | ---------------------------------- |
| 1-3   | 0-1.5s     | Blank                                | Initial load                       |
| 4-12  | 2-6s       | Form builder, publishing             | "Publishing..." state              |
| 13-17 | 6.5-8.5s   | Org selection                        | Navigation                         |
| 18-24 | 9-12s      | Form opened, filling data            | Richmond Olympic Oval, date, hours |
| 25-29 | 12.5-14.5s | Submission history (2 entries)       | Shows prior submissions            |
| 30-42 | 15-21s     | **Form reset, "No submissions yet"** | **SUBMISSION LOST**                |
| 43-46 | 21.5-23s   | Templates page                       | Final navigation                   |

**Critical Issues:**

1. **Submit button NEVER clicked** - Form filled but submission not triggered
2. **Form resets without confirmation** - Goes from filled form to empty state
3. **"No submissions yet" shown** - Contradicts earlier history (frames 25-29)
4. **No Published badge visible** - Form status unclear
5. **No success toast shown** - No submission confirmation
6. **Admin approval view missing** - Required by ideal flow

**Required Fixes:**

1. Actually click Submit button after filling form
2. Wait for success toast before continuing
3. Show submission in history after submit
4. Navigate to admin to show approval workflow

---

### 4. DM-AGG-006 - Import Wizard (106 frames, ~53s)

| Frame  | Timestamp | Content                         | Issue                          |
| ------ | --------- | ------------------------------- | ------------------------------ |
| 1-3    | 0-1.5s    | Blank                           | Initial load                   |
| 15-27  | 7.5-13.5s | Import Admin, org/form selected | viaSport BC, Annual Statistics |
| 40-43  | 20-21.5s  | CSV uploaded, mapping           | error CSV loaded               |
| 60-74  | 30-37s    | Validation: "Total errors: 12"  | Shows errors but not details   |
| 75-94  | 37.5-47s  | "Importing..." → data preview   |                                |
| 95-106 | 47.5-53s  | Import history: 2 "pending"     | **NEVER SHOWS "COMPLETED"**    |

**Critical Issues:**

1. **No template download shown** - Skipped step 3 of ideal flow
2. **Validation errors not detailed** - Shows "12 errors" but no specifics
3. **Import status stuck on "pending"** - Never progresses to "Completed"
4. **No "50 rows imported" confirmation** - Results not shown
5. **Form submissions not verified** - Doesn't navigate to show imported data

**Required Fixes:**

1. Add template download step
2. Wait for import to complete (poll status)
3. Navigate to Form Submissions to verify imported data
4. Show individual submission detail

---

### 5. SEC-AGG-001 - Auth & MFA Login (39 frames, ~19s)

| Frame | Timestamp  | Content                                              | Issue                      |
| ----- | ---------- | ---------------------------------------------------- | -------------------------- |
| 1-2   | 0-1s       | Blank                                                | Initial load               |
| 3-8   | 1.5-4s     | Login, email entry                                   | viasport-staff@example.com |
| 9-14  | 4.5-7s     | Password, "Logging in..."                            |                            |
| 15-20 | 7.5-10s    | MFA challenge, code entry                            | TOTP 420698                |
| 21-24 | 10.5-12s   | Org selection, dashboard                             |                            |
| 25-30 | 12.5-15s   | Dashboard with onboarding modal                      | **STATIC (6 frames, >5s)** |
| 31-39 | 15.5-19.5s | Settings - MFA section shows **"Enable MFA"** button | **MFA NOT ENABLED**        |

**Critical Issues:**

1. **MFA Enabled badge NOT visible** - Settings shows "Enable MFA" button instead of "Enabled" badge
2. **"No passkeys yet" message** - No registered passkeys shown
3. **Active Sessions section MISSING** - Not shown at all
4. **Onboarding modal shown for 6 frames** - Too long on same content
5. **No passkey registration flow** - Required by ideal flow
6. **No session revocation demo** - Required by ideal flow

**Root Cause:** The seeded user `viasport-staff@example.com` appears to NOT have MFA enabled on this environment, or the MFA status isn't being detected properly.

**Required Fixes:**

1. Verify user has MFA enabled in database
2. Dismiss onboarding modal faster
3. Navigate to show Active Sessions
4. Consider showing passkey registration

---

### 6. RP-AGG-005 - Analytics Export (39 frames, ~19s)

| Frame | Timestamp  | Content                                  | Issue                    |
| ----- | ---------- | ---------------------------------------- | ------------------------ |
| 1-8   | 0-4s       | Org selection, dashboard                 | Navigation               |
| 9-11  | 4.5-5.5s   | Analytics Explore, Organizations dataset |                          |
| 12-20 | 6-10s      | Dataset → Form Submissions, field drag   | "Submission ID" only     |
| 21-31 | 10.5-15.5s | Bar chart rendered                       | Chart visible            |
| 32-35 | 16-17.5s   | Save to Dashboard modal                  | Widget named, saving     |
| 36-39 | 18-19.5s   | Dashboard with widget loading            | **WIDGET STILL LOADING** |

**Critical Issues:**

1. **Export CSV NOT clicked** - Buttons visible but never used
2. **Step-up auth COMPLETELY ABSENT** - Key security feature not demonstrated
3. **No TOTP code entry** - Should show MFA prompt for export
4. **No export download confirmation** - No "Export complete" toast
5. **Minimal pivot configuration** - Only "Submission ID" dragged, not org/status/count
6. **Dashboard widget never fully loads** - Ends with spinner

**Required Fixes:**

1. Build proper pivot: Organization (rows), Status (columns), Count (measure)
2. Click "Export CSV" button
3. Complete step-up auth with TOTP
4. Wait for download toast
5. Wait for dashboard widget to fully render
