# Stream E Context (Imports hardening)

Purpose: consolidate Stream E background so I do not need to re-open
implementation and decision docs while working the backlog.

## Source docs consulted

- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/5.2-pro-review-output/3-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`

## Stream E backlog items

- E1 Validate job/form/org alignment in `runInteractiveImport`.
- E2 Verify source file hash server-side; parse file server-side and ignore
  client rows for persistence.
- E3 Normalize row parsing (reject NaN, trim multiselect values) in
  interactive and batch imports.
- E4 Block file-field imports until an ingestion pipeline exists; add
  UI/server guard.
- E5 Track failedRows separately from errorCount.
- E6 Add audit logging for mapping template CRUD and `updateImportJobStatus`.
- E7 Run rollback in a transaction and align error retention with D0.8.

## D0 decisions that affect Stream E

- D0.8 (Import rollback error retention): sanitize and keep import errors on
  rollback by nulling raw values, preserving row/field metadata.

## Implementation notes (3-implementation)

- `runInteractiveImport` currently trusts client rows, ignores file hash, and
  does not validate job/form alignment.
- Server-side parsing should re-use `streamToBuffer`/parsing logic from
  `src/lib/imports/batch-runner.ts`.
- Mapping to file fields is unsupported; block in UI and server until a
  controlled ingestion pipeline exists.
- Row parsing should reject NaN, and multiselect values should be trimmed and
  empty values removed.
- Import stats should include `failedRows` distinct from `errorCount`.
- Add audit logs for mapping template create/update/delete and import status
  updates.
- Rollback should run in a transaction and sanitize `import_job_errors` per D0.8.
- Primary files: `src/features/imports/imports.mutations.ts`,
  `src/lib/imports/batch-runner.ts`,
  `src/features/imports/components/import-wizard-shell.tsx`.
