# RFP Video Excellence Plan

Transform all 6 RFP evidence videos from "acceptable" to "impressive" through targeted code changes, data seeding, and script improvements.

## Seeding and Environment Approach

- Apply all data changes in `scripts/seed-sin-data.ts` (Phase 7+), adding new stable UUIDs to the `IDS` map and reusing the script's helpers (hash chain generation, artifact uploads) instead of raw SQL.
- Keep seeds idempotent: gate new inserts behind existence checks where appropriate and reuse fixed IDs to avoid drift between recordings.
- When connecting to a fresh environment, use SST tunnel; if blocked, use the documented SSM port-forward workaround from `docs/runbooks/new-environment-setup.md` to run the seed script.
- Current state: seed updates for facility usage form/submission, analytics/reporting data, import jobs, and expanded audit entries are implemented in `scripts/seed-sin-data.ts`; these seeds were run on sin-uat via SSM port forward (see below).

### Seeding Status

**sin-uat seeded: 2026-01-11** (with artifact uploads)

| Entity           | Count                    |
| ---------------- | ------------------------ |
| Users            | 5                        |
| Organizations    | 10                       |
| MFA Enrollments  | 2                        |
| Forms            | 7 (6 published, 1 draft) |
| Form Submissions | 35                       |
| Reporting Cycles | 4                        |
| Reporting Tasks  | 8                        |
| Import Jobs      | 5                        |
| Audit Entries    | 207                      |

**Audit log categories:** SECURITY (99), AUTH (83), DATA (20), EXPORT (4 with step-up badges), ADMIN (1)

**S3 artifacts uploaded:**

- `submissions/` - Form submission attachments (PDFs, CSVs)
- `templates/` - 4 template files
- `imports/` - Demo CSV for import wizard

**To re-seed:** See `docs/runbooks/new-environment-setup.md#finding-s3-bucket-names` for full command with `SIN_ARTIFACTS_BUCKET`.

### Latest progress (2026-01-11)

- Scripts now follow ideal flows: RP-AGG-003 (admin + reporter + admin helper), RP-AGG-005 (analytics export + save to dashboard + step-up), DM-AGG-006 (error CSV then 50-row import with history), SEC-AGG-004 (PII/step-up export + hash verify + date filter), SEC-AGG-001 login (MFA badge, passkeys, active sessions).
- New import sample files: `docs/sin-rfp/legacy-data-samples/import-demo-annual-stats-errors.csv` and `.../import-demo-annual-stats-large.csv` (50 rows aligned to Annual Stats form).
- Seeds already applied to sin-uat via SSM port forward with artifacts (see commands below).
- **2026-01-12**: Seed script now wipes and reseeds `auditLogs` on each run so SEC-AGG-004 always has the full PII + step-up hash chain dataset.

## Priority Ranking (by current quality)

| #   | Video       | Current            | Target | Effort | Strategy                    |
| --- | ----------- | ------------------ | ------ | ------ | --------------------------- |
| 1   | DM-AGG-001  | 3/10 (empty state) | 9/10   | High   | Full rewrite + UI badge     |
| 2   | RP-AGG-003  | 4/10 (incomplete)  | 9/10   | High   | Full rewrite + data seed    |
| 3   | SEC-AGG-004 | 5/10 (sparse)      | 9/10   | Medium | Data seed + script          |
| 4   | RP-AGG-005  | 5/10 (minimal)     | 9/10   | Medium | Data seed + script          |
| 5   | DM-AGG-006  | 7/10 (basic)       | 9/10   | Medium | Larger dataset + error flow |
| 6   | SEC-AGG-001 | 7/10 (long)        | 9/10   | Low    | UI badge + trim             |

---

## Video Improvement Iteration Loop

After each video re-recording, run this quality review process:

### Step 1: Extract frames at 2fps

```bash
VIDEO="DM-AGG-001-form-submission-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/${VIDEO%.mp4}"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame-%03d.png"
```

### Step 2: Launch subagent to review all frames

```
Task: Review video frames for [VIDEO_NAME]

Read every PNG file in [FRAMES_DIR] and create a table showing:
1. Frame ranges where content is static (same as previous)
2. Frame numbers where meaningful transitions occur
3. Issues: blank frames, loading spinners, error states, too much static time

Output format:
| Frames | Content | Issue |
|--------|---------|-------|
| 1-3 | Login page | None |
| 4-15 | Static dashboard | Too long (6s) |
```

### Step 3: Edit based on review

- Trim excessive static frames with FFmpeg
- Re-record sections with issues
- Iterate until all frames are purposeful

