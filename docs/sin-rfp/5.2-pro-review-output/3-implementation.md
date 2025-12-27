# 3.md Review and Implementation Plan

## Scope

- Source doc: `docs/sin-rfp/5.2-pro-review-output/3.md`
- Code reviewed: forms, imports, reporting, reports features plus related schemas and UI shells
- Status legend: Confirmed = issue exists in current code; Partial = partly addressed or partially mitigated

## Review of 3.md vs codebase

### Forms

1. Submitted submissions are not rejected when invalid - Confirmed
   - `submitForm` and `updateFormSubmission` compute `missingFields` and `validationErrors` but still persist `status="submitted"`.
   - Evidence: `src/features/forms/forms.mutations.ts` (`submitForm`, `updateFormSubmission`).
2. Required-field logic is wrong for checkbox/multiselect/file - Confirmed
   - Server validation only checks null/empty string; does not treat `false`, `[]`, or empty file payloads as missing.
   - Evidence: `src/features/forms/forms.utils.ts` (`validateFormPayload`).
3. NaN values pass validation - Confirmed
   - Client converts `Number(value)` and server validation does not treat `NaN` as invalid.
   - Evidence: `src/features/forms/components/form-builder-shell.tsx` (`normalizePayload`, number input) and `src/features/forms/forms.utils.ts`.
4. Regex validation can crash on invalid pattern - Confirmed
   - `new RegExp` used without try/catch or schema validation.
   - Evidence: `src/features/forms/components/form-builder-shell.tsx` and `src/features/forms/forms.utils.ts`.
5. File storageKey is not validated on submission - Confirmed
   - `isValidStorageKeyPrefix` exists but is unused; storageKey comes from payload without server checks.
   - Evidence: `src/features/forms/forms.utils.ts`, `src/features/forms/forms.mutations.ts` (`insertSubmissionFiles`).
6. `createFormUpload` accepts any fieldKey - Confirmed
   - `getFileConfigForField` returns default config when field missing or non-file, so uploads still allowed.
   - Evidence: `src/features/forms/forms.mutations.ts`, `src/features/forms/forms.utils.ts`.
7. `maxFiles` not enforced and multi-file likely broken - Confirmed
   - UI and server only handle a single file payload; component uses single file input.
   - Evidence: `src/features/forms/components/form-builder-shell.tsx`, `src/components/form-fields/ValidatedFileUpload.tsx`, `src/features/forms/forms.mutations.ts`.
8. Submission read/update access is too permissive - Confirmed
   - `requireOrgAccess` is used without role or submitter checks for list/view/download/update.
   - Evidence: `src/features/forms/forms.queries.ts`, `src/features/forms/forms.mutations.ts`.
9. File download access is not audit logged - Confirmed
   - No audit event in `getSubmissionFileDownloadUrl`.
   - Evidence: `src/features/forms/forms.queries.ts`.
10. Completeness score counts inactive conditional fields - Confirmed
    - `totalFields = definition.fields.length` ignores conditionals.
    - Evidence: `src/features/forms/forms.utils.ts`.
11. `updateForm` clears description when omitted - Confirmed
    - `description: data.data.description ?? null` wipes value on partial updates.
    - Evidence: `src/features/forms/forms.mutations.ts` (`updateForm`).
12. Form settings stored but not enforced - Confirmed
    - `requireApproval` and `notifyOnSubmit` are never used on submit.
    - Evidence: `src/features/forms/forms.schemas.ts`, `src/features/forms/forms.mutations.ts`.

### Imports

13. Interactive import can target wrong form - Confirmed
    - No check that `job.targetFormId === data.formId` or that form org matches job org.
    - Evidence: `src/features/imports/imports.mutations.ts` (`runInteractiveImport`).
14. Interactive import trusts client rows, not source file - Confirmed
    - `sourceFileKey`/`sourceFileHash` are ignored; `data.rows` are inserted directly.
    - Evidence: `src/features/imports/imports.mutations.ts` (`runInteractiveImport`).
