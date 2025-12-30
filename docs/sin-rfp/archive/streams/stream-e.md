# Worklog — Stream E - Imports hardening

## Instructions

- Use `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream E - Imports hardening) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [x] E1 Validate job/form/org alignment in runInteractiveImport.
- [x] E2 Verify source file hash server-side; parse file server-side and ignore
      client rows for persistence.
- [x] E3 Normalize row parsing (reject NaN, trim multiselect values) in
      interactive and batch imports.
- [x] E4 Block file-field imports until an ingestion pipeline exists; add
      UI/server guard.
- [x] E5 Track failedRows separately from errorCount.
- [x] E6 Add audit logging for mapping template CRUD and updateImportJobStatus.
- [x] E7 Run rollback in a transaction and align error retention with D0.8.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

- D0.8 applied: sanitize `import_job_errors.rawValue` during rollback and keep
  metadata in place for audit/debugging.

## Blockers

## Files Modified This Session

- `docs/sin-rfp/archive/streams/stream-e-context.md`
- `src/lib/imports/file-utils.ts`
- `src/features/imports/imports.utils.ts`
- `src/lib/imports/batch-runner.ts`
- `src/features/imports/imports.mutations.ts`
- `src/features/imports/components/import-wizard-shell.tsx`

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27: Stream E implementation underway

- Added Stream E context summary (`docs/sin-rfp/archive/streams/stream-e-context.md`).
- Hardened interactive + batch imports: server-side file hash verification and
  parsing, normalized row parsing (NaN + multiselect trimming), file field
  guards, failedRows tracking.
- Added audit logs for mapping template CRUD + import status updates.
- Rollback now runs in a transaction and sanitizes `import_job_errors` raw
  values per D0.8.
- UI: mapping options now exclude file fields; run buttons disabled with
  explicit warnings when file field mappings are present.
- `pnpm lint` failed on pre-existing unused vars in `src/features/forms/forms.queries.ts`
  and `src/features/privacy/privacy.mutations.ts` plus deprecation warnings in
  forms/privacy schemas.
- `pnpm check-types` failed on pre-existing privacy/reporting/notification
  type errors (see command output in session notes).
- UI verification skipped: `curl http://localhost:5173/api/health` failed
  (dev server not running; instructed not to restart it).
