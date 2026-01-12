# Video Improvement Analysis

Evaluation of each RFP evidence video with opportunities to make them more impressive.

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
