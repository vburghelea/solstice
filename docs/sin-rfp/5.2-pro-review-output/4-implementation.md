# 4.md Review and Implementation Plan

This document reviews the issues in `docs/sin-rfp/5.2-pro-review-output/4.md`
against the current codebase, then lays out a concrete implementation plan.

## Codebase review of 4.md issues

### Issue 1: Unauthenticated security event writes

- Status: Confirmed.
- Evidence:
  - `src/features/security/security.mutations.ts` exposes
    `recordSecurityEvent` with only `assertFeatureEnabled("security_core")`.
  - Caller can provide `userId` or `identifier`, and events trigger
    `applySecurityRules` in `src/lib/security/detection.ts` (account lockouts).
  - Client calls exist in `src/features/auth/components/login.tsx`,
    `src/components/ui/app-sidebar.tsx`, and `src/components/ui/admin-sidebar.tsx`.
- Notes: This endpoint is reachable without a session and can poison event logs
  or induce lockouts.

### Issue 2: createOrganization missing global admin gate

- Status: Confirmed.
- Evidence: `createOrganization` in
  `src/features/organizations/organizations.mutations.ts` checks only
  `sin_admin_orgs` + session user.
- Notes: Any authenticated user can create orgs and becomes owner.

### Issue 3: getOrganization lacks access control

- Status: Confirmed.
- Evidence: `getOrganization` in
  `src/features/organizations/organizations.queries.ts` returns org by ID with
  no session check or access enforcement.

### Issue 4: search/listAll organizations lack global admin gate

- Status: Confirmed.
- Evidence: `searchOrganizations` and `listAllOrganizations` in
  `src/features/organizations/organizations.queries.ts` only check feature flag.

### Issue 5: updateOrganization allows org admins to change hierarchy fields

- Status: Confirmed.
- Evidence: `updateOrganization` uses
  `requireOrganizationMembership(..., { roles: ORG_ADMIN_ROLES })` and allows
  `type` and `parentOrgId` changes without global admin gating.

### Issue 6: updateOrganization clears parentOrgId when omitted

- Status: Confirmed.
- Evidence: Update call sets `parentOrgId: data.data.parentOrgId ?? null`, which
  resolves to `null` when `parentOrgId` is omitted.

### Issue 7: listOrganizationMembers exposes emails to any member

- Status: Confirmed.
- Evidence: `listOrganizationMembers` only requires membership and returns
  `user.email` for all members.

### Issue 8: listOrganizations does not filter membership status

- Status: Confirmed.
- Evidence: `listOrganizations` joins `organizationMembers` but does not filter
  `organizationMembers.status = "active"`.

### Issue 9: IP handling in security events is unvalidated

- Status: Confirmed.
- Evidence: `src/lib/security/events.ts` inserts `x-forwarded-for` directly into
  `inet` without parsing or validation.

### Issue 10: Detection rules are limited to simple thresholds

- Status: Confirmed.
- Evidence: `src/lib/security/detection.ts` only checks login/mfa failure counts.
  No risk scoring or anomaly logic uses `riskScore` or `riskFactors`.

### Issue 11: listAccountLocks returns inactive locks

- Status: Confirmed.
- Evidence: `listAccountLocks` in `src/features/security/security.queries.ts`
  returns all locks, while UI text says "No active locks."

### Issue 12: Session config mismatch with stated policy

- Status: Partially applicable.
- Evidence:
  - `src/lib/security/config.ts` sets `session.maxAge` to 30 days.
  - Actual auth session settings live in
    `src/lib/auth/server-helpers.ts` (8h, updateAge 30m).
  - `securityConfig.session` is not referenced elsewhere.
- Notes: This is currently a misleading config rather than enforced behavior.

### Issue 13: Missing indexes on security tables

- Status: Confirmed.
- Evidence: `src/db/schema/security.schema.ts` defines no indexes on
  `security_events` or active `account_locks`. Migrations also lack them.

### Issue 14: CORS allowed headers omit X-Organization-Id

- Status: Partial.
- Evidence: `securityConfig.cors.allowedHeaders` omits `X-Organization-Id` in
  `src/lib/security/config.ts`, but no CORS middleware currently consumes this.
- Notes: If CORS is implemented later, header allowlist should include it.

## Implementation plan

### Track A: Security event ingestion hardening (Issues 1, 9, 10)

1. Move auth-related event creation to the server.
   - Add Better Auth hooks in `src/lib/auth/server-helpers.ts` using
     `createAuthMiddleware` (per Better Auth hooks docs).
   - In `after` hooks, log `login_success`, `mfa_success`, and `logout`.
   - In `before`/`after` hooks for failure paths, log `login_fail` and `mfa_fail`
     based on structured errors rather than client-reported data.
