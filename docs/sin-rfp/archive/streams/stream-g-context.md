# Stream G Context Summary (Audit log integrity + security events)

## Sources consulted

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream G tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/4b-implementation.md` (audit log integrity)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/4-implementation.md` (security events)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-12-audit-hash-chain-scope.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-11-security-anomaly-thresholds.md`

## D0 decisions applied

- D0.12 (ADR-2025-12-26-d0-12-audit-hash-chain-scope): use **per-tenant** audit
  hash chain with **advisory locking** to prevent forks. Since QC/SIN are
  separate DBs today, per-tenant is already effective; lock is the critical fix.
- D0.11 (ADR-2025-12-26-d0-11-security-anomaly-thresholds): **flag-first**
  detection thresholds with escalation to lock for higher severity.

## Audit log integrity (4b-implementation, Track A)

- **G1 immutability**: trigger exists (`src/db/migrations/0010_audit_immutable.sql`)
  to block UPDATE/DELETE, but no DB role grants/revocations and schema does not
  encode immutability. Add role restrictions and verify with migration test or
  script that UPDATE/DELETE fails for app role.
- **G2 ordering/timestamps**: `logAuditEntry` selects previous hash by
  `orderBy(desc(auditLogs.occurredAt))` and writes `occurredAt: new Date()`.
  Verification orders by `occurredAt`. Need DB time for occurredAt and
  deterministic ordering by (createdAt, id) for prev hash selection + verify.
- **G3 concurrency**: `logAuditEntry` reads latest hash and inserts without a
  transaction/lock. Must use transaction + `pg_advisory_xact_lock` to prevent
  forked chains (per D0.12).
- **G4 hash payload**: `entryHash` excludes timestamps and id. Include
  `occurredAt` and `id` in payload; generate id before hashing.
- **G5 actor IP**: `resolveRequestContext` uses raw `x-forwarded-for` without
  parsing/validation; inet column can be invalid. Normalize (split, trim,
  `net.isIP`), fallback to `x-real-ip` or null. Apply same normalization to
  security logs in `src/lib/security/events.ts`.
- **G6 deep diff**: `createAuditDiff` only diffs top-level keys and doesn’t emit
  dotted paths. Replace with deep diff, sanitize nested PII, add tests.
- **G7 metadata sanitize**: `logAuditEntry` stores metadata without sanitizing.
  Add `sanitizeMetadata` to redact token/secret/password/mfaSecret keys, apply
  before hashing/storing. Remove double-sanitization (currently sanitize in
  `createAuditDiff` and again in `logAuditEntry`).
- **G8 date filtering**: `listAuditLogsSchema` expects `z.iso.datetime()`, but UI
  uses `<Input type="date">` (YYYY-MM-DD). Fix by accepting date-only strings
  or converting in UI.

## Security events (4-implementation, Track A/D/E/F)

- **G9 server-side auth hooks**: `recordSecurityEvent` is unauthenticated and
  can be abused to poison logs/lockouts. Move auth-related event creation to
  server hooks (Better Auth) and replace `recordSecurityEvent` with a trusted
  handler that requires auth and never accepts `userId` from client. If
  unauthenticated reporting is needed, create a separate, strict allowlist entry
  point that never triggers lockouts.
- **G10 anomaly detection**: Current detection is simple thresholds (5 login
  fails -> 30m lock). D0.11 recommends flag-first thresholds with escalation:
  - login fail: flag 3/15m, lock 5/15m
  - MFA fail: flag 2/5m, lock 3/5m
  - new geo/device: flag + step-up, lock only after additional failure
  - impossible travel: flag only (no lock)
    Expand detection to log riskScore/riskFactors and emit `login_anomaly` /
    `account_flagged` events; decide lock vs flag per D0.11.
- **G11 listAccountLocks**: `listAccountLocks` returns all locks, but UI expects
  only active locks. Add includeHistory flag; default to active-only filter
  (unlockedAt null and unlockAt in future) and update UI toggle.
- **G12 indexes**: `security_events` and `account_locks` lack indexes. Add:
  - `security_events(user_id, created_at desc)`
  - `security_events(ip_address, created_at desc)`
  - `account_locks(user_id) WHERE unlocked_at IS NULL`
- **G13 config alignment**: `securityConfig.session` says 30 days but enforced
  session policy is elsewhere (8h). Either remove unused config or align it with
  enforced policy. CORS allowlist currently omits `X-Organization-Id`; add if/when
  CORS middleware is implemented.

## Implementation notes from D0 analysis

- Audit hash chain fixes should use transaction + advisory lock and deterministic
  ordering on `occurredAt + id`. For current separate DBs, a fixed lock id is ok.
- If future multi-tenant single DB: scope lock id by tenant key.
