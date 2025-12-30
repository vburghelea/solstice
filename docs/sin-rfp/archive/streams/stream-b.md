# Worklog — Stream B - Org context and client routing safety

## Instructions

- Use `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream B - Org context and client routing safety) as the source of truth.
- Keep this log updated during implementation and link any new ADRs.
- Follow TanStack Start server-only import patterns.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Use Playwright MCP for UI verification when applicable.

## Scope (from consolidated backlog)

- [x] B1 Guard import.meta.env access in src/lib/env.client.ts; optionally split
      tenant env into client/server modules.
- [x] B2 Add server fn to validate candidate org id via
      resolveOrganizationAccess.
- [x] B3 Update src/routes/\_\_root.tsx to validate active_org_id on server and
      client; clear invalid cookie/localStorage values.
- [x] B4 Update /dashboard/sin guard to rely on validated
      context.activeOrganizationId.
- [x] B5 Sync OrgContextProvider with route context changes; remove org switcher
      race by writing localStorage synchronously.
- [x] B6 Scope accessible-org query by user.id and gate by authenticated user.
- [x] B7 Clear org context on logout (cookie, localStorage, query cache) in
      app-sidebar and admin-sidebar; consider shared helper.
- [x] B8 Lock down redirect param in /dashboard/select-org (allowlist internal
      paths).
- [x] B9 Feature-gate SIN portal and admin overview cards using existing nav
      definitions.

## Dependencies

- See `docs/sin-rfp/worklogs/master.md`.

## Questions for User

## Decisions Made

- Opted for guarded `import.meta.env` access in `src/lib/env.client.ts` without splitting tenant env modules (optional per backlog).
- Added a shared client helper to clear org state on logout (`src/features/organizations/org-context-utils.ts`) instead of duplicating logic.

## Blockers

## Technical Debt / Follow-ups

- `setActiveOrganization` enforces `sin_portal`; logout clears the cookie via this server fn but will warn if feature gating blocks it. If this becomes noisy, consider a dedicated clear-cookie endpoint.

## Files Modified This Session

- `docs/sin-rfp/archive/streams/stream-b-context.md`
- `docs/sin-rfp/archive/streams/stream-b-c-g-communication.md`
- `src/lib/env.client.ts`
- `src/features/organizations/organizations.queries.ts`
- `src/routes/__root.tsx`
- `src/routes/dashboard/sin.tsx`
- `src/features/organizations/org-context.tsx`
- `src/features/organizations/org-context-utils.ts`
- `src/components/ui/app-sidebar.tsx`
- `src/components/ui/admin-sidebar.tsx`
- `src/routes/dashboard/select-org.tsx`
- `src/routes/dashboard/sin/index.tsx`
- `src/routes/dashboard/admin/sin/index.tsx`

## Session Log

### 2025-12-27: Session Start

- Initialized worklog.

### 2025-12-27 12:06

- Created `docs/sin-rfp/archive/streams/stream-b-context.md` to consolidate Stream B context.
- Noted that implementation detail markdowns do not need to be re-read for Stream B.

### 2025-12-27 12:23

- B1: Guarded `import.meta.env` access in `src/lib/env.client.ts` (no tenant-env split).
- B2: Added `validateActiveOrganization` server fn to validate org id via `resolveOrganizationAccess`.
- B3: Updated `src/routes/__root.tsx` to validate `active_org_id` on server/client and clear invalid cookie/localStorage.
- B4: `/dashboard/sin` guard now redirects with safe path-only redirect target.
- B5/B6: `OrgContextProvider` now syncs with route context, writes localStorage synchronously, and scopes accessible-org query by user id.
- B7: Logout now clears org context (cookie attempt, localStorage, query cache) via shared helper in both sidebars.
- B8: Locked down `/dashboard/select-org` redirect param to `/dashboard/*` allowlist.
- B9: Feature-gated SIN portal and admin overview cards using existing nav definitions.

### 2025-12-27 12:30

- `pnpm lint` completed with existing warning in `src/components/ui/logo.tsx` (setState in useEffect).
- `pnpm check-types` failed due to pre-existing errors in `src/features/organizations/organizations.queries.ts` and `src/features/reports/reports.mutations.ts` (redeclared `user` symbol, select typing, and report export typing).

### 2025-12-27 12:53 - Type errors resolved

- All type errors and lint warnings fixed:
  - `src/db/schema/security.schema.ts`: Fixed `sql` import (from `drizzle-orm` not `drizzle-orm/pg-core`)
  - `src/lib/audit/index.ts:292`: Fixed Date constructor type (cast `occurredAtValue` as `string | number`)
  - `src/lib/audit/__tests__/audit-utils.test.ts`: Fixed index signature access (use bracket notation)
  - `src/lib/auth/server-helpers.ts`: Fixed exactOptionalPropertyTypes issues (`undefined` → `null`), `findUserByEmail` return type, and `getSignedCookie` type
  - `src/lib/security/detection.ts`: Fixed type compatibility (`undefined` → `null`)
  - `src/components/ui/logo.tsx`: Refactored to use `useMemo` + error state instead of `useEffect` setState
- `pnpm lint` and `pnpm check-types` now pass cleanly.
- All 260 tests pass.
- Playwright MCP verified: auth guards redirect correctly, viaSport branding renders properly.
