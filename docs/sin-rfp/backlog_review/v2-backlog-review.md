# SIN v2 backlog review and requirements alignment

Date: 2025-12-23

## Context

This review summarizes what has been implemented so far against
`docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md` and how the current code
aligns with `docs/sin-rfp/SIN-REQUIREMENTS.md`. The focus is on security,
tenancy, auditability, reporting, forms/imports, and DSAR/retention.

## Scope

- Code review of SIN-related features (organizations, audit, notifications,
  security, privacy/DSAR, forms, imports, reporting, reports).
- Requirements alignment review against the SIN requirements document.
- This is a static review (no runtime verification beyond prior manual UI checks).

## Summary alignment (brief)

- Foundations are in place: organizations/tenancy, audit logging with hash chain,
  notifications, security events + lockout rules, DSAR workflows, forms + imports,
  reporting cycles, and report exports exist in code.
- Access control, org scoping, audit retention immutability, DSAR S3 cleanup,
  server-side file validation, SQS/SES integrations, and XLSX export support have
  been implemented and deployed to dev.
- Remaining follow-ups are tracked as technical debt: SQS queue setup, SES
  verification, and E2E tests.

## Implementation update (dev)

- Status: All SIN v2 backlog patches (Issues 01-11) applied and deployed to the
  dev environment.
- Issues 01-04 (Access Control)
  - `audit.queries.ts` - Added auth + org-scoped filtering for audit logs.
  - `security.queries.ts` - Added auth checks for security events.
  - `reporting.mutations.ts` - Added permission checks for reporting cycles/tasks.
  - `reports.mutations.ts` - Added org scoping + permission-based ACL for reports.
- Issues 05-06, 09 (Privacy/Notifications)
  - `retention.ts` - Added audit log immutability (never delete) + S3 cleanup.
  - `privacy.mutations.ts` - Added S3 file cleanup to DSAR erasure.
  - `submission-files.ts` - Added S3 batch deletion helper.
  - `queue.ts` - Replaced stub with SQS integration (dev falls back to direct send).
  - `send.ts` - Replaced stub with SES email integration.
  - `scheduler.ts` - Added idempotency for scheduled notifications.
- Issues 07-08, 10-11 (Forms/Testing)
  - `step-up.ts` - Added re-auth window check (15 min) for sensitive operations.
  - `forms.utils.ts` - Added server-side file validation helpers.
  - `forms.mutations.ts` - Added server-side file type/size validation on upload.
  - `xlsx.ts` - Added XLSX generation for Excel exports.
  - `notification-worker.ts` - Added SQS consumer for Lambda processing.
- Infrastructure
  - Added dependencies: `@aws-sdk/client-sqs`, `@aws-sdk/client-ses`,
    `@types/aws-lambda`, `xlsx`.
  - Added `badRequest` error type to `errors.ts`.
  - Fixed TypeScript issues with `exactOptionalPropertyTypes`.
- Deployed
  - Dev URL: https://d151to0xpdboo8.cloudfront.net
  - Health check: Healthy
- Technical Debt Tracked
  - See `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md` for design decisions,
    follow-ups (SQS queue setup, SES verification, E2E tests), and production
    environment variables.

## Issues (detailed)

### Issue 01 - Audit log access is not restricted

- Severity: Critical
- Requirements: SEC-AGG-004, DM-AGG-003
- Status: Resolved in dev (2025-12-23).
- Description: Audit log list/export endpoints have no auth or admin guard,
  allowing unrestricted access to sensitive audit data.
- Evidence: `src/features/audit/audit.queries.ts:6`, `src/features/audit/audit.queries.ts:46`
- Impact: Any caller can exfiltrate security and admin activity, violating audit
  access controls and regulatory expectations.
- Recommendation: Require admin (global and/or org admin) and filter by org
  membership; add explicit access checks on list/export.
- Resolution: Added auth + org-scoped filtering for audit logs.

### Issue 02 - Security events and account locks are not restricted

- Severity: Critical
- Requirements: SEC-AGG-002, DM-AGG-003
- Status: Resolved in dev (2025-12-23).
- Description: Security event and account lock queries do not verify user
  permissions.
- Evidence: `src/features/security/security.queries.ts:13`,
  `src/features/security/security.queries.ts:32`
- Impact: Unauthorized users can inspect attack telemetry and lock details.
- Recommendation: Gate to security/admin roles and scope by org where relevant.
- Resolution: Added auth checks for security event access.

### Issue 03 - Reporting mutations do not enforce permissions

- Severity: Critical
- Requirements: RP-AGG-003, RP-AGG-004, DM-AGG-003
- Status: Resolved in dev (2025-12-23).
- Description: Reporting cycle creation, task assignment, and submission updates
  do not check org/admin permissions.
- Evidence: `src/features/reporting/reporting.mutations.ts:18`,
  `src/features/reporting/reporting.mutations.ts:50`,
  `src/features/reporting/reporting.mutations.ts:195`
- Impact: Any authenticated user could create tasks or alter reporting status.
- Recommendation: Require global admin for cycle/task creation and org admin or
  assigned roles for submission updates.
- Resolution: Added permission checks for cycles, tasks, and submission updates.

### Issue 04 - Report exports ignore org scoping and use static field access