2. Split "trusted" vs "untrusted" event entry points.
   - Replace `recordSecurityEvent` server fn with an auth-required handler that
     only accepts an allowlist of admin/system event types and never accepts
     `userId` from the client.
   - If unauthenticated reporting is needed, add a separate server fn with a
     strict allowlist, no `userId` input, and rate limiting. Avoid triggering
     lockouts from untrusted events.
3. Normalize IP extraction.
   - Add a helper in `src/lib/security/events.ts` to parse `x-forwarded-for`
     (split on commas, trim, validate with `net.isIP`).
   - Fallback to `x-real-ip` or a safe default if invalid.
4. Expand detection rules.
   - On `login_success`, compare recent security events for new geo/UA signals
     and store `riskScore` + `riskFactors`.
   - Record a `login_anomaly` event and notify admins when threshold exceeded.
   - Decide when to lock vs flag (likely flag first, lock only on high risk).
   - Store thresholds in config (tenant-aware if required).

### Track B: Org admin gating and data exposure (Issues 2, 3, 4, 7, 8)

1. `createOrganization`
   - Require global admin (use `PermissionService.isGlobalAdmin` or wrap
     `requireAdmin` and convert to `errorResult`).
   - If self-service creation is intended, restrict to allowed types and set
     `status: "pending"` with explicit approval workflow.
2. `getOrganization`
   - Require session and `resolveOrganizationAccess` (or global admin).
   - Consider forcing access to current org context instead of arbitrary ID.
3. `searchOrganizations` and `listAllOrganizations`
   - Require session + global admin. Optionally require step-up for listAll.
   - Add audit logs for enumeration actions (admin visibility).
4. `listOrganizationMembers`
   - Require `ORG_ADMIN_ROLES` for full member list and email visibility.
   - If a member directory is needed, add a separate endpoint with redacted
     fields for non-admins.
5. `listOrganizations`
   - Add `organizationMembers.status = "active"` filter.
   - Consider whether delegated access should be included and align with
     `listAccessibleOrganizationsForUser`.

### Track C: Org hierarchy update safety (Issues 5, 6)

1. Restrict `type` and `parentOrgId` changes.
   - If either field is present, require global admin (and optionally step-up).
   - Keep org admins limited to name/slug/status/settings/metadata changes.
2. Fix update payload handling.
   - Build the update payload with conditional keys only when present.
   - Use `nextParentOrgId` for validation and for the update when provided.
3. Add an explicit audit diff for parent/type changes with actor and reason.

### Track D: Security admin views (Issue 11)

1. Add `includeHistory` to `listAccountLocks` schema.
2. Default to active locks only:
   - Same filter as `isAccountLocked` (unlockedAt null and unlockAt in future).
3. Update `src/features/security/components/security-dashboard.tsx` to show
   active-only by default with a toggle for history if needed.

### Track E: Session/CORS config alignment (Issues 12, 14)

1. Align session policy across config and enforcement.
   - Either remove `securityConfig.session` if unused or update it to 8h max age
     with explicit admin 4h policy (and idle timeout).
   - Ensure actual enforcement lives in server middleware/guards.
2. If/when CORS middleware is added, include `X-Organization-Id` in allowed
   headers and document the trusted proxy model.

### Track F: Indexing and migrations (Issue 13)

1. Add indexes in `src/db/schema/security.schema.ts`:
   - `security_events(user_id, created_at desc)`
   - `security_events(ip_address, created_at desc)`
   - `account_locks(user_id) WHERE unlocked_at IS NULL`
2. Generate a migration and apply it in dev/test.

## Testing plan

- Unit/integration:
  - `recordSecurityEvent` rejects unauthenticated calls and ignores client
    `userId`.
  - `getOrganization`, `searchOrganizations`, `listAllOrganizations` enforce
    session + global admin.
  - `updateOrganization` rejects parent/type changes for non-admins and does
    not clear `parentOrgId` when omitted.
  - `listOrganizationMembers` enforces admin role and redacts emails if needed.
  - `listOrganizations` excludes inactive memberships.
  - `listAccountLocks` returns only active locks by default.
- E2E:
  - Admin-only org search/list endpoints blocked for non-admins.
  - Org hierarchy updates blocked for org admins.
  - Security event logging works via auth hooks (login success/fail).
  - Account lockout thresholds still function after moving events server-side.

## Open decisions

- Should self-service org creation exist in SIN? If yes, which org types and
  what approval workflow?
- Should non-admin members have a directory view? If yes, what fields are safe?
- What anomaly detection thresholds are acceptable for SIN production?
