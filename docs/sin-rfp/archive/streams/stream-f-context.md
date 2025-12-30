# Stream F Context (Reporting and Report Correctness)

Purpose: capture Stream F background from implementation/decision docs so I do
not have to re-open them while working the backlog.

## Source docs consulted

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/3-implementation.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/5-implementation.md`

## Stream F backlog items

- F1 Reporting status enum mismatch (add or remove "rejected").
- F2 Validate `formSubmissionId` and `formSubmissionVersionId` belong to
  task/form/org.
- F3 Clear stale review/submission metadata when status changes.
- F4 Sanitize reminder schedule (unique positive integers, bounded).
- F5 Apply filters, columns, and sort server-side using an allowlist; ensure
  audit `filtersUsed` matches applied filters.
- F6 Implement real export formats: XLSX via xlsx, PDF only if supported; update
  UI to match.
- F7 Redact nested form payload fields using per-field PII flags; update schemas
  and UI.
- F8 Tighten PII policy to require explicit `pii.read` permission (remove
  implicit admin access).

## Reporting integrity context (3-implementation + D0.5)

- Status mismatch: UI includes "rejected" but DB enum and schema do not.
  Decision D0.5 recommends adding "rejected" to the enum with transition rules
  (`rejected` only from `under_review`, terminal), and requires a rejection
  reason. This also implies clearing stale review metadata on status changes.
- Submission linking: `updateReportingSubmission` accepts `formSubmissionId`
  without validating it belongs to the reporting task's form + org; history
  accepts `formSubmissionVersionId` without validating it belongs to the
  submission. This enables cross-org or wrong-form links.
- Metadata clearing: review/submission timestamps and notes persist even when
  leaving those statuses; needs explicit clearing when status changes.
- Reminder schedule: `createReportingTask` accepts negative/duplicate day
  offsets; should normalize to unique positive integers within a bounded range.

## Reports correctness context (3-implementation + D0.6/D0.7)

- Filters/columns/sort are accepted but ignored in `loadReportData`, while audit
  logs still record `filtersUsed`. D0.7 requires a server-side allowlist for
  each data source and applying validated filters/columns/sort to queries.
- Export formats are incorrect: Excel exports are CSV, PDF exports return JSON;
  UI downloads CSV unless PDF selected. Stream F requires true XLSX via `xlsx`
  and removing PDF until supported.
- PII redaction currently masks only top-level keys and ignores nested form
  payloads. D0.6 recommends per-field data classification in form definitions
  (none/personal/sensitive) and redaction based on classification.
- PII policy is permissive (org admins can view by default). Stream F requires
  explicit `pii.read` permission for sensitive data (remove implicit admin
  access).

## Implementation sketch references

- D0.5: add `rejected` enum value + transition rules in
  `src/features/reporting/reporting.mutations.ts`.
- D0.6: add `dataClassification` to form field schema and use it to redact
  `payload` fields in report exports.
- D0.7: introduce `reports.config.ts`/`reports.validation.ts` allowlist and apply
  server-side filtering, column selection, and sorting in `reports.mutations.ts`.

## Notes

- Stream C already hardened report access/authorization; Stream F assumes those
  guards are in place.
- Step-up is already enforced for report exports; no new step-up changes should
  be needed here.
