# Stream A Context (Auth, session, MFA)

## Sources reviewed

- `docs/sin-rfp/5.2-pro-review-output/ .md` (consolidated backlog; file name has a leading space)
- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/4-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/6.md`
- `docs/sin-rfp/5.2-pro-review-output/6-implementation.md`
- Better Auth docs: `https://www.better-auth.com/llms.txt` + `docs/concepts/api.md` + `docs/concepts/session-management.md`

## Stream A scope (from consolidated backlog)

- A1 Shared session helper using `auth.api.getSession` with `disableCookieCache`; update auth middleware, org-context guard, auth queries, and step-up to use it.
- A2 Harden `requireRecentAuth`: extract nested timestamps, fail closed when missing, treat MFA timestamps consistently; add unit tests.
- A3 Update `requireAdmin` to throw typed unauthorized/forbidden errors and enforce MFA-required admin checks in route guards.
- A4 Add structured step-up error signaling and update `StepUpDialog` to use it; add backup code verification path.
- A5 Enforce session policies: admin max-age 4h, idle timeout 30m; add `lastActivityAt` tracking and middleware enforcement.
- A6 Backfill `mfaRequired` for existing global admins and update seed scripts to set MFA state.
- A7 Harden `scripts/seed-sin-data.ts`: require `E2E_DATABASE_URL` or `--force`, refuse production, remove `process.exit(0)`, and align seeded sessions with auth policy or remove them.

## Key findings and expectations (from 6.md + 6-implementation)

- Step-up can fail open: `requireRecentAuth` does nothing if `authenticatedAt` is missing and user is non-MFA.
- `extractSessionTimes` only reads top-level keys; Better Auth commonly returns `{ user, session }` where timestamps are under `session.session.*`.
- MFA re-verification is permissive: if `twoFactorEnabled` and `lastMfaVerifiedAt` missing, the guard currently passes when it should require re-auth.
- Admin MFA enforcement is inconsistent:
  - `requireAdmin` checks `mfaRequired`, but route guards only check role membership.
  - `assignRoleToUser` sets `mfaRequired` for global admin roles, but seed scripts bypass it.
- Step-up UX is brittle: `getStepUpErrorMessage` relies on substring matching, and the dialog only verifies TOTP (no backup code option).
- Session policy gaps:
  - Auth config uses 8h max age; no admin 4h max-age enforcement.
  - Idle timeout (30m) is not enforced server-side; `updateAge` is not an idle timeout.
  - `securityConfig.session` claims 30 days but is unused/misleading.
- Session freshness is inconsistent: `disableCookieCache` is used in auth middleware only; other session reads can be stale.
- `scripts/seed-sin-data.ts` is destructive, seeds long-lived plaintext sessions, exits 0 in `finally`, and does not seed admin MFA flags.

## Better Auth session notes (docs)

- `auth.api.getSession({ headers, query: { disableCookieCache: true } })` forces DB-backed session fetch and refreshes cookie cache.
- Session response shape: `{ user, session }` (customizable via `customSession` plugin). Session object contains `createdAt` and `expiresAt` (timestamps used for freshness).
- Cookie cache can be disabled per-call when consistency is needed.

## Additional context from d0-decision-analysis

- Step-up is expected for high-impact admin actions (e.g., createOrganization, manual notifications) and should return consistent errors that the UI can detect.
- Security thresholds use MFA failure counts to trigger flagging/lockouts; step-up should be reliable to support those flows.

## Implementation guidance to carry forward

- Add a shared session helper that always disables cookie cache and normalizes timestamps so all guards use the same session shape.
- Update `requireRecentAuth` to fail closed when timestamps are missing and treat MFA verification as mandatory when `twoFactorEnabled` is true.
- Replace generic errors in `requireAdmin` with `unauthorized`/`forbidden` so clients can respond with structured step-up handling.
- Add structured error codes (e.g., `REAUTH_REQUIRED`, `MFA_REQUIRED`) so `StepUpDialog` avoids string matching.
- Add backup code verification in step-up flows (mirror login MFA UI).
- Implement admin session max-age (4h) and idle timeout (30m) with server-side tracking (`lastActivityAt`).
- Backfill admin `mfaRequired` and update seed scripts to set MFA state; avoid seeding sessions unless aligned with policy.
