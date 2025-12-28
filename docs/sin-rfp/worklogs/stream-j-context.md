# Stream J Context Summary (Tests, verification, E2E coverage)

## Sources consulted

- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream J tasks)
- `docs/sin-rfp/5.2-pro-review-output/6-implementation.md` (test gaps + E2E coverage)
- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md` (scoping decisions)
- `docs/sin-rfp/property-based-testing-plan.md` (PBT priorities)
- `docs/sin-rfp/worklogs/master.md` (completed streams and MFA test data)

## Stream J scope reminders

- J1: Unit tests for form validation, import parsing, audit diff/metadata sanitization,
  step-up guards.
- J2: Integration tests for report scoping/export redaction, reporting submission
  linking, privacy request gating.
- J3: E2E tests for MFA/step-up, admin gating, org selection flow, critical exports.
- J4: Run `pnpm lint`, `pnpm check-types`, and relevant `pnpm test` suites.

## Implementation review highlights (6-implementation.md)

- Step-up enforcement exists but has boundary issues; tests should cover missing
  timestamps and MFA verification edge cases (`src/lib/auth/guards/step-up.ts`).
- MFA enforcement for admins is inconsistent across routes; E2E should validate
  admin gating and MFA-required flows.
- E2E coverage currently limited to tenant gating + basic admin access; Stream J
  must add MFA/step-up, org selection, and export coverage.

## D0 decisions that drive test coverage

- D0.1 (saved reports scoping): null-org reports are personal only; org-wide
  scoped to org access. Tests should validate report scoping + export gating.
- D0.2 (reporting submission visibility): admin-only by default; submissions
  linked to reporting tasks and form submissions.
- D0.12 (audit hash chain): verification should fail on tampering; add property
  tests around chain integrity.

## Property-based testing priorities (property-based-testing-plan.md)

- Org access control: `src/features/organizations/organizations.access.ts` and
  `src/lib/auth/guards/org-context.ts`.
- Audit hash chain integrity: `src/lib/audit/index.ts` (hashes + sanitize helpers).
- Step-up auth windows: `src/lib/auth/guards/step-up.ts`.
- Client permission helpers: `src/features/roles/permission.service.ts`.

## MFA test data (master.md)

- Fake MFA secret: `JBSWY3DPEHPK3PXP`.
- Backup codes: `backup-testcode1` → `backup-testcode10` (track usage in master).
- Test admins: `admin@example.com`, `viasport-staff@example.com`.
