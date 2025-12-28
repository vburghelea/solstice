# Worklog — Stream H - Privacy, DSAR, and retention

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream H - Privacy, DSAR, and retention) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [x] H1 Enforce admin + step-up for privacy admin mutations and DSAR actions.
- [x] H2 Gate getLatestPolicyDocument to published and effective policies only.
- [x] H3 Enforce DSAR request type/status transitions for export and erasure.
- [x] H4 Redact secrets from DSAR exports; use explicit DTOs for auth tables.
- [x] H5 Harden DSAR export storage: SSE-KMS, tags/metadata for retention;
      consider object lock policy.
- [x] H6 Gate DSAR download to completed status; audit download events; step-up
      for admins accessing others.
- [x] H7 Erasure cleanup: delete DSAR export objects and notification
      preferences; handle partial deletes.
- [x] H8 Implement correction workflow (details capture, admin apply, audit
      diffs).
- [x] H9 Expand retention to DSAR exports and audit log archival
      (Glacier/Object Lock); add observability.
- [x] H10 Add legal holds model and enforcement.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

- Adopted D0.13 14-day DSAR export retention with `resultExpiresAt`, S3 tags,
  and metadata for export lifecycle.

## Blockers

- `pnpm lint` fails due to unused `_userId` in
  `src/features/organizations/__tests__/organizations.access.pbt.test.ts`.
- `pnpm check-types` fails due to pre-existing type errors in forms/imports/
  reporting/reports/audit test files (see session log for list).

## Files Modified This Session

- `src/db/schema/privacy.schema.ts`
- `src/db/schema/audit.schema.ts`
- `src/db/migrations/0014_privacy_dsar_retention_legal_holds.sql`
- `src/db/migrations/0015_audit_log_archives.sql`
- `src/features/privacy/privacy.schemas.ts`
- `src/features/privacy/privacy.mutations.ts`
- `src/features/privacy/privacy.queries.ts`
- `src/features/privacy/components/privacy-dashboard.tsx`
- `src/features/privacy/components/privacy-admin-panel.tsx`
- `src/features/privacy/components/legal-hold-panel.tsx`
- `src/routes/dashboard/admin/sin/privacy.tsx`
- `src/lib/privacy/retention.ts`
- `src/lib/env.server.ts`
- `docs/sin-rfp/worklogs/stream-h-context.md`

## Technical Debt / Follow-ups

- S3 Object Lock policies for DSAR exports and audit archives require infra
  changes in `sst.config.ts` (bucket creation is not yet configured for object
  lock/WORM).
- DSAR export retention enforcement depends on adding a `retention_policies`
  row for data type `dsar_exports` (or equivalent) in each environment.
- Audit archives are stored in the artifacts bucket with `DEEP_ARCHIVE` storage
  class; confirm bucket lifecycle/Object Lock in infra for compliance.

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27: Stream H implementation in progress

- Added DSAR context summary in `docs/sin-rfp/worklogs/stream-h-context.md`.
- Added DSAR export expiry tracking, legal holds model, and audit archive schema
  - migrations.
- Hardened privacy/DSAR server functions (step-up, request gating, export
  redaction, SSE-KMS tags, DSAR export cleanup).
- Expanded retention job for DSAR export cleanup, audit log archiving, and legal
  hold filtering with observability.
- Updated privacy UI for correction details, admin correction apply flow, and
  legal hold management panel.
- Ran `pnpm lint` and `pnpm check-types`; both fail on pre-existing issues
  outside Stream H scope (org test unused var, forms/imports/reporting types).
