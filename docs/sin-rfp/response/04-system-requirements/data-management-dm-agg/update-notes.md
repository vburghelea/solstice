# Update Notes - Data Management (DM-AGG)

## Verified 2026-01-05

DM-AGG features implemented on 2026-01-04 verified in `sin-dev`:

- ✅ **DM-AGG-004**: Data quality alerting with threshold evaluation and change-only admin notifications
- ✅ **DM-AGG-001/006**: File field import pipeline complete:
  - `normalizeImportFileFields()` handles JSON payloads, signed URLs, storageKeys
  - Validation catches `invalid_file_payload`, `invalid_file_reference`, `missing_file_reference`
  - `submission_files` table confirmed with FK to `form_submissions`
  - `runBatchImportJob()` integrates file normalization + file record insertion
- ✅ **DM-AGG-006**: Batch worker entrypoint verified (ECS task ARN confirmed deployed)

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:25 PST

- DM-AGG-004: Data quality monitoring now evaluates alert thresholds (global defaults
  with optional org overrides via organization settings) and sends change-only
  notifications to global admins with a dashboard link. Evidence:
  `src/features/data-quality/data-quality.monitor.ts`,
  `src/features/data-quality/data-quality.alerts.ts`,
  `src/lib/notifications/queue.ts`.

## 2026-01-04 15:59 PST

- DM-AGG-001/006: File-field mappings are now supported; imports accept JSON file
  payloads (fileName, mimeType, sizeBytes, storageKey/signedUrl), validate file
  constraints, and persist submission file metadata (single-file only). Evidence:
  `src/features/imports/components/import-wizard-shell.tsx`,
  `src/features/imports/imports.utils.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`,
  `src/lib/imports/file-field-utils.ts`.
- DM-AGG-006: The batch worker entrypoint now calls the shared batch runner,
  removing the stubbed path for lane 2 imports. Evidence:
  `src/lib/imports/worker.ts`, `src/workers/import-batch.ts`.

## 2026-01-04 13:45 PST

- DM-AGG-001: Submission history is visible, but there is no restore/revert action or
  changed-by display in the UI; history is view-only today. Evidence:
  `src/features/forms/components/form-builder-shell.tsx`,
  `src/features/forms/forms.mutations.ts`.
- DM-AGG-001/006: Import wizard blocks file-field mappings, so historical file
  attachments cannot be migrated yet. Evidence:
  `src/features/imports/components/import-wizard-shell.tsx`,
  `src/features/imports/imports.utils.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`.
- DM-AGG-002: Import parsing normalizes numbers/booleans and trims strings, but does not
  standardize phone/postal formats or parse dates beyond raw strings. Evidence:
  `src/features/imports/imports.utils.ts`.
- DM-AGG-002: Transformation logging is limited to import job audit entries; there is no
  row-level transformation log or before/after capture for imports. Evidence:
  `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`,
  `src/lib/audit/index.ts`.
- DM-AGG-003: Data catalog indexing covers forms, import templates, saved reports, and
  templates; it does not catalog submissions. Evidence:
  `src/features/data-catalog/data-catalog.service.ts`,
  `src/features/data-catalog/data-catalog.queries.ts`.
- DM-AGG-003: SQL Workbench is gated and disabled by default pending prerequisite
  sign-off. Evidence: `src/features/bi/docs/CHECKLIST-sql-workbench-gate.md`.
- DM-AGG-004: Data quality checks run on schedule and can be triggered manually, but no
  automated alerting/notification thresholds are implemented. Evidence:
  `src/cron/data-quality-monitor.ts`,
  `src/features/data-quality/data-quality.monitor.ts`,
  `src/features/data-quality/components/data-quality-dashboard.tsx`.
- DM-AGG-005: Retention enforcement cron exists and archives audit logs to Deep Archive
  based on policies, while bucket lifecycle rules target Glacier and the retention
  policy doc still marks Object Lock/Glacier automation as pending. Evidence:
  `src/cron/enforce-retention.ts`,
  `src/lib/privacy/retention.ts`,
  `sst.config.ts`,
  `docs/sin-rfp/phase-0/audit-retention-policy.md`.
- DM-AGG-005: DR restore evidence is from sin-dev only; production drill evidence and
  quarterly cadence are not documented yet. Evidence:
  `docs/sin-rfp/review-plans/backup-restore-test-results.md`,
  `docs/sin-rfp/phase-0/backup-dr-plan.md`.
- DM-AGG-006: Batch import worker is defined in infrastructure and code, but deployment
  verification remains marked pending in docs. Evidence:
  `sst.config.ts`,
  `src/workers/import-batch.ts`,
  `docs/sin-rfp/phase-0/import-batch-worker.md`.