---

## 1. DM-AGG-001 - Form Submission (Priority: CRITICAL)

**Current Issues:**

- Ends on "No forms assigned yet" empty state
- No form creation shown
- No submission flow
- Dashboard shown twice with loading

### 1.1 Code Changes Required ✅ DONE

#### Add "Published" badge to form builder ✅

**File:** `src/features/forms/components/form-builder-shell.tsx:1542-1547`
**Status:** Already implemented with `<Badge variant="success">` showing "Published" with CheckCircle2 icon when form status is published.

### 1.2 Data Seeding Required

**File:** `scripts/seed-sin-data.ts`

- Add new stable UUIDs to `IDS` (form, form version, and submission IDs) for `facility-usage-demo`.
- Extend Phase 7 `formsData` with the demo form (organizationId: `IDS.viasportBcId`, status: `"published"`) and fields: facility_name (text, required), usage_date (date, required), total_hours (number, required), usage_report (file, PDF only).
- In Phase 10, seed a submitted `formSubmissions` row using the new IDs, linking the form version, and attach a sample PDF artifact via `uploadSeedArtifact` so the user “My Submissions” list is populated before recording.

### 1.3 Script Changes

**File:** `scripts/record-sin-uat-dm-agg-001.ts`
**Rewrite:** Complete new flow

**Ideal Flow (90s):**

1. `/dashboard/admin/sin/forms` - Show form builder with existing draft form (3s)
2. Click draft form → show field configuration (5s)
3. Add file field "Usage Report" (5s)
4. Click Preview → show form preview (5s)
5. Click Publish → success toast with badge (5s)
6. **Switch to user view** `/dashboard/sin/forms` (5s)
7. Form appears in list → click to open (5s)
8. Fill required fields with realistic data (15s)
9. Upload sample PDF file → show upload progress (5s)
10. Click Submit → show validation (3s)
11. Success toast with submission ID (5s)
12. Show submission in "My Submissions" list (5s)
13. **Admin view**: Show submission pending review with approval actions (10s)

### 1.4 Key Files

| File                                                   | Purpose          | Lines                   |
| ------------------------------------------------------ | ---------------- | ----------------------- |
| `src/features/forms/components/form-builder-shell.tsx` | Form builder UI  | 1-1859                  |
| `src/routes/dashboard/admin/sin/forms.tsx`             | Admin route      | 1-32                    |
| `src/routes/dashboard/sin/forms/$formId.tsx`           | User form view   | 1-238                   |
| `src/features/forms/forms.mutations.ts`                | Server mutations | publishForm, submitForm |
| `src/db/schema/forms.schema.ts`                        | Database schema  | forms, formVersions     |

---

## 2. RP-AGG-003 - Reporting Workflow (Priority: HIGH)

**Current Issues:**

- Only 10 seconds, 20 frames
- No cycle creation completed
- No task assignment shown
- No user perspective
- No status change visible

### 2.1 Code Changes Required ✅ DONE

#### Add task assignment success indicator ✅

**File:** `src/features/reporting/components/reporting-dashboard-shell.tsx:177-182`
**Status:** Already implemented - `toast.success("Reporting task created")` with description showing reminder schedule.

#### Add visual reminder schedule preview ✅

**File:** `src/features/reporting/components/reporting-dashboard-shell.tsx:193-206`
**Status:** Already implemented - `reminderPreview` computed value calculates and displays reminder dates.

### 2.2 Data Seeding Required

**File:** `scripts/seed-sin-data.ts`
**Add:** Active reporting cycle with assigned tasks

- Add new UUIDs to `IDS` for the cycle, task, and submission (e.g., `q12026CycleId`, `q12026TaskId`, `q12026SubmissionId`).
- Phase 8: append a Q1 2026 cycle (status `active`) with clear start/end dates, createdBy `IDS.viasportStaffId`.
- Phase 9: append a task that targets `IDS.bcHockeyId` and uses the existing published annual stats form/version (`IDS.annualStatsFormId` / `IDS.annualStatsFormV1Id`), with reminderConfig daysBeforeDue `[14,7,3,1]`.
- Phase 10: seed a `reportingSubmissions` row wired to the new task with status `not_started` plus one “submitted” example referencing the seeded form submission to show status transitions in the recording.

### 2.3 Script Changes

**File:** `scripts/record-sin-uat-rp-agg-003.ts`
**Status:** ✅ Updated to full admin + reporter workflow with toast + approval steps (admin helper script uses the same flow with `adminOnly`).
**Rewrite:** Complete workflow demonstration

**Ideal Flow (90s):**

