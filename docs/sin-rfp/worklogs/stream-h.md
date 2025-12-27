# Worklog — Stream H - Privacy, DSAR, and retention

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream H - Privacy, DSAR, and retention) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] H1 Enforce admin + step-up for privacy admin mutations and DSAR actions.
- [ ] H2 Gate getLatestPolicyDocument to published and effective policies only.
- [ ] H3 Enforce DSAR request type/status transitions for export and erasure.
- [ ] H4 Redact secrets from DSAR exports; use explicit DTOs for auth tables.
- [ ] H5 Harden DSAR export storage: SSE-KMS, tags/metadata for retention;
      consider object lock policy.
- [ ] H6 Gate DSAR download to completed status; audit download events; step-up
      for admins accessing others.
- [ ] H7 Erasure cleanup: delete DSAR export objects and notification
      preferences; handle partial deletes.
- [ ] H8 Implement correction workflow (details capture, admin apply, audit
      diffs).
- [ ] H9 Expand retention to DSAR exports and audit log archival
      (Glacier/Object Lock); add observability.
- [ ] H10 Add legal holds model and enforcement.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
