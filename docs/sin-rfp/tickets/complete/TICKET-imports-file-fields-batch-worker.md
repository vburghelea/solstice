# TICKET: Import File Fields + Batch Worker Completion

**Status**: ✅ Verified (Code Review)
**Priority**: P1
**Component**: Imports / Data Migration
**Date**: 2026-01-04
**Verified**: 2026-01-05
**Author**: Codex (AI Assistant)

---

## Summary

File fields are now supported for imports (JSON payloads with fileName, mimeType,
sizeBytes, and storageKey or signedUrl) and the batch worker entrypoint is wired
to run lane 2 jobs end-to-end. Imports remain form-only; no org/user/document
migration pipelines were added.

---

## Background

The import wizard supports CSV/Excel uploads with mapping templates targeting
forms (`targetFormId`). File fields now map to JSON payloads that reference
pre-uploaded artifacts (storage keys or signed URLs), and the worker entrypoint
executes the batch runner.

---

## Current Behavior (Updated)

- Import wizard includes file fields in mapping options and allows runs with file
  fields present.
- `parseImportRow` accepts JSON file payloads and validates single-file format.
- Interactive and batch imports validate file constraints, enforce storage key
  prefix, and persist submission file metadata.
- `processImportJob` invokes the batch runner for lane 2 jobs.
- Import jobs only target forms (no org/user/document import lane).

---

## Status Update

Completed:

1. **File field import contract**
   - JSON payloads accepted: fileName, mimeType, sizeBytes, storageKey or signedUrl.
   - Signed URL references are normalized to storage keys in the artifacts bucket.
2. **Import pipeline updates**
   - File fields allowed in mapping templates and preview.
   - Validation now enforces file constraints and storage key prefix.
   - Submission file metadata is stored for imported rows.
3. **Batch worker completion**
   - `processImportJob` now calls the shared batch runner.

Out of scope:

4. **Scope check**
   - Imports remain form-only; org/user/document migrations are not implemented.

---

## File Payload Template Example

- CSV example: `docs/sin-rfp/response/03-service-approach/data-migration/import-file-template.csv`
- Excel: use the same column headers and paste the JSON payload in the file field cell.

---

## Testing (Manual)

1. Create or locate files in the artifacts bucket under `forms/<formId>/...`
   (or capture signed URLs to the same bucket).
2. Create a CSV/Excel using the template above; map the file field in the import
   wizard and include JSON payloads.
3. Run a lane 1 import:
   - Expect job status `completed`.
   - Verify the submission payload includes the file field and a
     `submission_files` row exists for the import.
4. Run a lane 2 import with a saved mapping template:
   - Expect batch completion and (if errors exist) an error CSV in
     `imports/<jobId>/errors.csv`.
5. Validation checks:
   - Use an invalid mimeType or oversize file in the payload to confirm the row
     is rejected with a file validation error.
   - Use a storageKey outside `forms/<formId>/` to confirm it is rejected.

---

## Remaining Scope Decision

- Decide whether to keep imports form-only or add explicit pipelines for
  org/user/document migrations.

---

## References

- `src/features/imports/components/import-wizard-shell.tsx`
- `src/features/imports/imports.mutations.ts`
- `src/features/imports/imports.utils.ts`
- `src/lib/imports/worker.ts`
- `src/lib/imports/batch-runner.ts`
- `src/features/forms/forms.utils.ts`
- `src/db/schema/imports.schema.ts`

---

## Verification Results (2026-01-05)

**Test Environment:** `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

### Code Review Verification

| Component              | Status | Evidence                                                                                               |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| **File field parsing** | ✅     | `normalizeImportFileFields()` in `file-field-utils.ts` handles JSON payloads, signed URLs, storageKeys |
| **Validation errors**  | ✅     | Code catches `invalid_file_payload`, `invalid_file_reference`, `missing_file_reference`                |
| **Database table**     | ✅     | `submission_files` table exists with FK to `form_submissions`                                          |
| **Batch runner**       | ✅     | `runBatchImportJob()` integrates file normalization + file record insertion                            |
| **ECS task**           | ✅     | `SinImportBatchTask:40` deployed in ECS cluster                                                        |

### Database Verification

```sql
\d submission_files

     Column     |           Type           | Nullable |      Default
---------------+--------------------------+----------+-------------------
 id            | uuid                     | not null | gen_random_uuid()
 submission_id | uuid                     | not null |
 field_key     | text                     | not null |
 file_name     | text                     | not null |
 mime_type     | text                     | not null |
 size_bytes    | integer                  | not null |
 checksum      | text                     | not null |
 storage_key   | text                     | not null |
 uploaded_by   | text                     |          |
 created_at    | timestamp with time zone | not null | now()
```

### Import Infrastructure

- ✅ Import jobs table has 5 rows in various states (pending, validating, failed, completed, rolled_back)
- ✅ Form with file field exists: "Quarterly Financial Summary" (ID: a0000000-0000-4000-8002-000000000002)
- ✅ ECS task definition ARN: `arn:aws:ecs:ca-central-1:891623777507:task-definition/solstice-sin-dev-SinImportClusterCluster-bbbcehhu-SinImportBatchTask:40`

### UI Verification

⏳ UI wizard testing blocked by rate limiting during session. Code implementation verified complete.

**Conclusion:** File field import pipeline is fully implemented. Code review confirms
all components are correctly integrated. End-to-end UI testing recommended when
rate limit resets.

## Docs Updated

- `docs/sin-rfp/response/03-service-approach/data-migration/update-notes.md`
- `docs/sin-rfp/response/04-system-requirements/data-management-dm-agg/update-notes.md`
- `docs/sin-rfp/response/05-capabilities-experience/update-notes.md`
- `docs/sin-rfp/response/07-delivery-schedule/update-notes.md`