1. `/dashboard/admin/sin/reporting` - Show reporting admin with existing cycle (3s)
2. Click "Create Cycle" → fill form → submit (10s)
3. Success toast, cycle appears in list (3s)
4. Click "Assign Task" → select BC Hockey, Annual Stats form, due date (10s)
5. Configure reminders: 14, 7, 3, 1 days before (5s)
6. Create task → success with reminder preview (5s)
7. **Switch to user view** `/dashboard/sin/reporting` (5s)
8. Show task in "My Tasks" queue with due date badge (5s)
9. Click task → redirects to form (5s)
10. Fill required fields (10s)
11. Submit → success (5s)
12. **Switch back to admin view** (5s)
13. Show submission table with "submitted" status (5s)
14. Click Review → approve → status changes to "approved" (10s)

### 2.4 Key Files

| File                                                              | Purpose          | Lines                                                                |
| ----------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| `src/features/reporting/components/reporting-dashboard-shell.tsx` | Admin UI         | 1-600+                                                               |
| `src/routes/dashboard/admin/sin/reporting.tsx`                    | Admin route      | 1-32                                                                 |
| `src/routes/dashboard/sin/reporting.tsx`                          | User route       | 1-579                                                                |
| `src/features/reporting/reporting.mutations.ts`                   | Server mutations | createReportingCycle, createReportingTask, updateReportingSubmission |
| `src/db/schema/reporting.schema.ts`                               | Database schema  | reportingCycles, reportingTasks, reportingSubmissions                |

---

## 3. SEC-AGG-004 - Audit Trail (Priority: HIGH)

**Current Issues:**

- Only 2 audit entries visible
- Empty state shown for 4.5s
- No PII badges visible
- No step-up badges visible
- Export not demonstrated

### 3.1 Code Changes Required

None required - all features exist. Need data seeding only.

### 3.2 Data Seeding Required

**File:** `scripts/seed-sin-data.ts`
**Add:** 20+ diverse audit entries

- Phase 23: extend `auditSeedEntries` with AUTH/DATA/EXPORT/SECURITY/ADMIN events, including metadata flags `{ includesPii: true, stepUpAuthUsed: true, rowCount: <n> }` on BI exports to light up the PII + step-up badges.
- Use new UUIDs in `IDS` if you want deterministic IDs; otherwise reuse the existing hash-chain generation (requestId + prevHash) already in the script so `entryHash`/`prevHash` remain valid.
- Ensure `occurredAt` timestamps are staggered (e.g., 10-minute increments) to keep hash chain deterministic and to show recent activity without empty states.

### 3.3 Script Changes

**File:** `scripts/record-sin-uat-sec-agg-004.ts`
**Status:** ✅ Updated to load seeded entries, filter EXPORT for PII/step-up badges, verify hash chain, export with step-up, date filter, AUTH filter.
**Update:** Faster pacing, show more features

**Ideal Flow (45s):**

1. `/dashboard/admin/sin/audit` - Entries already loaded, no empty state (3s)
2. Scroll to show variety of categories and timestamps (5s)
3. Click entry → show detail panel with actor, target, metadata (5s)
4. Filter by EXPORT category (3s)
5. Show BI:EXPORT entries with **PII badge** (red) + **Step-up badge** (5s)
6. Click "Verify hash chain" → "47 entries verified successfully" (5s)
7. Click "Export CSV" → download toast appears (3s)
8. Filter by date range → show results update (5s)
9. Show AUTH category entries for completeness (5s)

### 3.4 Key Files

| File                                                | Purpose          | Lines                                                |
| --------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| `src/features/audit/components/audit-log-table.tsx` | Main audit UI    | 1-228                                                |
| `src/routes/dashboard/admin/sin/audit.tsx`          | Route definition | 1-32                                                 |
| `src/features/audit/audit.queries.ts`               | Server queries   | listAuditLogs, verifyAuditHashChain, exportAuditLogs |
| `src/lib/audit/index.ts`                            | Hash chain logic | 1-460                                                |
| `src/db/schema/audit.schema.ts`                     | Database schema  | auditLogs                                            |

---

## 4. RP-AGG-005 - Analytics Export (Priority: MEDIUM)

**Current Issues:**

- 19s of static pivot builder
- Only 1 organization in results
- No chart visualization
- No step-up auth shown
- No actual export completed

### 4.1 Code Changes Required

None required - all features exist. Need data seeding only.

### 4.2 Data Seeding Required

**File:** `scripts/seed-sin-data.ts`
**Add:** Form submissions across multiple organizations

