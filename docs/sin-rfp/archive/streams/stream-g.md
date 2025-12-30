# Worklog — Stream G - Audit log integrity and security events

## Instructions

- Use `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream G - Audit log integrity and security events) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [x] G1 Enforce audit log immutability at DB role level; add migration test or
      verification script.
- [x] G2 Use DB time for occurredAt and deterministic ordering (createdAt, id)
      for hash chain.
- [x] G3 Prevent chain forks with transaction + advisory lock (scope per D0.12).
- [x] G4 Include occurredAt and id in hash payload; generate id before hashing.
- [x] G5 Normalize actorIp parsing (x-forwarded-for, net.isIP) for audit and
      security logs.
- [x] G6 Replace shallow diff with deep diff (dotted paths) and sanitize nested
      PII; add tests.
- [x] G7 Sanitize audit metadata (redact token/secret/password/mfaSecret keys);
      remove double-sanitization.
- [x] G8 Fix audit date filtering (accept date-only or convert in UI).
- [x] G9 Move auth security events to server hooks; replace recordSecurityEvent
      with trusted-only handler and optional untrusted allowlist.
- [x] G10 Expand detection rules with risk scoring and anomaly events; decide
      lock vs flag (D0.11).
- [x] G11 listAccountLocks defaults to active only; add includeHistory flag and
      update UI.
- [x] G12 Add security table indexes for security_events and active
      account_locks.
- [x] G13 Align securityConfig.session with enforced policy or remove unused
      config; add X-Organization-Id to CORS allowlist if/when used.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

### 2025-12-27

- Audit hash chain uses a fixed advisory lock ID (42) since SIN/QC are separate
  databases; if multi-tenant DB ever consolidates, lock should be scoped per
  tenant key.
- Hash chain verification accepts legacy payloads (pre-id/occurredAt hashing) so
  historical audit rows do not invalidate the chain.
- Auth security events are now logged via Better Auth hooks; the `recordSecurityEvent`
  server fn is restricted to a trusted allowlist (currently `logout`) with an
  empty untrusted allowlist.

## Blockers

## Technical Debt / Follow-ups

- Audit immutability is enforced with trigger + `REVOKE` on `audit_logs` from
  `PUBLIC`. If the runtime DB user owns the table, UPDATE/DELETE privileges are
  still implicit; consider a dedicated app role + explicit grants/revokes to
  fully enforce role-level immutability.

## Files Modified This Session

- `docs/sin-rfp/archive/streams/stream-g-context.md`
- `docs/sin-rfp/archive/streams/stream-b-c-g-communication.md`
- `docs/sin-rfp/worklogs/master.md`
- `scripts/verify-audit-immutability.ts`
- `src/components/ui/admin-sidebar.tsx`
- `src/components/ui/app-sidebar.tsx`
- `src/db/migrations/0013_audit_security_hardening.sql`
- `src/db/migrations/meta/_journal.json`
- `src/db/schema/security.schema.ts`
- `src/features/audit/audit.queries.ts`
- `src/features/audit/audit.schemas.ts`
- `src/features/auth/__tests__/login-with-router.test.tsx`
- `src/features/auth/__tests__/login.test.tsx`
- `src/features/auth/components/login.tsx`
- `src/features/security/components/security-dashboard.tsx`
- `src/features/security/security.mutations.ts`
- `src/features/security/security.queries.ts`
- `src/features/security/security.schemas.ts`
- `src/lib/audit/__tests__/audit-utils.test.ts`
- `src/lib/audit/index.ts`
- `src/lib/auth/server-helpers.ts`
- `src/lib/security/config.ts`
- `src/lib/security/detection.ts`
- `src/lib/security/events.ts`

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27: Context capture

- Captured Stream G implementation context in
  `docs/sin-rfp/archive/streams/stream-g-context.md` (audit integrity + security
  events). No need to re-open the implementation review docs unless new
  questions emerge.

### 2025-12-27: Audit integrity + security events hardening

- Added advisory-lock transaction with DB-time occurredAt, deterministic
  createdAt+id ordering, and id/occurredAt hash payload; verification supports
  legacy hashes.
- Implemented deep audit diffs with dotted paths, metadata sanitization, and
  unit tests for nested PII redaction/hashing.
- Normalized actor IP parsing (x-forwarded-for/x-real-ip + net.isIP) for audit
  logs and security events.
- Added Better Auth hook plugin to log auth security events server-side and
  removed client-side recordSecurityEvent calls.
- Expanded detection thresholds with flag-first policy, login anomaly scoring,
  and account flag/lock events per D0.11.
- Added include-history toggle for account locks (default active only) and
  indexed security events/locks via migration.
- Updated security config session values to match enforced policy and added
  X-Organization-Id to CORS allowlist.
- Ran `pnpm lint`, `pnpm check-types`, and
  `pnpm test src/lib/audit/__tests__/audit-utils.test.ts` (all passing).

### 2025-12-27 12:53 - All type errors resolved

- Fixed remaining type errors:
  - `src/db/schema/security.schema.ts`: Fixed `sql` import (from `drizzle-orm`)
  - `src/lib/audit/index.ts:292`: Fixed Date constructor type
  - `src/lib/audit/__tests__/audit-utils.test.ts`: Fixed index signature access
  - `src/lib/auth/server-helpers.ts`: Fixed exactOptionalPropertyTypes issues
  - `src/lib/security/detection.ts`: Fixed type compatibility
  - `src/components/ui/logo.tsx`: Fixed lint warning
- `pnpm lint` and `pnpm check-types` now pass cleanly.
- All 260 tests pass.
