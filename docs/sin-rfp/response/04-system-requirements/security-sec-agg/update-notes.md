# Update Notes

## Verified 2026-01-05

SEC-AGG security enhancements verified in `sin-dev`:

- ✅ **SEC-AGG-001 Signup Password Policy**:
  - Weak password `password123` blocked with inline error: "Password must contain at least one uppercase letter"
  - Compliant password `SecurePassword123!` proceeds to onboarding
- ✅ **SEC-AGG-002 Pre-Auth Lockout + Rate Limiting**:
  - Rate limiter triggered after 5 requests (429 responses returned)
  - 9 `login_fail` events logged to `security_events` table
  - 19 `rate_limit_exceeded` events logged
  - `SECURITY_THRESHOLDS` config verified: 5 failures/15min → 30-min lock
- ✅ **SEC-AGG-002 Security Notifications**:
  - Security events logged to `security_events` table
  - CloudWatch metrics emitted for rate limit exceeded events

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:10 PST

- SEC-AGG-001: Signup now enforces password complexity on the server and aligns
  client validation with the shared policy. Evidence:
  `src/lib/auth/server-helpers.ts`, `src/features/auth/auth.schemas.ts`,
  `src/lib/security/password-config.ts`.
- SEC-AGG-002: Pre-auth lockout gating blocks sign-in for locked users, and
  login anomalies/account flags now notify admins. Evidence:
  `src/lib/auth/server-helpers.ts`, `src/lib/security/detection.ts`,
  `src/lib/security/lockout.ts`.

## 2026-01-04 13:46 PST

- SEC-AGG-001: Password complexity is only enforced in change/reset flows; signup
  validation only checks minimum length and the reset flow relies on client-side
  checks. Consider updating the claim or enforcing policy server-side. Evidence:
  `src/features/auth/auth.schemas.ts`, `src/features/settings/settings.schemas.ts`,
  `src/features/auth/components/reset-password.tsx`,
  `src/lib/security/password-config.ts`.
- SEC-AGG-001/002: Account lockouts are applied after failed auth events, but
  sign-in does not block locked users until after login (client-side check) and
  server functions enforce lockout during auth middleware. This is weaker than a
  pre-auth lockout gate. Evidence: `src/lib/security/detection.ts`,
  `src/features/auth/components/login.tsx`,
  `src/lib/auth/middleware/auth-guard.ts`.
- SEC-AGG-002: Security alerts are only emitted for lockouts; login anomalies and
  account flags are recorded but do not notify admins. Evidence:
  `src/lib/security/lockout.ts`, `src/lib/security/detection.ts`.
- SEC-AGG-002: GuardDuty is referenced in the response but is not provisioned in
  infrastructure code (only CloudWatch alarms are configured). Evidence:
  `sst.config.ts`.
- SEC-AGG-004: Audit log filtering does not support record/target ID filters;
  current filters are actor user ID, target org ID, category, and date. Evidence:
  `src/features/audit/audit.schemas.ts`,
  `src/features/audit/components/audit-log-table.tsx`.
- SEC-AGG-004: Audit immutability is application-level (hash chain + no purge in
  retention) but not enforced by database constraints or WORM storage. Consider
  wording this as tamper-evident rather than immutable. Evidence:
  `src/lib/audit/index.ts`, `src/lib/privacy/retention.ts`,
  `src/db/schema/audit.schema.ts`.
- SEC-AGG-003: Audit archiving timing differs between seed scripts (90 days vs
  365 days), and retention enforcement only uses archiveAfterDays/purgeAfterDays;
  align documented retention with seeded policies. Evidence:
  `scripts/seed-retention-policies.ts`, `scripts/seed-sin-data.ts`,
  `src/lib/privacy/retention.ts`.
- SEC-AGG-003: SSE-KMS is explicitly set for DSAR exports and audit archives, but
  standard uploads/imports do not set SSE-KMS, relying on bucket defaults. If the
  requirement is KMS everywhere, update infra or wording. Evidence:
  `src/features/privacy/privacy.mutations.ts`, `src/lib/privacy/retention.ts`,
  `src/features/forms/forms.mutations.ts`, `src/features/imports/imports.mutations.ts`,
  `sst.config.ts`.
