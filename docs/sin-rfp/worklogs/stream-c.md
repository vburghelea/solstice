# Worklog — Stream C - Access control and org gating

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream C - Access control and org gating) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] C1 Reports: require auth for listSavedReports; scope by owner/shared/
      org-wide within accessible orgs; JSONB sharedWith filter.
- [ ] C2 Reports: enforce org access and roles on create/update; restrict
      isOrgWide to org admins; validate or block sharedWith for non-admins.
- [ ] C3 Reports: export authorization uses context.organizationId for
      non-admins; allow optional org id only for global admins; ignore or validate
      spoofed filters.
- [ ] C4 Organizations: require global admin for createOrganization,
      searchOrganizations, listAllOrganizations; audit enumerations.
- [ ] C5 Organizations: secure getOrganization with session + access (or force
      current org id for non-admins).
- [ ] C6 Organizations: listOrganizationMembers and listDelegatedAccess require
      org admin roles; add redacted directory endpoint if needed.
- [ ] C7 Organizations: restrict updateOrganization parent/type changes to
      global admin; fix parentOrgId clearing when omitted; add audit diff.
- [ ] C8 Organizations: listOrganizations filters to active memberships; decide
      delegated access inclusion.
- [ ] C9 Reporting queries: require auth and requireOrganizationAccess; avoid
      conditional auth paths.
- [ ] C10 Privacy admin mutations: add requireAdmin and optional
      requireRecentAuth (see Stream H for workflow).
- [ ] C11 Notifications admin endpoints: add requireAdmin, and ensure
      createNotification requires session or is server-only; set audit actor from
      session.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27 12:07:35 -0700

- Created `docs/sin-rfp/worklogs/stream-c-context.md` summarizing Stream C
  context; should not need to re-open implementation detail markdowns unless
  something new is uncovered.

### 2025-12-27 12:17:54 -0700

- C1-C3: Hardened reports server fns.
  - `listSavedReports` now requires auth, scopes by owner/shared/org-wide within
    accessible orgs, and respects admin overrides.
  - `createSavedReport` / `updateSavedReport` enforce org access + roles,
    restrict org-wide to org admins, and validate sharedWith against active org
    membership.
  - `exportReport` now uses org context for non-admins, supports optional
    orgId for global admins, and sanitizes org filter usage.
- Note: org-less reports cannot be shared (aligns D0.1 personal scope). If any
  legacy records violate this, they will need cleanup.

### 2025-12-27 12:28:08 -0700

- C4-C8: Hardened organization access control.
  - `createOrganization`, `searchOrganizations`, `listAllOrganizations` now
    require global admin; admin enumeration calls are audited.
  - `getOrganization` requires session + org access.
  - `listOrganizationMembers` and `listDelegatedAccess` now require org-admin
    access (delegated admin supported).
  - `updateOrganization` restricts type/parent changes to global admin and fixes
    parentOrgId clearing when omitted.
  - `listOrganizations` now filters to active memberships.
- Decision: left delegated access out of `listOrganizations` (membership-only)
  to avoid changing UI expectations; revisit if delegated org listing is needed.

### 2025-12-27 12:31:29 -0700

- C9: Reporting queries now require auth and enforce org access consistently.
  - `listReportingCycles`/`listReportingTasks` scoped to accessible orgs (and
    orgType-matched tasks when orgId is null); null-org, null-type tasks are
    admin-only.
  - `listReportingSubmissions`, `listReportingOverview`, and
    `listReportingSubmissionHistory` use `requireOrganizationAccess` and no
    longer allow unauthenticated enumeration.

### 2025-12-27 12:32:21 -0700

- C10: Privacy admin mutations now require global admin + step-up auth:
  - `createPolicyDocument`, `updatePrivacyRequest`, and `upsertRetentionPolicy`
    call `requireAdmin` and `requireRecentAuth`.
- Note: step-up enforcement relies on `requireRecentAuth`; any session timestamp
  shape issues in `src/lib/auth/session.ts` could still affect behavior.

### 2025-12-27 12:33:54 -0700

- C11: Notification admin endpoints locked down.
  - `createNotification` now requires session, forbids cross-user creation for
    non-admins, and logs actor from session.
  - `createNotificationTemplate` and `scheduleNotification` now require admin.

### 2025-12-27 12:36:38 -0700

- Ran `pnpm lint` and `pnpm check-types`.
  - Lint: 1 existing warning in `src/components/ui/logo.tsx` about
    `@eslint-react/hooks-extra/no-direct-set-state-in-use-effect`.
  - Typecheck: failing in `src/lib/audit/index.ts:292` (Date constructor type
    mismatch). Not touched in this stream; likely needs Stream G attention.

### 2025-12-27 12:53 - Type errors resolved

- All type errors and lint warnings fixed (see stream-b.md for details).
- `pnpm lint` and `pnpm check-types` now pass cleanly.
- All 260 tests pass.
