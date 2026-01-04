# State of Security Review - Solstice (SIN RFP)

## Document Control

| Item     | Value                                              |
| -------- | -------------------------------------------------- |
| Document | State of Security Review                           |
| Date     | 2026-01-03                                         |
| Scope    | SIN platform security posture (code/config review) |
| Reviewer | Codex (synthesized from security feedback)         |
| Status   | Draft                                              |

## Executive Summary

- MFA, session controls, RBAC, audit logging, and anomaly detection are in place
  based on code inspection.
- Secrets are validated at startup; auth cookies use secure defaults with
  domain restrictions supported.
- Operational evidence for server-side rate limiting, CI security scanning, and
  request size limits remains to be verified.

**Methodology:** Repository review only (no penetration testing or production
validation in this pass).

## 1. Authentication & Session Management

**Q: How are user sessions managed? What is the session lifetime and idle timeout?**

**A:**

- Better Auth uses DB-backed sessions (Drizzle adapter) for server-side
  invalidation.
- Session lifetime: 8 hours with a 30-minute update window.
- Idle timeout: 30 minutes, enforced in auth middleware.
- Admin sessions expire after 4 hours, forcing re-authentication.

**Evidence:** `src/lib/auth/server-helpers.ts`,
`src/lib/auth/middleware/auth-guard.ts`

**Q: How are cookies secured?**

**A:**

- HttpOnly, SameSite "lax", and Secure flags are set for auth cookies.
- Optional `COOKIE_DOMAIN` restricts cookie scope.
- Secure cookies are enforced when base URL is HTTPS.

**Evidence:** `src/lib/auth/server-helpers.ts`,
`src/lib/security/config.ts`

**Q: Is MFA supported? How?**

**A:**

- Better Auth two-factor plugin supports TOTP + backup codes.
- Admin access enforces MFA enrollment (server-side and route guards).
- Step-up authentication required for sensitive operations with a 15-minute
  re-auth window.
- MFA failure lockout: 3 failures in 5 minutes, 15-minute lockout duration.

**Evidence:** `src/lib/auth/server-helpers.ts`,
`src/lib/auth/utils/admin-check.ts`,
`src/lib/auth/middleware/role-guard.ts`,
`src/lib/auth/guards/step-up.ts`,
`src/lib/security/config.ts`,
`src/lib/security/detection.ts`

---

## 2. Authorization

**Q: How is RBAC implemented?**

**A:**

- Route guards: `requireAuth`, `requireRole`, `requireAuthAndProfile`.
- Organization guard validates role membership (owner/admin/reporter/viewer).
- Admin checks are tenant-aware and enforced server-side.

**Evidence:** `src/lib/auth/guards/route-guards.ts`,
`src/lib/auth/guards/org-guard.ts`,
`src/lib/auth/middleware/role-guard.ts`,
`src/lib/auth/utils/admin-check.ts`

**Q: Is there privilege escalation protection?**

**A:**

- Role checks are enforced server-side, not via client claims.
- Organization membership is validated against the database.
- Step-up auth gates sensitive actions (exports, role changes, DSAR).

**Evidence:** `src/lib/auth/guards/step-up.ts`,
`src/features/organizations/organizations.access.ts`

---

## 3. Brute-Force & Account Lockout

**Q: How do you prevent brute-force attacks?**

**A:**

- Client-side rate limiting via TanStack Pacer (auth preset: 5 per 15 minutes).
- Account lockout after 5 failed logins in 15 minutes with 30-minute lockout.
- MFA lockout after 3 failures in 5 minutes with 15-minute lockout.
- Security events logged for failures and lockouts.

**Evidence:** `src/lib/pacer/rate-limit-config.ts`,
`src/lib/security/config.ts`,
`src/lib/security/detection.ts`,
`src/lib/security/lockout.ts`,
`src/lib/security/events.ts`

**Q: Is there login anomaly detection?**

**A:**

- Risk scoring for new country (+30), region (+15), user agent (+20), or IP
  (+10).
- Alert triggered at score >= 50.

