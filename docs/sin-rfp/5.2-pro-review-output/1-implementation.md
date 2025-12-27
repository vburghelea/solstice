# 1.md Review and Implementation Plan

## Scope

This document reviews the access-control/security findings in `docs/sin-rfp/5.2-pro-review-output/1.md` against the current codebase, then lays out a detailed implementation plan to close the gaps.

## Review of 1.md vs Current Code

All findings in 1.md are confirmed in the current codebase.

1. Saved reports enumeration (unauth + cross-org)

- Confirmed in `src/features/reports/reports.queries.ts:13-35`. No session check; if `organizationId` is provided the query uses `organizationId OR isOrgWide`, which returns org-wide reports across all orgs.

2. Saved report creation allows arbitrary org targeting

- Confirmed in `src/features/reports/reports.mutations.ts:130-169`. Only session check; no org-access or role enforcement when `organizationId` is provided or when `isOrgWide` is set.

3. Saved report update can move report into another org

- Confirmed in `src/features/reports/reports.mutations.ts:171-225`. Update allows `organizationId` changes without validating access to the new org.

4. Report export uses membership and header/filters for org scoping

- Confirmed in `src/features/reports/reports.mutations.ts:267-355`. Uses `requireOrganizationMembership` (not access), no role gate, and derives org from `x-organization-id` or filters instead of trusted context.

5. SIN org creation missing global admin enforcement

- Confirmed in `src/features/organizations/organizations.mutations.ts:120-203`. Only feature flag + session, no `requireAdmin`.

6. Org search + list-all are effectively public

- Confirmed in `src/features/organizations/organizations.queries.ts:96-154`. Feature flag only; no session or admin check.

7. getOrganization has no auth/access check

- Confirmed in `src/features/organizations/organizations.queries.ts:31-47`. No session or access guard.

8. Any org member can list all members (emails included)

- Confirmed in `src/features/organizations/organizations.queries.ts:156-202`. Requires membership only; returns `userEmail` for all members.

9. Org admin flows use membership instead of access

- Confirmed in `src/features/organizations/organizations.mutations.ts:205-220` and `src/features/organizations/organizations.queries.ts:204-217`. Uses `requireOrganizationMembership`, which excludes delegated access and global admin workflows.

10. Privacy admin mutations missing admin enforcement

- Confirmed in `src/features/privacy/privacy.mutations.ts:23-58`, `:133-169`, `:171-216`. Feature flag + session only; no `requireAdmin`.

11. Reporting queries allow unauthenticated enumeration

- Confirmed in `src/features/reporting/reporting.queries.ts:36-109`. No session in `listReportingCycles`; conditional access in `listReportingTasks` and `listReportingSubmissions` only if a user exists.

12. Notification creation unauthenticated + audit spoofable

- Confirmed in `src/features/notifications/notifications.mutations.ts:122-156`. No session check; audit actor is set to `data.userId` (target user).

13. Notification template creation + scheduling missing admin enforcement

- Confirmed in `src/features/notifications/notifications.mutations.ts:159-193` and `:248-282`. Only session check; `isSystem` is client-controlled.

Note: `orgContextMiddleware` already resolves org context via `resolveOrganizationAccess` (`src/lib/auth/guards/org-context.ts:33-85`), but the affected server functions do not use `context.organizationId` or `getAuthMiddleware()`.

## Implementation Plan

### Cross-cutting approach

1. Require authentication for every endpoint in scope unless explicitly public. Prefer `getAuthMiddleware()` + `requireUser(context)` to get a consistent session, lockout check, and org context.
2. Use `requireOrganizationAccess` (not membership) for org scoping to include delegated access and global admins.
3. Keep server-only imports inside handlers or behind `serverOnly()` to avoid client-bundle leakage.
4. Align org-role checks with the analytics/reporting roles already used in navigation (`owner`, `admin`, `reporter`).

### Reports

1. Harden `listSavedReports` (`src/features/reports/reports.queries.ts`).

- Add auth middleware; reject unauthenticated callers (401).
- If `organizationId` is provided, call `requireOrganizationAccess({ userId, organizationId })` and filter with `organizationId = orgId` AND (owner OR sharedWith includes user OR isOrgWide).
- If `organizationId` is absent, restrict results to accessible orgs (use `listAccessibleOrganizationsForUser` or `resolveOrganizationAccess` per org) and apply the same owner/shared/isOrgWide rules; allow global admin to see all.
- Implement `sharedWith` filtering via JSONB containment (e.g., `shared_with @> '["userId"]'::jsonb`).

2. Harden `createSavedReport` (`src/features/reports/reports.mutations.ts`).

