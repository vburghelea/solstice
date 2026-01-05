# Update Notes

## Verified 2026-01-05

File field import pipeline verified via code review in `sin-dev`:

- ✅ `normalizeImportFileFields()` in `file-field-utils.ts` handles JSON payloads, signed URLs, storageKeys
- ✅ Validation errors: `invalid_file_payload`, `invalid_file_reference`, `missing_file_reference`
- ✅ `submission_files` table exists with FK to `form_submissions`
- ✅ `runBatchImportJob()` integrates file normalization + file record insertion
- ✅ ECS task deployed: `arn:aws:ecs:ca-central-1:891623777507:task-definition/solstice-sin-dev-SinImportClusterCluster-bbbcehhu-SinImportBatchTask:40`
- ✅ Import jobs table has records in various states (pending, validating, failed, completed, rolled_back)

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 15:59 PST

- File field imports now accept JSON payloads with fileName, mimeType,
  sizeBytes, and storageKey or signedUrl; the import runners validate file
  constraints, enforce storage key prefix, and persist submission file metadata.
  Evidence: `src/features/imports/imports.utils.ts`,
  `src/features/imports/imports.mutations.ts`, `src/lib/imports/batch-runner.ts`,
  `src/lib/imports/file-field-utils.ts`, `src/db/schema/forms.schema.ts`.
- Lane 2 worker entrypoint now calls the batch runner so async imports execute
  end-to-end and surface failures through `runBatchImportJob`. Evidence:
  `src/lib/imports/worker.ts`, `src/lib/imports/batch-runner.ts`.

## 2026-01-04 13:40 PST

- Import tooling only supports form-submission imports today; org/user/document
  migration pipelines are not implemented, and file fields are explicitly
  blocked during imports. Evidence: `src/db/schema/forms.schema.ts`,
  `src/features/imports/imports.utils.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`.
- Batch imports write error CSVs to the artifacts S3 bucket
  (`imports/<jobId>/errors.csv`), while interactive imports store row-level
  errors in `import_job_errors`; there is no dedicated "suggested resolution"
  field beyond the error message. Evidence: `src/lib/imports/batch-runner.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/db/schema/imports.schema.ts`.
- Rollback is job-wide only: it deletes all form submissions for the import job,
  sanitizes error raw values, and is time-bounded (default 7 days) with a
  `canRollback` flag; partial rollbacks by record type are not implemented.
  Evidence: `src/features/imports/imports.mutations.ts`,
  `src/db/schema/imports.schema.ts`.
- Batch execution uses the ECS task when `SinImportBatchTask` is available,
  otherwise it runs in-process; the task definition is 2 vCPU/4 GB/50 GB and
  uses the import-batch worker entrypoint. Evidence: `sst.config.ts`,
  `src/features/imports/imports.mutations.ts`,
  `src/workers/import-batch.ts`, `docker/import-batch.Dockerfile`.
- Mapping templates currently store header-to-field mappings only; transformation
  rules (enum remaps, phone/postal normalization) are not modeled beyond basic
  type parsing in the import utilities. Evidence:
  `src/db/schema/imports.schema.ts`, `src/features/imports/imports.utils.ts`.
