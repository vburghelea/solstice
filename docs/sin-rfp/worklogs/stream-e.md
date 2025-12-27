# Worklog — Stream E - Imports hardening

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream E - Imports hardening) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] E1 Validate job/form/org alignment in runInteractiveImport.
- [ ] E2 Verify source file hash server-side; parse file server-side and ignore
      client rows for persistence.
- [ ] E3 Normalize row parsing (reject NaN, trim multiselect values) in
      interactive and batch imports.
- [ ] E4 Block file-field imports until an ingestion pipeline exists; add
      UI/server guard.
- [ ] E5 Track failedRows separately from errorCount.
- [ ] E6 Add audit logging for mapping template CRUD and updateImportJobStatus.
- [ ] E7 Run rollback in a transaction and align error retention with D0.8.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
