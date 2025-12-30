# 6.md Implementation Review and Plan

## Review of 6.md vs current code

### Key questions (status)

- MFA enforcement for admins: Partially enforced. Server functions using `requireAdmin` block when `mfaRequired` is true, but admin routes only check role membership (`src/routes/dashboard/admin/route.tsx`, `src/lib/auth/middleware/role-guard.ts`) and do not enforce MFA. `assignRoleToUser` does set `mfaRequired` for global admin roles (`src/features/roles/roles.mutations.ts`), but seed scripts bypass this.
- Step-up authentication: Present in several server functions (roles, reporting, exports), but `requireRecentAuth` can fail open with missing timestamps and does not reliably detect MFA verification time (`src/lib/auth/guards/step-up.ts`). Privacy/DSAR and security admin operations do not use step-up today.
- Route guards: Tenant and role gates exist, but MFA enforcement is inconsistent and some org context paths are optimized with trust of context values (`src/lib/auth/middleware/auth-guard.ts`).
- E2E coverage: Only tenant gating and basic admin vs non-admin access are covered (`e2e/tests/authenticated/sin-admin-access.auth.spec.ts`, `e2e/tests/authenticated/sin-portal-access.auth.spec.ts`).
- Seed scripts: `scripts/seed-sin-data.ts` is destructive, seeds long-lived sessions, exits 0 even on error, and does not seed MFA states.

### Findings matrix

| #   | 6.md finding                                               | Status              | Evidence                                                                                                                                                                                  | Notes                                                                                                                                                                        |
| --- | ---------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------- |
| 1   | Step-up can fail open if timestamps missing                | Confirmed           | `src/lib/auth/guards/step-up.ts`                                                                                                                                                          | If `authenticatedAt` is null and user is non-MFA, no re-auth is required.                                                                                                    |
| 2   | Session timestamp extraction mismatch                      | Likely              | `src/lib/auth/guards/step-up.ts`, `src/features/reports/reports.mutations.ts`, `src/features/roles/roles.mutations.ts`, `src/features/reporting/reporting.mutations.ts`                   | `extractSessionTimes` only checks top-level keys; callers pass the full `auth.api.getSession` object (which typically nests session fields). Verify actual shape in runtime. |
| 3   | MFA re-verification permissive when missing timestamp      | Confirmed           | `src/lib/auth/guards/step-up.ts`                                                                                                                                                          | If `twoFactorEnabled` is true and `lastMfaVerifiedAt` is missing but `authenticatedAt` exists, the check passes.                                                             |
| 4   | Admin session max-age and idle timeout not implemented     | Confirmed           | `src/lib/auth/server-helpers.ts`                                                                                                                                                          | Global session `expiresIn` is 8h, no 4h admin max-age or server-side idle timeout.                                                                                           |
| 5   | Admin MFA enforcement inconsistent                         | Partially confirmed | `src/lib/auth/utils/admin-check.ts`, `src/lib/auth/middleware/role-guard.ts`, `src/routes/dashboard/admin/route.tsx`, `src/features/roles/roles.mutations.ts`, `scripts/seed-sin-data.ts` | Server checks exist, but route guards do not enforce MFA; seeds bypass `mfaRequired` assignment.                                                                             |
| 6   | `markMfaEnrolled` can be called without verification       | Confirmed           | `src/features/auth/mfa/mfa.mutations.ts`                                                                                                                                                  | No DB check that 2FA is enabled before setting `mfaEnrolledAt`.                                                                                                              |
| 7   | Step-up UI lacks backup code path                          | Confirmed           | `src/features/auth/step-up.tsx`                                                                                                                                                           | Only calls `auth.twoFactor.verifyTotp`.                                                                                                                                      |
| 8   | `authMiddleware` trusts org role from context              | Partially confirmed | `src/lib/auth/middleware/auth-guard.ts`, `src/lib/auth/guards/org-context.ts`                                                                                                             | Optimization skips `resolveOrganizationAccess` when context has role; safe if context is server-derived, fragile if any client-injected path appears.                        |
| 9   | Inconsistent session freshness checks                      | Confirmed           | `src/lib/auth/middleware/auth-guard.ts`, `src/lib/auth/guards/org-context.ts`, `src/features/auth/auth.queries.ts`, `src/lib/auth/guards/step-up.ts`                                      | `disableCookieCache` only used in `authMiddleware`.                                                                                                                          |
| 10  | Seed script destructive with no safety guard               | Confirmed           | `scripts/seed-sin-data.ts`                                                                                                                                                                | Uses `E2E_DATABASE_URL                                                                                                                                                       |     | DATABASE_URL` and deletes broadly without env guard. |
| 11  | Seed script exits success on failure                       | Confirmed           | `scripts/seed-sin-data.ts`                                                                                                                                                                | `process.exit(0)` in `finally`.                                                                                                                                              |
| 12  | Seeded sessions violate policy / may not match Better Auth | Confirmed           | `scripts/seed-sin-data.ts`                                                                                                                                                                | Seeds 30-day sessions with plaintext tokens.                                                                                                                                 |
| 13  | Step-up prompt relies on string matching                   | Confirmed           | `src/features/auth/step-up.tsx`                                                                                                                                                           | `getStepUpErrorMessage` checks substrings.                                                                                                                                   |
| 14  | `requireAdmin` throws generic Error                        | Confirmed           | `src/lib/auth/utils/admin-check.ts`                                                                                                                                                       | Not using `unauthorized` / `forbidden` typed errors.                                                                                                                         |

