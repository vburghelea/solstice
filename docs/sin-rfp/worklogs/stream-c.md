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
