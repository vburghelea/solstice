# Stream B Context (Org context and client routing safety)

## Sources reviewed

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/2.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/2-implementation.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/5-implementation.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6.md`
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md`

## Stream B scope (from consolidated backlog)

- B1 Guard `import.meta.env` access in `src/lib/env.client.ts`; optionally split tenant env into client/server modules.
- B2 Add server fn to validate candidate org id via `resolveOrganizationAccess`.
- B3 Update `src/routes/__root.tsx` to validate `active_org_id` on server and client; clear invalid cookie/localStorage values.
- B4 Update `/dashboard/sin` guard to rely on validated `context.activeOrganizationId`.
- B5 Sync `OrgContextProvider` with route context changes; remove org switcher race by writing localStorage synchronously.
- B6 Scope accessible-org query by `user.id` and gate by authenticated user.
- B7 Clear org context on logout (cookie, localStorage, query cache) in app-sidebar and admin-sidebar; consider shared helper.
- B8 Lock down redirect param in `/dashboard/select-org` (allowlist internal paths).
- B9 Feature-gate SIN portal and admin overview cards using existing nav definitions.

## Key findings + impacts (2.md + 2-implementation)

- `env.client.ts` reads `import.meta.env` at module load; `tenant-env.ts` imports it at top-level. In non-Vite runtimes (SST cron/Lambda/Node scripts), `import.meta.env` can be undefined and crash tenant resolution.
- Root route trusts `active_org_id` from cookie/localStorage without validating access. This bypasses the org-selection UX, risks cross-org access if any endpoint misses authZ, and creates inconsistent UI states.
- `/dashboard/sin` guard checks only presence of `context.activeOrganizationId` (not validity).
- Org selection persistence leaks across users: logout does not clear `localStorage.active_org_id` or the cookie.
- Accessible-org React Query cache key is not user-scoped and query is enabled by feature flag only. Results can leak across users in the same browser session.
- `OrgContextProvider` does not sync when route context changes, causing drift between router context and local state.
- Org switcher can race navigation because localStorage is updated in a `useEffect`, not before navigation. This yields redirect loops.
- `/dashboard/select-org` accepts any `redirect` string and navigates to it without validation (open-redirect inside the app router).
- SIN portal and admin overview cards are not feature-gated, causing dead links when features are disabled.

## Additional context from other docs

- Phase 2 org-context hardening plan in `5-implementation.md` mirrors stream B tasks: root route validation, org-context sync, logout clearing, select-org redirect validation, and `/dashboard/sin` guard updates.
- `authMiddleware` currently trusts `context.organizationRole` as an optimization (from `6.md`/`6-implementation.md`). This is safe only if org context is server-derived and validated, reinforcing the need for B2/B3.
- D0 notes confirm tenant key (`getTenantKey()` in `src/tenant`) is available at runtime; ensure SSR/worker imports do not crash when Vite globals are absent.

## Implementation guidance to carry forward

- Add a server function that validates a candidate org id via `resolveOrganizationAccess` and returns `{ organizationId, role } | null`.
- In `__root.tsx`:
  - Server: read cookie, validate via server fn, set context to validated value or clear cookie.
  - Client: read localStorage, validate via server fn, update localStorage to validated value or clear.
- In `/dashboard/sin` guard: rely on validated `context.activeOrganizationId` and redirect to `/dashboard/select-org` when missing/invalid (with safe redirect).
- In `OrgContextProvider`: sync local state when route context changes; update localStorage synchronously when changing org to avoid navigation race.
- For accessible org query: include `user.id` in query key and gate by authenticated user (not just feature flag).
- On logout: clear `active_org_id` cookie and localStorage, and remove org-related queries from React Query.
- Lock down `/dashboard/select-org` redirect param to an internal allowlist (e.g., `/dashboard/*`, no schemes or `//`).
- Feature-gate SIN portal and admin overview cards using existing nav definitions (`getAppNavSections`, `getSinAdminNav`, `filterNavItems`), including org-role gating for analytics.
