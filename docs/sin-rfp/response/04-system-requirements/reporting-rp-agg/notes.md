# Context Notes - System Requirements Compliance - Reporting (RP-AGG)

## Requirement Definitions

- RP-AGG-001 Data Validation and Submission Rules
  - Description: Validate completeness, file types, and data fields.
  - Acceptance: Invalid submissions are rejected with errors.
- RP-AGG-002 Reporting Information Management
  - Description: Manage reporting metadata (agreements, NCCP, contacts, etc.).
  - Acceptance: Users can update metadata and access reporting features.
- RP-AGG-003 Reporting Flow and Support
  - Description: Automated reminders, resubmission tracking, dashboards.
  - Acceptance: Users are reminded and can view dashboards.
- RP-AGG-004 Reporting Configuration and Collection
  - Description: Admins configure forms, required fields, file management.
  - Acceptance: Admins can configure reporting and forms.
- RP-AGG-005 Self-Service Analytics and Data Export
  - Description: Ad-hoc charts, pivots, exports in CSV/Excel/JSON.
  - Acceptance: Users can build charts and export data with access rules.

## Evidence Targets

- Screenshots or exports demonstrating each requirement.
- References to supporting docs or code as needed.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md
- docs/sin-rfp/requirements/SIN-REQUIREMENTS.md

## Draft Notes (for final.md)

- RP-AGG-001 Data Validation and Submission Rules
  - Response: Comply.
  - How requirement is met: Form submissions enforce required fields, regex validation, and file type/size checks; reporting submissions validate task/form/org linkage.
  - Evidence: `src/features/forms/forms.schemas.ts`, `src/features/forms/forms.mutations.ts`, `e2e/tests/authenticated/file-upload-validation.auth.spec.ts`, `docs/sin-rfp/archive/streams/stream-d.md`.
  - Notes: Single-file uploads meet stated requirements (multi-file not specified in viaSport reqs).
- RP-AGG-002 Reporting Information Management
  - Response: Partial.
  - How requirement is met: Reporting cycles/tasks track due dates + reminders; org metadata/delegated access stored in organizations and scoped by roles.
  - Evidence: `src/features/reporting`, `src/db/schema/reporting.schema.ts`, `src/db/schema/organizations.schema.ts`, `docs/sin-rfp/review-plans/gap-closure-plan.md`.
  - Notes: Dedicated metadata fields for agreements/NCCP/fiscal periods still pending.
- RP-AGG-003 Reporting Flow and Support
  - Response: Comply.
  - How requirement is met: Reporting dashboard shows task status + history; reminder schedules drive in-app/email notifications via scheduler.
  - Evidence: `src/features/reporting/components/reporting-dashboard-shell.tsx`, `src/lib/notifications/scheduler.ts`, `src/cron/notification-worker.ts`, `docs/sin-rfp/review-plans/evidence/NOTIFICATIONS-DELIVERY-sin-dev-20251231.md`.
  - Notes: Real email delivery verified 2025-12-31.
- RP-AGG-004 Reporting Configuration and Collection
  - Response: Comply.
  - How requirement is met: Form builder configures reporting forms and required fields; reporting tasks bind forms to cycles and orgs; submission review workflow supported.
  - Evidence: `src/features/forms/components/form-builder-shell.tsx`, `src/features/reporting/reporting.mutations.ts`, `src/features/forms/forms.queries.ts`.
  - Notes: File delete/replace flow supported; single-file meets stated requirements.
- RP-AGG-005 Self-Service Analytics and Data Export
  - Response: Comply.
  - How requirement is met: Report builder supports pivots, charts, and CSV/XLSX export with PII-aware redaction.
  - Evidence: `src/features/reports/components/report-pivot-builder.tsx`, `src/routes/dashboard/sin/analytics.tsx`, `e2e/tests/authenticated/report-export.auth.spec.ts`.
  - Notes: Capture evidence using real data; seeded roles need `pii.read` to expose PII.