- Phase 10: add a generator that loops over PSO + club organizations, inserting ~30 `formSubmissions` tied to the published annual stats form/version (`IDS.annualStatsFormId` / `IDS.annualStatsFormV1Id`) with mixed statuses (`submitted`, `approved`, `under_review`, `draft`), realistic payload totals, and createdAt spread over the last 90 days.
- Reuse deterministic UUIDs from `IDS` (add a short range like `annualStatsSubmissionOrg1Id...`) to keep exports and reporting references stable, and set `submitterId` to `IDS.psoAdminId` for consistency.

### 4.3 Script Changes

**File:** `scripts/verify-sin-analytics.ts`
**Status:** ✅ Updated (`record-sin-uat-rp-agg-005.ts`) to use seeded multi-org form submissions, build pivot (org/status/count), bar chart, step-up export, save to dashboard.
**Update:** Faster pacing, show chart + step-up + dashboard save

**Ideal Flow (60s):**

1. `/dashboard/analytics/explore` (2s)
2. Select "Form Submissions" dataset (3s)
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

### 4.4 Key Files

| File                                                                 | Purpose          | Lines   |
| -------------------------------------------------------------------- | ---------------- | ------- |
| `src/features/bi/components/pivot-builder/PivotBuilder.tsx`          | Pivot builder UI | 1-920   |
| `src/routes/dashboard/analytics/explore.tsx`                         | Route            | 1-50    |
| `src/features/bi/bi.mutations.ts`                                    | Export mutations | 163-414 |
| `src/features/auth/step-up.tsx`                                      | Step-up UI       | 1-200+  |
| `src/features/bi/components/pivot-builder/SaveToDashboardDialog.tsx` | Save dialog      | 1-200   |

---

## 5. DM-AGG-006 - Import Wizard (Priority: MEDIUM)

**Current Issues:**

- Blank frames at start
- Only 1 row imported
- Ends on "Pending" status
- No error → success flow shown
- No imported data verification

### 5.1 Code Changes Required

None required - all features exist. Need better demo data.

### 5.2 Demo Data Files Required

**File:** `docs/sin-rfp/legacy-data-samples/import-demo-annual-stats-large.csv`

```csv
total_registered_participants,male_participants,female_participants,youth_under_18,adults_18_plus,certified_coaches,events_competitions_held
500,250,250,300,200,15,12
450,220,230,280,170,12,8
480,240,240,290,190,14,10
... (50 rows total)
```

- Columns must mirror the seeded Annual Stats form schema to keep auto-mapping and row counts accurate during recording.

**File:** `docs/sin-rfp/legacy-data-samples/import-demo-annual-stats-errors.csv`

```csv
total_registered,male_participants,female_participants,youth_under_18,adults_18_plus,events_held
500,250,250,300,200,12
"not a number",220,230,280,170,8
450,220,230,280,170,8
450,220,230,280,170,8
```

Note: Missing `certified_coaches` column, invalid data in row 2, missing `total_registered_participants`.

- **Seed support:** In Phase 11 of `scripts/seed-sin-data.ts`, add a completed `importJobs` entry with 50 rows processed (targeting `IDS.annualStatsFormId` and `IDS.importTemplateId1`) plus a validating job with the error CSV to pre-populate import history for the recording.

### 5.3 Script Changes

**File:** `scripts/record-sin-uat-dm-agg-006.ts`
**Status:** ✅ Updated to error CSV → validation pane, 50-row clean CSV, mapping auto-applied, create job, run import, history, submissions view.
**Update:** Show error flow, larger dataset, completion

**Ideal Flow (90s):**

1. `/dashboard/admin/sin/imports?tab=wizard` - Direct navigation, no org selection (2s)
2. Select viaSport BC, Annual Statistics Report (5s)
3. Click "Download XLSX Template" → show download (3s)
4. Upload **error CSV** (5s)
5. Show validation errors panel:
   - "Missing required column: certified_coaches"
   - "Invalid number format in row 2"
   - Categorized by Structural vs Data Quality (10s)
6. Upload **good CSV** (50 rows) (5s)
7. Show auto-mapping with all 7 fields mapped (5s)
8. Show "Columns detected: 7, Rows: 50" (3s)
9. Click "Create import job" (3s)
10. Show progress indicator (5s)
11. Status changes to "Processing" → "Completed" (10s)
12. Click to view import details → show "50 rows imported" (5s)
13. Navigate to Form Submissions → show 50 new entries (10s)
14. Open one entry → show imported data correctly (5s)

### 5.4 Key Files

