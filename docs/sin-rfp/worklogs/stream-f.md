# Worklog — Stream F - Reporting and report correctness

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream F - Reporting and report correctness) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] F1 Resolve reporting status enum mismatch (add or remove "rejected").
- [ ] F2 Validate formSubmissionId and formSubmissionVersionId belong to
      task/form/org.
- [ ] F3 Clear stale review/submission metadata when status changes.
- [ ] F4 Sanitize reminder schedule (unique positive integers, bounded).
- [ ] F5 Apply filters, columns, and sort server-side using an allowlist;
      ensure audit filtersUsed matches applied filters.
- [ ] F6 Implement real export formats: XLSX via xlsx, PDF only if supported;
      update UI to match.
- [ ] F7 Redact nested form payload fields using per-field PII flags; update
      schemas and UI.
- [ ] F8 Tighten PII policy to require explicit pii.read permission (remove
      implicit admin access).

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
