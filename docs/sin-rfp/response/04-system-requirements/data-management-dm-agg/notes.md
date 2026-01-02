# Context Notes - System Requirements Compliance - Data Management (DM-AGG)

## Requirement Definitions

- DM-AGG-001 Data Collection and Submission
  - Description: Customizable forms, flexible data entry, tracking, editing, historical migration.
  - Acceptance: Users and admins can submit, track, and edit data.
- DM-AGG-002 Data Processing and Integration
  - Description: Standardize formats, log transformations, integrate via API, import/export.
  - Acceptance: Data is processed uniformly and exchanged as needed.
- DM-AGG-003 Data Governance and Access Control
  - Description: Role-based access, secure admin access, data cataloging.
  - Acceptance: Users only access data by permission.
- DM-AGG-004 Data Quality and Integrity
  - Description: Relational integrity, validation rules, automated checks.
  - Acceptance: Submitted data meets validation rules.
- DM-AGG-005 Data Storage and Retention
  - Description: Backups, disaster recovery, archiving, secure cloud hosting.
  - Acceptance: Data is backed up, archived, and securely hosted.
- DM-AGG-006 Legacy Data Migration and Bulk Import
  - Description: Tools and mapping for CSV/Excel/DB/API import with validation.
  - Acceptance: Admins can map fields, preview, import, and audit.

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

- DM-AGG-001 Data Collection and Submission
  - Response: Partial.
  - How requirement is met: Form builder + submission workflows with required fields, validation, and file uploads; reporting dashboard tracks submission status and review history; import intake supports legacy data staging.
  - Evidence: `src/features/forms/components/form-builder-shell.tsx`, `src/features/forms/forms.mutations.ts`, `src/features/reporting/components/reporting-dashboard-shell.tsx`, `e2e/tests/authenticated/file-upload-validation.auth.spec.ts`.
  - Notes: Single-file uploads only (maxFiles=1); confirm edit/history evidence for submissions.
- DM-AGG-002 Data Processing and Integration
  - Response: Partial.
  - How requirement is met: Import pipeline validates + standardizes rows (interactive + batch), logs audit events, and supports CSV/Excel import; exports available via reporting/analytics.
  - Evidence: `src/features/imports/components/import-wizard-shell.tsx`, `src/lib/imports/batch-runner.ts`, `src/workers/import-batch.ts`, `docs/sin-rfp/phase-0/import-batch-worker.md`.
  - Notes: External API integration PoC and transformation log UI are deferred.
- DM-AGG-003 Data Governance and Access Control
  - Response: Comply.
  - How requirement is met: Org-scoped RBAC + role guards; data catalog for discoverability; SQL Workbench (read-only, scoped views) for admin data access.
  - Evidence: `src/features/organizations`, `src/lib/auth/guards/org-context.ts`, `src/features/data-catalog/components/data-catalog-panel.tsx`, `src/features/bi/docs/CHECKLIST-sql-workbench-gate.md`, `e2e/tests/authenticated/roles-management.auth.spec.ts`.
  - Notes: SQL Workbench is feature-gated and requires DBA checklist completion to enable.
- DM-AGG-004 Data Quality and Integrity
  - Response: Comply.
  - How requirement is met: Client/server validation on forms and imports; data quality monitoring cron with dashboard summary and org-level breakdown.
  - Evidence: `src/features/data-quality/components/data-quality-dashboard.tsx`, `src/cron/data-quality-monitor.ts`, `src/features/forms/forms.utils.ts`, `src/features/imports/imports.utils.ts`.
  - Notes: Capture evidence of scheduled run in verification.
- DM-AGG-005 Data Storage and Retention
  - Response: Partial.
  - How requirement is met: Backup/DR plan + audit retention policy documented; PITR restore drill completed in sin-dev; retention job supports archiving and legal holds.
  - Evidence: `docs/sin-rfp/phase-0/backup-dr-plan.md`, `docs/sin-rfp/review-plans/backup-restore-test-results.md`, `docs/sin-rfp/phase-0/audit-retention-policy.md`, `src/lib/privacy/retention.ts`.
  - Notes: Object Lock/Glacier automation and production evidence still pending.
- DM-AGG-006 Legacy Data Migration and Bulk Import
  - Response: Partial.
  - How requirement is met: Import wizard supports CSV/Excel mapping templates, preview, validation, rollback; batch worker scaffolding exists for lane 2.
  - Evidence: `src/features/imports/components/import-wizard-shell.tsx`, `src/features/imports/imports.mutations.ts`, `src/workers/import-batch.ts`, `docs/sin-rfp/phase-0/import-batch-worker.md`.
  - Notes: File-field imports blocked by design; ECS worker deployment verification pending.