| File                                                      | Purpose          | Lines                        |
| --------------------------------------------------------- | ---------------- | ---------------------------- |
| `src/features/imports/components/smart-import-wizard.tsx` | Main wizard      | 1-1195                       |
| `src/routes/dashboard/admin/sin/imports.tsx`              | Route            | 1-71                         |
| `src/features/imports/components/categorized-errors.tsx`  | Error display    | 1-165                        |
| `src/features/imports/error-analyzer.ts`                  | Error detection  | 1-543                        |
| `src/features/imports/imports.mutations.ts`               | Import execution | runInteractiveImport 710-965 |

---

## 6. SEC-AGG-001 - Auth & MFA (Priority: LOW)

**Current Issues:**

- 17 frames (8.5s) static on Account Settings
- MFA section shows form fields, not status badge
- No passkey demonstration
- No active sessions shown

### 6.1 Code Changes Required ✅ DONE

#### Add prominent "MFA Enabled" badge ✅

**File:** `src/features/settings/components/settings-view.tsx:472-497`
**Status:** Already implemented - Shows Card with Shield icon, "Two-Factor Authentication" title, green "Enabled" badge with CheckCircle2, enrollment date in description, and "Regenerate backup codes" button when `twoFactorEnabled` is true.

### 6.2 Script Changes

**File:** `scripts/record-sin-uat-login-video.ts`
**Status:** ✅ Updated to capture MFA enabled badge, passkeys, and active sessions after login.
**Update:** Faster pacing, show more security features

**Ideal Flow (45s):**

1. `/auth/login` with email (3s)
2. Password entry (3s)
3. MFA challenge with TOTP (5s)
4. Dashboard with admin menu visible (3s) - shows role-based access
5. Settings → **"MFA Enabled" badge visible** (5s)
6. Scroll to Passkeys section → show registered passkeys (5s)
7. Click "Add passkey" → show registration flow (8s)
8. Scroll to Active Sessions → show devices with IP/location (5s)
9. Show "Revoke" button on another session (3s)

### 6.3 Key Files

| File                                                 | Purpose          | Lines |
| ---------------------------------------------------- | ---------------- | ----- |
| `src/features/settings/components/settings-view.tsx` | Settings UI      | 1-955 |
| `src/routes/dashboard/settings.tsx`                  | Route            | 1-30  |
| `src/features/auth/mfa/mfa-enrollment.tsx`           | MFA enrollment   | 1-178 |
| `scripts/record-sin-uat-login-video.ts`              | Recording script | 1-150 |

---

## Execution Order

1. ~~**Data Seeding First** - Run seed script with all new data~~ ✅ DONE (2026-01-11)
2. ~~**Code Changes** - Deploy UI improvements (MFA badge, form badge)~~ ✅ DONE (verified 2026-01-11)
3. **Re-record Videos** - In dependency order:
   - SEC-AGG-001 (establish session + MFA badge)
   - DM-AGG-001 (form builder + submission with seeded form)
   - DM-AGG-006 (import wizard using seeded template + CSVs)
   - RP-AGG-003 (reporting cycle/task with seeded cycle)
   - RP-AGG-005 (analytics export + step-up; also generates fresh audit events if desired)
   - SEC-AGG-004 (audit trail; pre-seeded entries already available)
4. **Frame Review** - Extract 2fps, subagent review each
5. **Edit & Iterate** - Trim, re-record problem sections

---

## Verification Checklist

For each final video:

- [ ] No blank frames at start/end
- [ ] No excessive loading spinners (>2s)
- [ ] No static content longer than 5s
- [ ] All key features demonstrated
- [ ] Success states clearly shown
- [ ] Duration 45-90 seconds
- [ ] Frame-by-frame review completed by subagent

---

## Test Credentials

- **User:** `viasport-staff@example.com`
- **Password:** `testpassword123`
- **TOTP Secret (base32):** `ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA`
- **Base URL:** `https://sinuat.solsticeapp.ca`

---

## FFmpeg Commands Reference

```bash
# Extract frames at 2fps for review
ffmpeg -i input.mp4 -vf "fps=2" frames/frame-%03d.png

# Trim first N seconds
ffmpeg -i input.mp4 -ss 2 -c copy output.mp4

# Trim to first N seconds
ffmpeg -i input.mp4 -t 60 -c copy output.mp4

# Speed up 1.5x
ffmpeg -i input.mp4 -filter:v "setpts=0.67*PTS" output.mp4

# Combine segments
ffmpeg -f concat -i filelist.txt -c copy output.mp4

# Add faststart for web
ffmpeg -i input.mp4 -movflags +faststart output.mp4
```
