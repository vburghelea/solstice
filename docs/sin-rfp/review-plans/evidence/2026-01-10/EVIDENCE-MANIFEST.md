# RFP Evidence Manifest - January 10, 2026

## Summary

| Requirement | Screenshots | Video     | Status   |
| ----------- | ----------- | --------- | -------- |
| SEC-AGG-001 | 4           | Yes (30s) | Complete |
| RP-AGG-005  | 3           | Yes (34s) | Complete |
| SEC-AGG-004 | 3           | Yes (30s) | Complete |
| DM-AGG-001  | 6           | Yes (26s) | Complete |
| DM-AGG-006  | 6           | Yes (22s) | Complete |
| RP-AGG-003  | 4           | Yes (17s) | Complete |

## Videos

All videos are in `videos/` with `-FINAL.mp4` suffix:

1. **SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4** (30s, 1.1MB)
   - Login flow with email/password
   - MFA TOTP challenge and verification
   - Dashboard landing after authentication
   - Account Settings showing MFA configuration

2. **RP-AGG-005-analytics-export-flow-FINAL.mp4** (34s, 1.7MB)
   - Analytics query builder interface
   - Dataset selection and configuration
   - Export options (CSV, Excel, JSON)
   - Query execution and results

3. **SEC-AGG-004-audit-verification-flow-FINAL.mp4** (30s, 1.6MB)
   - Audit Log admin interface
   - Filter by EXPORT category
   - Hash chain verification (shows "verified successfully")
   - Export to CSV functionality

4. **DM-AGG-001-form-submission-flow-FINAL.mp4** (26s, 1.2MB)
   - Forms admin interface
   - SIN Portal dashboard
   - User forms view with sidebar navigation
   - Forms list showing "No forms assigned yet"

5. **DM-AGG-006-import-wizard-flow-FINAL.mp4** (22s, 1.1MB)
   - Import wizard setup interface
   - File upload with CSV support
   - Field mapping configuration
   - Intelligent analysis section

6. **RP-AGG-003-reporting-workflow-flow-FINAL.mp4** (17s, 1.0MB)
   - Reporting admin dashboard
   - Reporting cycle creation form
   - Existing cycles (FY 2026-27, Q4 2025, Q1 2026)
   - Task assignment UI

## Screenshots

### SEC-AGG-001 (Authentication & MFA)

- `01-login-email-entry.png` - Login form with email field
- `02-mfa-totp-challenge.png` - TOTP code entry screen
- `03-post-login-dashboard.png` - Dashboard after successful login
- `04-mfa-status-settings.png` - Account settings showing MFA status

### RP-AGG-005 (Analytics & Export)

- `01-analytics-explore-loaded.png` - Analytics explorer interface
- `02-analytics-query-setup.png` - Query configuration
- `03-analytics-dataset-options.png` - Available datasets

### SEC-AGG-004 (Audit Trail)

- `01-audit-log-loaded.png` - Audit log interface
- `02-audit-export-filter.png` - Filtered by EXPORT category
- `03-audit-hash-verified.png` - Hash chain verification success

### DM-AGG-001 (Forms)

- `01-forms-admin-loaded.png` - Forms admin dashboard
- `02-form-builder-fields.png` - Form builder interface
- `03-forms-list-view.png` - Forms list
- `04-form-filled-entry.png` - Form with data
- `05-form-detail-view.png` - Form detail view
- `06-form-submission.png` - Form submission

### DM-AGG-006 (Import Wizard)

- `01-import-wizard-upload.png` - Import wizard setup
- `02-import-file-selected.png` - File selected for import
- `03-import-field-mapping.png` - Field mapping UI
- `04-import-analysis.png` - Import analysis
- `05-import-history.png` - Import history
- `06-import-complete.png` - Import completion

### RP-AGG-003 (Reporting Workflow)

- `01-reporting-admin-dashboard.png` - Reporting admin view
- `02-reporting-task-assignment.png` - Task assignment UI
- `03-reporting-cycle-form.png` - Cycle creation form
- `04-submissions-section.png` - Submissions overview

## Capture Details

- **Environment**: sin-uat (https://sinuat.solsticeapp.ca)
- **Test User**: viasport-staff@example.com
- **Capture Date**: January 10, 2026
- **Tools**: Playwright 1.57.0, FFmpeg 8.0.1, otplib for TOTP
- **Resolution**: 1440x900

## Scripts

Evidence capture scripts located in `scripts/`:

- `sin-uat-evidence-utils.ts` - Shared utilities
- `record-sin-uat-sec-agg-001.ts` - Auth/MFA recording
- `record-sin-uat-sec-agg-004.ts` - Audit trail recording
- `record-sin-uat-dm-agg-001.ts` - Forms recording
- `record-sin-uat-dm-agg-006.ts` - Import wizard recording
- `record-sin-uat-rp-agg-003.ts` - Reporting workflow recording
- `record-sin-uat-rp-agg-003-admin.ts` - Reporting admin recording
- `verify-sin-analytics.ts` - Analytics/export recording