15. Mapping template CRUD lacks audit logging - Confirmed
    - No `logDataChange`/`logAdminAction` for create/update/delete.
    - Evidence: `src/features/imports/imports.mutations.ts`.
16. `updateImportJobStatus` lacks audit logging - Confirmed
    - Status updates are written without audit logging.
    - Evidence: `src/features/imports/imports.mutations.ts`.
17. Rollback may leave orphans - Partial
    - `form_submission_versions` and `submission_files` are cascade deleted by FK, but `import_job_errors` are retained and submissions are removed without explicit transaction.
    - Evidence: `src/db/schema/forms.schema.ts`, `src/db/schema/imports.schema.ts`, `src/features/imports/imports.mutations.ts`.
18. Import stats count errors, not failed rows - Confirmed
    - `failed: errors.length` counts field errors rather than distinct rows.
    - Evidence: `src/features/imports/imports.mutations.ts` (`runInteractiveImport`).
19. Type conversion accepts NaN and weak multiselect parsing - Confirmed
    - `Number(rawValue)` can produce `NaN`; multiselect split keeps empty values.
    - Evidence: `src/features/imports/imports.mutations.ts`, `src/lib/imports/batch-runner.ts`.
20. File fields are not supported but not blocked - Confirmed
    - UI and server allow mapping to file fields without ingestion support.
    - Evidence: `src/features/imports/components/import-wizard-shell.tsx`, `src/features/imports/imports.mutations.ts`.

### Reporting

21. Reporting queries allow unauthenticated access - Confirmed
    - `listReportingCycles` is public; tasks/submissions only enforce access when a session exists.
    - Evidence: `src/features/reporting/reporting.queries.ts`.
22. Status enum mismatch ("rejected") - Confirmed
    - UI includes "rejected"; schema and DB enum do not.
    - Evidence: `src/features/reporting/components/reporting-dashboard-shell.tsx`,
      `src/features/reporting/reporting.schemas.ts`, `src/db/schema/reporting.schema.ts`.
23. Form submission linking not validated - Confirmed
    - `formSubmissionId` and `formSubmissionVersionId` are not validated against task/form/org.
    - Evidence: `src/features/reporting/reporting.mutations.ts` (`updateReportingSubmission`).
24. Review/submission metadata not cleared on status changes - Confirmed
    - `reviewedBy/At/Notes` and `submittedAt/By` are not cleared when leaving those states.
    - Evidence: `src/features/reporting/reporting.mutations.ts`.
25. Reminder schedule not sanitized - Confirmed
    - Negative/duplicate `days_before` values are allowed and can schedule after due date.
    - Evidence: `src/features/reporting/reporting.mutations.ts` (`createReportingTask`).

### Reports

26. Saved report listing has no auth or scoping - Confirmed
    - Returns all saved reports if no org filter; no session guard.
    - Evidence: `src/features/reports/reports.queries.ts`.
27. Saved report create/update lacks org permission checks - Confirmed
    - `organizationId`, `isOrgWide`, and `sharedWith` are not validated.
    - Evidence: `src/features/reports/reports.mutations.ts`.
28. Export ignores filters/columns/sort - Confirmed
    - `loadReportData` does not apply filters or column selection, but export history records filters.
    - Evidence: `src/features/reports/reports.mutations.ts`.
29. Excel/PDF exports are not real - Confirmed
    - Excel uses CSV; PDF returns JSON; UI downloads CSV unless PDF.
    - Evidence: `src/features/reports/reports.mutations.ts`,
      `src/features/reports/components/report-builder-shell.tsx`.
30. Field-level ACL ignores nested payload PII - Confirmed
    - `applyFieldLevelAcl` only masks top-level keys; form submission payload remains exposed.
    - Evidence: `src/features/reports/reports.mutations.ts`.
