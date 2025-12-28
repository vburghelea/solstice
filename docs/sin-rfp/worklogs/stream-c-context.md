# Stream C Context (Access Control and Org Gating)

Purpose: consolidate the Stream C background so I do not need to re-open
implementation and decision docs while working the backlog.

## Source docs consulted

- `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/5.2-pro-review-output/1-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/3-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/4.md`
- `docs/sin-rfp/5.2-pro-review-output/4b.md`
- `docs/sin-rfp/5.2-pro-review-output/5-implementation.md`
- `docs/sin-rfp/5.2-pro-review-output/6-implementation.md`

## Stream C backlog items

- C1 Reports: require auth for listSavedReports; scope by owner/shared/org-wide
  within accessible orgs; JSONB sharedWith filter.
- C2 Reports: enforce org access and roles on create/update; restrict isOrgWide
  to org admins; validate or block sharedWith for non-admins.
- C3 Reports: export authorization uses context.organizationId for non-admins;
  allow optional org id only for global admins; ignore or validate spoofed
  filters.
- C4 Organizations: require global admin for createOrganization,
  searchOrganizations, listAllOrganizations; audit enumerations.
- C5 Organizations: secure getOrganization with session + access (or force
  current org id for non-admins).
- C6 Organizations: listOrganizationMembers and listDelegatedAccess require org
  admin roles; add redacted directory endpoint if needed.
- C7 Organizations: restrict updateOrganization parent/type changes to global
  admin; fix parentOrgId clearing when omitted; add audit diff.
- C8 Organizations: listOrganizations filters to active memberships; decide
  delegated access inclusion.
- C9 Reporting queries: require auth and requireOrganizationAccess; avoid
  conditional auth paths.
- C10 Privacy admin mutations: add requireAdmin and optional requireRecentAuth.
- C11 Notifications admin endpoints: add requireAdmin; ensure createNotification
  requires session or is server-only; set audit actor from session.

## D0 decisions that affect Stream C

- D0.1 (saved reports with organizationId = null): treat null as personal scope
  (owner-only) for non-admins. Non-admins can see owner/shared/org-wide reports
  only within accessible orgs. Global admins can see all.
- D0.2 (reporting cycles/tasks without organizationId): short-term treat null org
  as admin-only, or only visible via organizationType filter for accessible org
  types. Do not allow unauthenticated enumeration.
- D0.3 (createNotification exposure): make createNotification server-only or
  require authenticated session with strict allowlist; do not trust client actor.
- D0.9 (org creation policy): global admin only.

## Access control plan notes (1-implementation + 5-implementation)

- Require auth for all server functions in scope.
- Prefer `getAuthMiddleware()` + `requireUser(context)` for consistent session
  and lockout handling.
- Use `requireOrganizationAccess` (not membership) so delegated access and global
  admins are handled correctly.
- Align org-role checks with analytics/reporting roles already used in nav
  (`owner`, `admin`, `reporter`).
- Use `context.organizationId` for non-admin scoping; do not trust
  `x-organization-id` header or client filters for non-admins.

## Reports specifics

- `listSavedReports` currently has no auth and can return all reports. Needs auth
  plus visibility rules: owner, sharedWith, or org-wide within accessible orgs.
  JSONB containment for sharedWith: `shared_with @> '["userId"]'::jsonb`.
- `createSavedReport` and `updateSavedReport` allow arbitrary org scoping and
  `isOrgWide` without role checks; `sharedWith` not validated. Require
  org access and org-admin roles for org-wide; validate or block sharedWith for
  non-admins.
- `updateSavedReport` can move a report into another org without access checks.
  Require access to target org or disallow org changes for non-admins.
- `exportReport` uses membership and header/filters for org scoping; fix to use
  `context.organizationId` for non-admins, require roles (`owner/admin/reporter`)
  via `requireOrganizationAccess`, and allow optional org id only for global
  admins. Ignore or validate spoofed filter org ids.

## Organizations specifics (4.md + 1-implementation)

- `createOrganization` needs global admin requirement.
- `searchOrganizations` and `listAllOrganizations` need global admin requirement.
- `getOrganization` needs session + access (global admin or
  `requireOrganizationAccess`). Consider forcing current org for non-admins.
- `listOrganizationMembers` exposes emails to any member; restrict to org admins
  and consider separate redacted directory endpoint.
- `listDelegatedAccess` should require org admin roles.
- `updateOrganization` should restrict changes to `type` and `parentOrgId` to
  global admins (tenancy boundary).
- Bug: `parentOrgId` is cleared when omitted; only write when field present.
- `listOrganizations` should filter `organizationMembers.status = "active"`;
  decide whether delegated access should be included.

## Reporting queries (3-implementation + d0 decisions)

- `listReportingCycles`, `listReportingTasks`, `listReportingSubmissions` must
  always require a session and enforce org access (no conditional auth).
- For null org tasks, treat as admin-only or only visible when
  `organizationType` matches one of the user's org types.
- If organizationId is supplied, always call `requireOrganizationAccess`.
- If org not supplied, filter to accessible org IDs (no “list all” behavior).

## Privacy admin mutations (4b.md + 6-implementation)

- `createPolicyDocument`, `updatePrivacyRequest`, `upsertRetentionPolicy` need
  `requireAdmin`. Optional `requireRecentAuth` (step-up) for sensitive actions.
- Step-up currently has fail-open gaps (`requireRecentAuth` timestamp handling),
  so add note in worklog if step-up is added.

## Notifications admin endpoints (4b.md + d0 decisions)

- `createNotification` currently unauthenticated and logs audit actor as
  `data.userId` (target); must require session or be server-only and set audit
  actor to session user.
- `createNotificationTemplate` and `scheduleNotification` need `requireAdmin`.
- If non-admin creation ever allowed, force `isSystem` to false.

## Known helpers/constraints

- `orgContextMiddleware` already resolves org context via
  `resolveOrganizationAccess`, but most server fns above do not use
  `context.organizationId` today.
- Keep server-only imports inside handlers or `serverOnly()` to avoid client
  bundle leakage.