## Implementation plan

### Phase 0 — Confirm session shape and add a shared session helper

- Inspect Better Auth `auth.api.getSession` return shape in runtime (or types) to confirm where `createdAt` / `iat` live.
- Add a shared helper (e.g., `src/lib/auth/session.ts`) that:
  - Calls `auth.api.getSession({ headers, query: { disableCookieCache: true } })`.
  - Returns `{ user, session }` plus normalized timestamps for guards.
- Update callers to use the helper:
  - `src/lib/auth/middleware/auth-guard.ts`
  - `src/lib/auth/guards/org-context.ts`
  - `src/features/auth/auth.queries.ts`
  - `src/lib/auth/guards/step-up.ts` (`getCurrentSession`)

### Phase 1 — Harden step-up enforcement

- Update `extractSessionTimes` in `src/lib/auth/guards/step-up.ts` to read nested shapes (e.g., `session.session.createdAt`).
- Fail closed when `authenticatedAt` cannot be determined:
  - If missing, throw `forbidden("Re-authentication required for this action")`.
- MFA-enabled users:
  - If Better Auth provides a reliable `lastMfaVerifiedAt`, enforce recency.
  - If not, treat `authenticatedAt` as the MFA-confirmed timestamp and require re-auth when stale.
  - If neither is available, require re-auth (and MFA) by default.
- Extend step-up usage to sensitive endpoints that currently lack it:
  - DSAR / privacy actions in `src/features/privacy/privacy.mutations.ts`
  - Security admin actions where appropriate (`src/features/security/security.mutations.ts`)
- Add unit tests for `requireRecentAuth` in a new file under `src/lib/auth/guards/__tests__`.

### Phase 2 — Make admin MFA enforcement consistent

- Update `requireAdmin` in `src/lib/auth/utils/admin-check.ts` to use `unauthorized` / `forbidden`.
- Add a route guard for MFA-required admins:
  - Option A: update `requireGlobalAdmin` in `src/lib/auth/middleware/role-guard.ts` to check `user.mfaRequired && !user.twoFactorEnabled`.
  - Option B: create `requireGlobalAdminWithMfa` and use it in `src/routes/dashboard/admin/route.tsx` and SIN admin routes.
- Backfill existing global admins:
  - Add a one-time script or migration to set `user.mfaRequired = true` for users with global admin roles.
- Update seed scripts:
  - In `scripts/seed-sin-data.ts`, set `mfaRequired` for admin users.
  - Optionally seed a known 2FA secret + backup codes in `twoFactor` table for a test admin.

### Phase 3 — Step-up UX and structured errors

- Add structured error signaling for step-up:
  - Extend `forbidden` helper to accept `details` or add a helper that throws `TypedServerError` with a `reason` (e.g., `REAUTH_REQUIRED` or `MFA_REQUIRED`).
  - Update `getStepUpErrorMessage` in `src/features/auth/step-up.tsx` to read the typed error instead of string matching.
- Add backup code support in step-up dialog:
  - Mirror login UI toggle and call `auth.twoFactor.verifyBackupCode` when selected.

### Phase 4 — Session policy enforcement (admin max-age + idle timeout)

- Implement admin max-age (4h) in `authMiddleware`:
  - Use session `createdAt` (from normalized session helper).
  - If admin and older than 4h, force re-login.
- Implement idle timeout (30m) server-side:
  - Add `lastActivityAt` column to `session` (or a separate table).
  - Update `lastActivityAt` in `authMiddleware` with throttling.
  - Reject requests when idle exceeds 30m; log a security event.
- Align any seeded sessions with the policy or stop seeding sessions entirely.

### Phase 5 — Seed script safety and determinism

- Harden `scripts/seed-sin-data.ts`:
  - Require `E2E_DATABASE_URL` or `--force`.
  - Refuse to run if `NODE_ENV === "production"`.
  - Remove `process.exit(0)` from `finally`.
- Remove seeded sessions or ensure:
  - Token format matches Better Auth expectations.
  - Expiry aligns with policy (8h / 4h admin).

### Phase 6 — E2E coverage for MFA and step-up

- Add Playwright coverage for:
  - MFA enrollment (TOTP + backup codes).
  - Login with MFA challenge (TOTP and backup).
  - Step-up for exports, role changes, and DSAR.
  - Admin MFA-required gating (blocked until enrolled).
  - Account lockout flow.
- Add test helpers:
  - TOTP generator (consider adding `otplib` dev dependency).
  - Seeded admin user with known 2FA secret and backup codes.
- Update E2E env vars:
  - `E2E_TEST_ADMIN_EMAIL`, `E2E_TEST_ADMIN_PASSWORD`
  - `E2E_TEST_ADMIN_TOTP_SECRET` (if using deterministic MFA)

### Validation checklist

- `pnpm lint`
- `pnpm check-types`
- `pnpm test`
- `pnpm test:e2e` (at least `sin-admin-access` + new MFA/step-up specs)