31. PII policy is permissive by default - Confirmed
    - Org owners/admins are allowed to view PII without explicit permission.
    - Evidence: `src/features/reports/reports.mutations.ts` (`canViewSensitiveFields`).

## Implementation plan

### Phase 0 - Decisions and alignment

1. Multi-file support
   - Decide whether to fully support multi-file uploads or to enforce `maxFiles=1` until UI/server can handle arrays.
2. Reporting status "rejected"
   - Decide to add "rejected" to reporting status enums (DB + schema + UI) or remove it from UI and logic.
3. PII model for form payloads
   - Define whether PII is flagged per form field (recommended) and how redaction should behave in exports.
4. Report filters/columns contract
   - Define a strict allowlist of filterable fields and column projections per data source.
5. Import rollback error retention
   - Decide whether to keep `import_job_errors` on rollback (for audit) or clear them.

### Phase 1 - Forms data integrity and file security

1. Enforce submitted validity
   - Add server guards in `submitForm` and `updateFormSubmission` to reject `status="submitted"` when
     `missingFields` or `validationErrors` exist.
   - Files: `src/features/forms/forms.mutations.ts`.
2. Make validation field-type aware
   - Introduce `isFieldEmpty(definition, field, payload)` in `src/features/forms/forms.utils.ts`.
   - Treat checkbox required as `value !== true`, multiselect required as empty array, file required as missing file payload.
   - Treat `Number.isNaN(value)` as invalid for numeric fields.
   - Use `parseFileFieldValue` and `validateFileField` for file constraints.
3. Guard regex validation
   - Add zod refine for `validationRuleSchema` when `type === "pattern"` and rule value is a valid regex.
   - Wrap `new RegExp` in try/catch in `validateFormPayload` and client-side validator.
   - Files: `src/features/forms/forms.schemas.ts`, `src/features/forms/forms.utils.ts`,
     `src/features/forms/components/form-builder-shell.tsx`.
4. Fix completeness score
   - Compute denominator based on active fields (or active required fields), not `definition.fields.length`.
5. Preserve description on update
   - In `updateForm`, only set `description` when provided in the patch; otherwise keep existing.
6. Enforce form settings
   - If `requireApproval`, translate submitted status to `under_review` and keep `submittedAt`/`submittedBy`.
   - If `notifyOnSubmit`, send notifications to listed user IDs using the existing notification scheduler.
7. Secure file submissions
   - Validate `storageKey` with `isValidStorageKeyPrefix("forms/<formId>/")` and reject mismatches.
   - Optional hardening: add a `form_uploads` table keyed by `(storageKey, formId, fieldKey, userId)`
     and require a matching, unused upload record at submission time.
   - Files: `src/features/forms/forms.mutations.ts`, `src/db/schema/forms.schema.ts` (if adding table).
8. Enforce fieldKey correctness in uploads
   - In `createFormUpload`, load field by key and require `field.type === "file"`; otherwise `badRequest`.
9. Decide and implement multi-file behavior
   - If supporting multi-file:
     - Update `ValidatedFileUpload` to accept multiple files and return arrays.
     - Update `normalizePayload` to upload arrays and store array payloads.
     - Update `buildSubmissionFiles` to flatten arrays.
   - If deferring:
     - Clamp `maxFiles` to 1 in form builder and validation, and hard-fail any array payloads.
10. Access control and audit for submissions and downloads

- Add submitter vs reviewer/admin checks for list/view/update/download endpoints.
- Add audit log on download URL issuance.
- Files: `src/features/forms/forms.queries.ts`, `src/features/forms/forms.mutations.ts`,
  `src/lib/audit/index.ts`.

### Phase 2 - Imports hardening

1. Job/form/org validation
   - Enforce `job.targetFormId === data.formId` (or set once if null), and that the form org matches `job.organizationId`.
2. Server-side source file verification
   - Fetch `sourceFileKey` from S3, compute SHA-256, compare to `sourceFileHash`.
   - Parse file server-side (reuse `streamToBuffer` and parsing in `src/lib/imports/batch-runner.ts`).
   - Ignore client `data.rows` for persistence; use it only for preview UI if needed.
