# Worklog — Stream B - Org context and client routing safety

## Instructions

- Use `docs/sin-rfp/5.2-pro-review-output/consolidated-backlog.md` (Stream B - Org context and client routing safety) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [ ] B1 Guard import.meta.env access in src/lib/env.client.ts; optionally split
      tenant env into client/server modules.
- [ ] B2 Add server fn to validate candidate org id via
      resolveOrganizationAccess.
- [ ] B3 Update src/routes/\_\_root.tsx to validate active_org_id on server and
      client; clear invalid cookie/localStorage values.
- [ ] B4 Update /dashboard/sin guard to rely on validated
      context.activeOrganizationId.
- [ ] B5 Sync OrgContextProvider with route context changes; remove org switcher
      race by writing localStorage synchronously.
- [ ] B6 Scope accessible-org query by user.id and gate by authenticated user.
- [ ] B7 Clear org context on logout (cookie, localStorage, query cache) in
      app-sidebar and admin-sidebar; consider shared helper.
- [ ] B8 Lock down redirect param in /dashboard/select-org (allowlist internal
      paths).
- [ ] B9 Feature-gate SIN portal and admin overview cards using existing nav
      definitions.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

## Blockers

## Files Modified This Session

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.