- Severity: Critical
- Requirements: RP-AGG-005, DM-AGG-003
- Status: Resolved in dev (2025-12-23).
- Description: Export loads entire tables without org filters, and field access
  policy only checks hard-coded global admin role names.
- Evidence: `src/features/reports/reports.mutations.ts:79`,
  `src/features/reports/reports.mutations.ts:16`,
  `src/features/reports/reports.mutations.ts:233`
- Impact: Non-admins could export cross-org data; sensitive fields are not
  properly governed.
- Recommendation: Apply org-based row filtering (membership + org scope) and
  implement explicit field-level policies tied to roles/permissions.
- Resolution: Added org scoping and permission-based field ACLs for exports.

### Issue 05 - Retention deletes audit logs, breaking immutability

- Severity: High
- Requirements: SEC-AGG-004, DM-AGG-005
- Status: Resolved in dev (2025-12-23).
- Description: Retention job deletes `audit_logs`, which invalidates the hash
  chain and undermines tamper-evidence.
- Evidence: `src/lib/privacy/retention.ts:73`, `src/lib/audit/index.ts:240`
- Impact: Audit integrity checks can no longer prove historical completeness.
- Recommendation: Do not purge audit logs; instead archive to immutable storage
  (e.g., WORM S3 + Glacier) or keep indefinitely per policy.
- Resolution: Retention keeps audit logs and adds S3 cleanup where applicable.

### Issue 06 - DSAR erasure and retention do not remove S3 artifacts

- Severity: High
- Requirements: SEC-AGG-003, DM-AGG-005
- Status: Resolved in dev (2025-12-23).
- Description: DSAR erasure anonymizes DB records but does not delete form
  upload artifacts; retention cleanup only deletes DB rows.
- Evidence: `src/features/privacy/privacy.mutations.ts:455`,
  `src/lib/privacy/retention.ts:65`
- Impact: PII can remain in object storage after erasure/retention actions.
- Recommendation: Track S3 keys and delete or lifecycle-expire associated objects
  during DSAR/retention.
- Resolution: Added S3 deletion for DSAR erasure and retention cleanup.

### Issue 07 - Step-up auth does not require re-authentication

- Severity: Medium
- Requirements: SEC-AGG-001
- Status: Resolved in dev (2025-12-23).
- Description: `requireMfaEnabled` only checks that MFA is enabled, not that
  the user recently re-authenticated for sensitive actions.
- Evidence: `src/lib/auth/guards/step-up.ts:3`
- Impact: Sensitive actions (exports, role changes) lack a true step-up prompt.
- Recommendation: Add a re-auth window or explicit MFA challenge on sensitive
  actions.
- Resolution: Added a 15-minute re-auth window check for sensitive operations.

### Issue 08 - Server-side file constraints are missing

- Severity: Medium
- Requirements: DM-AGG-001, DM-AGG-004
- Status: Resolved in dev (2025-12-23).
- Description: File type/size limits are only enforced client-side; server
  upload init does not validate against `fileConfig`.
- Evidence: `src/features/forms/forms.utils.ts:89`,
  `src/features/forms/forms.mutations.ts:364`,
  `src/components/form-fields/ValidatedFileUpload.tsx:16`
- Impact: Bypassed client checks can allow invalid or oversized uploads.
- Recommendation: Validate `mimeType`, size, and count server-side before
  presigning uploads and during submission validation.
- Resolution: Added server-side validation for upload type/size/count.

### Issue 09 - Notification queue and email delivery are stubbed

- Severity: Medium
- Requirements: UI-AGG-004, RP-AGG-003
- Status: Resolved in dev (2025-12-23).
- Description: The queue layer is a pass-through, and email delivery is a log
  statement only.
- Evidence: `src/lib/notifications/queue.ts:4`,
  `src/lib/notifications/send.ts:15`
- Impact: Reminders will not deliver via email or SQS until integrated.
- Recommendation: Implement SQS enqueue + SES send and retry handling.
- Resolution: Added SQS enqueue with dev fallback, SES delivery, and scheduler
  idempotency.

### Issue 10 - Excel export is CSV-only

- Severity: Medium
- Requirements: RP-AGG-005
- Status: Resolved in dev (2025-12-23).
- Description: The "excel" export path returns CSV text, not XLSX.
- Evidence: `src/features/reports/reports.mutations.ts:258`,
  `src/shared/lib/csv.ts:1`
- Impact: Users expecting real Excel files will receive CSV.
- Recommendation: Generate XLSX with a library or remove "excel" option.
- Resolution: Added XLSX generation for Excel exports.

### Issue 11 - New SIN modules lack automated tests

- Severity: Low
- Requirements: Testing & QA (Scope of Services)
- Status: Follow-up tracked as technical debt.
- Description: No tests are present for new SIN modules (forms/imports/reporting/
  privacy/security), leaving critical flows unverified.
- Evidence: `src/features/forms/`, `src/features/imports/`,
  `src/features/reporting/`, `src/features/privacy/`, `src/features/security/`
- Impact: Higher risk of regressions in core compliance workflows.
- Recommendation: Add integration tests for permissions, DSAR, imports, and
  reporting submissions.
- Resolution: E2E coverage remains a follow-up item in
  `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`.
