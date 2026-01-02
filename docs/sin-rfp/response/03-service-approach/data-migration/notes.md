# Context Notes - Service Approach - Data Migration

## RFP Prompts

- Detailed migration methodology (mapping, cleansing, validation, rollback).
- Audit trail and success verification approach.
- Data quality targets and defect workflow.

## Evidence Targets

- Sample mapping templates or runbook.
- Migration logs or reconciliation reports.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/phase-0/migration-strategy.md
- docs/sin-rfp/phase-0/import-batch-worker.md
- docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md
- docs/sin-rfp/decisions/ADR-2025-12-26-d0-8-import-error-retention.md
- docs/sin-rfp/decisions/ADR-2025-12-26-d0-4-forms-multifile-support.md
- docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md

## Context Highlights (source-backed)

- Legacy data volume estimate: 20M+ rows with ~1M/year growth; migration scope
  includes BCAR/BCSI historical datasets. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Migration strategy defines pre-migration inventory, field mapping, cleansing,
  validation, and rollback with phased cutover. (docs/sin-rfp/phase-0/migration-strategy.md)
- Batch import worker is designed for ECS Fargate with chunked processing,
  checkpoints, and error reports stored in S3. (docs/sin-rfp/phase-0/import-batch-worker.md)
- Decision: ECS Fargate is the import runtime for scale. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md)
- Import error retention policy sanitizes raw values on rollback while preserving
  metadata for audit. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-8-import-error-retention.md)
- Current verification notes show mapping templates, preview, and rollback flows
  exist but external API/DB imports are not implemented. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)

## Draft Bullets for final.md (notes only)

### Methodology (mapping, cleansing, validation, rollback)

- Run pre-migration inventory + data quality assessment, then produce field
  mapping documents and transformation rules. (docs/sin-rfp/phase-0/migration-strategy.md)
- Execute phased migration (org hierarchy, users, historical submissions,
  documents) using batch imports with checkpoints and error capture.
  (docs/sin-rfp/phase-0/migration-strategy.md)
- Use import mapping templates + preview confirmation before commit; normalize
  data types and enforce validation rules. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Rollback uses `import_job_id` tagging; legacy system stays read-only until
  reconciliation passes. (docs/sin-rfp/phase-0/migration-strategy.md)

### Audit Trail and Success Verification

- Import jobs, mapping template changes, and status updates are audit logged;
  error reports are written to S3 for review. (docs/sin-rfp/phase-0/import-batch-worker.md)
- Reconciliation uses row counts and checksum comparisons with signed-off
  validation before cutover. (docs/sin-rfp/phase-0/migration-strategy.md)
- Error retention sanitizes raw values post-rollback while preserving audit
  metadata. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-8-import-error-retention.md)

### Data Quality Targets and Defect Workflow

- Migration strategy defines null/duplicate checks, format normalization, and
  enum mapping rules to improve data quality. (docs/sin-rfp/phase-0/migration-strategy.md)
- Batch import produces row-level error reports for triage; retries capped with
  checkpointed resumes. (docs/sin-rfp/phase-0/import-batch-worker.md)
- Single-file import is enforced until multi-file support is delivered; flag
  any multi-file needs as a future enhancement. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-4-forms-multifile-support.md)