**Evidence:** `src/lib/security/detection.ts`,
`src/lib/security/config.ts`

---

## 4. Input Validation & Injection Prevention

**Q: How is SQL injection prevented?**

**A:**

- Database access uses Drizzle ORM with parameterized query builders.
- Any raw SQL usage should be audited separately for injection risk.

**Evidence:** `src/db/schema/*`, `src/lib/security/config.ts`

**Q: How is input validated?**

**A:**

- Server functions use Zod validation with `.inputValidator(schema.parse)`
  where applied.
- Schema-first validation ensures runtime type safety and user-friendly errors.

**Evidence:** `src/features/*/*.schemas.ts`, `src/features/*/*.mutations.ts`

**Q: What are password requirements?**

**A:**

- Minimum 8 characters, maximum 128.
- Requires uppercase, lowercase, numbers, and special characters.
- Strength scoring with feedback labels.

**Evidence:** `src/lib/security/password-config.ts`,
`src/lib/security/utils/password-validator.ts`,
`src/lib/security/config.ts`

---

## 5. Security Headers

**Q: What security headers are implemented?**

**A:**

- CSP nonce wiring exists for SSR-safe script execution.
- Secure cookie attributes (HttpOnly, SameSite, Secure) are enforced.
- CORS origins are restricted to configured base URL.

**Evidence:** `src/router.tsx`, `src/lib/security/config.ts`,
`src/lib/auth/server-helpers.ts`

**Q: How is CSP nonce handling done?**

**A:**

- Nonce is pulled from a `csp-nonce` meta tag or an inline script nonce.
- SSR falls back to `crypto.randomUUID()` when available.

**Evidence:** `src/router.tsx`

---

## 6. Audit & Compliance

**Q: Is there audit logging?**

**A:**

- Audit events span AUTH, ADMIN, DATA, EXPORT, SECURITY.
- Captures actor, target, IP, user agent, request ID, and org context.
- Change tracking includes before/after diffs.

**Evidence:** `src/lib/audit/index.ts`

**Q: How is the audit log protected from tampering?**

**A:**

- Hash chain per entry using SHA-256.
- Postgres advisory lock ensures sequential writes.
- Verification helpers validate current and legacy hash formats.

**Evidence:** `src/lib/audit/index.ts`

**Q: How are sensitive fields handled in logs?**

**A:**

- Redacted: password, secret, token, mfaSecret.
- Hashed: dateOfBirth, phone, emergencyContact.phone.
- Deep sanitization for nested objects and metadata.

**Evidence:** `src/lib/audit/index.ts`

---

## 7. Secret Management

**Q: How are secrets managed?**

**A:**

- Local: `.env` with Zod validation.
- Production: SST Secrets stored in AWS Secrets Manager.
- `BETTER_AUTH_SECRET` requires minimum 32 characters.
- Client only receives `VITE_` prefixed variables.

**Evidence:** `src/lib/env.server.ts`

**Q: Is there secret validation?**

**A:**

- Env schemas fail fast on missing/invalid secrets.
- Auth secret is validated lazily with explicit length enforcement.

**Evidence:** `src/lib/env.server.ts`

---

## 8. Known Gaps / Areas to Probe

- Server-side rate limiting: Client-side only via Pacer. Follow-up: add a
  server-side limiter (Redis/edge) and document policy.
- SAST/DAST scans in CI: Not visible in repo. Follow-up: add CI job and track
  results.
- Dependency vulnerability scanning: Not visible in repo. Follow-up: add
  `pnpm audit` or Snyk/Dependabot.
- Password hashing algorithm: Managed by Better Auth. Follow-up: confirm
  bcrypt/argon2 in Better Auth docs.
- Security-focused E2E tests: Some guard tests only. Follow-up: add lockout and
  step-up E2E coverage.
- Request size limiting: Not explicit in code. Follow-up: add body size limits
  in server and proxy layers.
- File upload validation: Form validation exists. Follow-up: review all upload
  handlers for MIME/size checks.

---

## References

- `docs/sin-rfp/phase-0/security-controls.md`
- `docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md`