3. Normalize row parsing
   - Treat `NaN` as an error and add row error; trim and filter multiselect values.
   - Apply the same parsing to `runInteractiveImport` and `runBatchImportJob`.
4. Block or implement file-field imports
   - Short-term: disallow mapping to file fields in UI and server.
   - Long-term: add a controlled ingestion pipeline for files (server fetch, validate, upload).
5. Improve stats and error summaries
   - Track `failedRows` distinct from `errorCount`.
6. Audit logging
   - Add audit logs for mapping template CRUD and `updateImportJobStatus`.
7. Rollback behavior
   - Use a DB transaction for rollback; consider clearing `import_job_errors` if required.
   - Files: `src/features/imports/imports.mutations.ts`, `src/lib/imports/batch-runner.ts`,
     `src/features/imports/components/import-wizard-shell.tsx`.

### Phase 3 - Reporting integrity

1. Require authentication for all reporting queries
   - Enforce session in `listReportingCycles`, `listReportingTasks`, `listReportingSubmissions`.
2. Enforce org scoping and roles
   - Always require `requireOrganizationAccess` for org-scoped data.
3. Resolve status mismatch
   - Add "rejected" to DB enum and schema, or remove it from UI and status logic.
4. Validate linked form submissions
   - Ensure `formSubmissionId` belongs to the expected form and org, and
     `formSubmissionVersionId` belongs to the submission.
5. Clear stale metadata on status transitions
   - Reset `reviewedBy/At/Notes` and `submittedBy/At` when leaving those states.
6. Sanitize reminder schedule
   - Normalize `days_before` to unique positive integers with a reasonable max range.
   - Files: `src/features/reporting/reporting.queries.ts`,
     `src/features/reporting/reporting.mutations.ts`,
     `src/features/reporting/reporting.schemas.ts`,
     `src/db/schema/reporting.schema.ts`,
     `src/features/reporting/components/reporting-dashboard-shell.tsx`.

### Phase 4 - Reports hardening and export correctness

1. Auth and org scoping
   - Require session for saved report listing and enforce per-user visibility:
     owner, sharedWith, or org-wide within accessible orgs.
   - Validate `organizationId` on create/update and restrict `isOrgWide` to org admins.
2. Export authorization
   - Use `requireOrganizationAccess` (roles: owner/admin/reporter) for non-admin exports.
   - Require explicit org context (header or filter) and reject mismatches.
3. Filters, columns, and sort
   - Define an allowlist per data source, validate `filters` and `columns`, and apply them server-side.
   - Ensure audit `filtersUsed` matches actual applied filters.
4. Real export formats
   - Generate XLSX using `xlsx` and return the correct file type and extension.
   - Implement PDF export or remove the option until supported; update UI to match.
5. Field-level ACL for form submissions
   - Redact nested payload fields using per-field PII metadata in form definitions.
   - Add PII flags to form fields in `formFieldSchema` and default to false.
6. Tighten PII policy
   - Require explicit `pii.read` permission; remove implicit owner/admin access or gate behind config.
   - Files: `src/features/reports/reports.queries.ts`, `src/features/reports/reports.mutations.ts`,
     `src/features/reports/reports.schemas.ts`, `src/features/reports/components/report-builder-shell.tsx`.

### Phase 5 - Tests and verification

1. Unit tests
   - `validateFormPayload` (checkbox, multiselect, file, NaN, regex).
   - Import parsing and stats (NaN, multiselect blanks, failedRows vs errorCount).
2. Integration tests
   - Submission access control (submitter vs admin/reviewer).
   - Reporting submission linking validation.
   - Report export scoping and redaction rules.
3. E2E tests (if required by SIN readiness)
   - Form submission approval flow and notifications.
   - Interactive import job validation (job/form mismatch).
   - Report export formats and access restrictions.
