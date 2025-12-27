# Worklog — Stream G - Audit log integrity and security events

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream G - Audit log integrity and security events) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] G1 Enforce audit log immutability at DB role level; add migration test or
      verification script.
- [ ] G2 Use DB time for occurredAt and deterministic ordering (createdAt, id)
      for hash chain.
- [ ] G3 Prevent chain forks with transaction + advisory lock (scope per D0.12).
- [ ] G4 Include occurredAt and id in hash payload; generate id before hashing.
- [ ] G5 Normalize actorIp parsing (x-forwarded-for, net.isIP) for audit and
      security logs.
- [ ] G6 Replace shallow diff with deep diff (dotted paths) and sanitize nested
      PII; add tests.
- [ ] G7 Sanitize audit metadata (redact token/secret/password/mfaSecret keys);
      remove double-sanitization.
- [ ] G8 Fix audit date filtering (accept date-only or convert in UI).
- [ ] G9 Move auth security events to server hooks; replace recordSecurityEvent
      with trusted-only handler and optional untrusted allowlist.
- [ ] G10 Expand detection rules with risk scoring and anomaly events; decide
      lock vs flag (D0.11).
- [ ] G11 listAccountLocks defaults to active only; add includeHistory flag and
      update UI.
- [ ] G12 Add security table indexes for security_events and active
      account_locks.
- [ ] G13 Align securityConfig.session with enforced policy or remove unused
      config; add X-Organization-Id to CORS allowlist if/when used.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