- Add auth middleware; use `requireUser(context)`.
- Determine effective org: `data.organizationId ?? context.organizationId`. If missing and not admin, return 400/403.
- If `organizationId` is provided, call `requireOrganizationAccess` and require analytics roles.
- If `isOrgWide` is true, require `ORG_ADMIN_ROLES`.
- Validate `sharedWith` entries are within the org (membership or delegated scope). If not feasible now, reject `sharedWith` for non-admins.

3. Harden `updateSavedReport` (`src/features/reports/reports.mutations.ts`).

- Add auth middleware; keep owner/global-admin guard.
- If `organizationId` is being changed, require global admin or `requireOrganizationAccess` for the new org. Consider blocking org changes entirely for non-admins.
- If toggling `isOrgWide` or updating `sharedWith`, enforce org-admin roles and recipient validation.

4. Fix `exportReport` scoping (`src/features/reports/reports.mutations.ts`).

- Add auth middleware; use `context.organizationId` for non-admins instead of header/filters.
- Require `requireOrganizationAccess` with roles `owner|admin|reporter` for non-admins.
- For global admins, allow an optional `organizationId` input (add to `exportReportSchema`) to scope exports; otherwise allow global export.
- Ignore or validate `filters.organizationId` for non-admins to prevent spoofing.
- Set `orgRole` from resolved access (context) before PII checks.

### Organizations

1. Gate `createOrganization` with `requireAdmin` (`src/features/organizations/organizations.mutations.ts`).

- Add admin check immediately after session validation.
- Optional: add step-up (`requireRecentAuth`) since this is a high-impact admin action.

2. Gate `searchOrganizations` and `listAllOrganizations` with admin checks (`src/features/organizations/organizations.queries.ts`).

- Require session; call `requireAdmin(userId)`; return 401/403 instead of empty list.

3. Secure `getOrganization` (`src/features/organizations/organizations.queries.ts`).

- Require session; allow global admin OR `requireOrganizationAccess` for the requested org.
- If this endpoint is intended to fetch only the active org, consider ignoring `organizationId` for non-admins and use `context.organizationId` instead.

4. Lock down `listOrganizationMembers` and `listDelegatedAccess`.

- Switch to `requireOrganizationAccess` with `ORG_ADMIN_ROLES` in both endpoints.
- If a member directory is needed, create a separate endpoint that omits `userEmail` for non-admins.

### Privacy

1. Add admin enforcement to:

- `createPolicyDocument` (`src/features/privacy/privacy.mutations.ts:23-58`)
- `updatePrivacyRequest` (`src/features/privacy/privacy.mutations.ts:133-169`)
- `upsertRetentionPolicy` (`src/features/privacy/privacy.mutations.ts:171-216`)

Use `requireAdmin(sessionUser.id)` inside handlers; optionally add `requireRecentAuth` for step-up.

### Reporting

1. Require authenticated callers for `listReportingCycles`, `listReportingTasks`, and `listReportingSubmissions` (`src/features/reporting/reporting.queries.ts`).

- Use `getAuthMiddleware()` or enforce `getSessionUserId()` with unauthorized errors.

2. Enforce org access consistently.

- If `organizationId` is supplied, always call `requireOrganizationAccess` (no conditional).
- If not supplied, either restrict to global admins or filter to the caller's accessible org IDs (use `listAccessibleOrganizationsForUser` and filter `reportingTasks`/`reportingSubmissions`).

### Notifications

1. Lock down `createNotification` (`src/features/notifications/notifications.mutations.ts`).

- Require session or service-level authentication.
- Treat `data.userId` as the target; set audit `actorUserId` from the session user.
- If this is intended for internal/system use, move it to a server-only helper and remove from client-exposed server functions.

2. Require admin for `createNotificationTemplate` and `scheduleNotification`.

- Add `requireAdmin(userId)` to both handlers.
- If non-admin creation is ever allowed, force `isSystem` to false.

### Tests and verification

1. Add access-control tests for each high-risk area:

- Saved reports: unauthenticated list/create/update/export should be blocked; cross-org org-wide reports should not leak.
- Organizations: non-admin search/list-all blocked; non-member getOrganization blocked; listOrganizationMembers requires admin role.
- Reporting: unauthenticated list cycles/tasks/submissions blocked; org access enforced.
- Privacy: non-admin cannot create/update policy docs or retention policies.
- Notifications: unauthenticated create/template/schedule blocked; audit actor matches session user.

2. Extend Playwright E2E coverage for SIN admin vs non-admin access, or add focused integration tests for server fns.

3. Run `pnpm lint` and `pnpm check-types` after changes.

## Open Questions

1. Should saved reports with `organizationId = null` be visible to non-admin users, or should they be admin-only?
2. For reporting cycles/tasks without `organizationId` filters, should visibility be admin-only or filtered via accessible orgs?
3. Is `createNotification` intended to be internal-only (system jobs) or an admin UI action? This affects the auth pattern and schema.
