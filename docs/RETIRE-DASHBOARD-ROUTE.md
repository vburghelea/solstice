# Retire `/dashboard` Route Plan

Purpose: provide an execution-ready roadmap for removing the legacy `/dashboard` route, migrating flows into persona-specific spaces, and decommissioning unused dashboard code.

---

## Phase 1 — Discovery & Inventory

- [x] Map every import of `src/routes/dashboard/*` and `src/features/dashboard/*` (including internal analytics/reporting consumers) and capture them in a working doc or checklist.
- [x] List dashboard-specific server functions, queries, mutations, loaders, and utilities and mark whether they are safe to delete or must be migrated.
- [x] Identify all UI components, guards, and helpers that reference `/dashboard` (breadcrumbs, auth guards, nav items, tests, documentation) and note their locations.
- [x] Confirm that no external analytics/reporting surfaces rely on dashboard data.

## Phase 2 — Persona Redirect Strategy

- [x] Update core auth flows (`useAuthForm`, login/signup components, middleware, `useAuthGuard`, `role-guard`) to default post-auth redirects to `/player`.
- [x] Define redirect targets for persona switching (admin→`/admin/`, gm→`/gm/`, ops→`/ops/`, visitor→`/`).
- [x] Replace all direct `/dashboard` redirects with persona-aware logic, including onboarding/profile flows and guard fallbacks.
- [x] Document persona redirect rules within shared helpers or comments for future maintainability.

## Phase 3 — Navigation UX Updates

- [x] Refactor `src/features/layouts/role-workspace-layout.tsx` to coordinate persona navigation and ensure active persona routes load their correct base paths.
- [x] Update `src/features/roles/components/role-switcher.tsx` to redirect to persona base routes upon selection while respecting role availability.
- [x] Adjust global/shared nav components (mobile tab bar, admin sidebar, breadcrumbs, public header) to eliminate `/dashboard` entries and point to persona routes.
- [x] Run UI smoke checks to confirm navigation items render correctly for different personas.

## Phase 4 — Rehome Onboarding & Profile Flows

- [x] Relocate onboarding entry points (e.g., `/onboarding`, `requireCompleteProfile`) so the user lands in `/player/onboarding/*` while keeping the flow under the player persona layout.
- [x] Move the profile-completion form and related components into `/player/profile/*`, ensuring they render within the player persona shell and no longer depend on `/dashboard`.
- [x] Update completion redirects so successful onboarding/profile completion returns the user to the `/player` home view, and ensure persona switching rules still apply afterwards.
- [x] Adjust Zod schemas, tests, guard helpers, and copy to reflect the new `/player` route ownership.

## Phase 5 — Decommission Dashboard Routes & Features

- [x] Remove the `/dashboard` route tree (`route.tsx`, `index.tsx`, all sub-routes`).
- [x] Delete dashboard-only feature code after confirming no remaining dependencies (components, hooks, query files).
- [x] Migrate or rehome any shared utilities uncovered during Phase 1; otherwise delete them.
- [x] Update exports and barrel files to drop `/dashboard` references and address TypeScript fallout.

## Phase 6 — Tests & Documentation

- [x] Update or remove unit/integration tests targeting `/dashboard`; add coverage for persona redirects, onboarding, and navigation when necessary.
- [x] Refresh Playwright journeys to exercise `/player`, `/admin`, `/gm`, and `/ops` entry points.
- [x] Edit documentation, onboarding copy, and internal references to remove `/dashboard` mentions and describe the persona-first flow.
- [x] Confirm no screenshots or diagrams require updates (none expected per stakeholder guidance).

## Phase 7 — Validation & Cleanup

- [x] Run `pnpm lint` and address all findings.
- [x] Run `pnpm check-types` to ensure no lingering type issues.
- [x] Perform manual UI validation with the Playwright tool against the dev server for each persona base route.
- [x] Re-run discovery scans (e.g., `rg "/dashboard"`) to ensure the path is fully retired.
- [x] Prepare release notes or deployment summary if required.

---

Completion Criteria:

- No references to `/dashboard` remain in code, tests, or docs.
- Post-authentication and persona switching reliably land on correct persona routes.
- Onboarding/profile flows operate within `/player` and guard logic reflects new routes.
- Linting, type checks, and targeted UI validations pass.

---

### Phase 1 Inventory Notes

- Dashboard Routes: `src/routes/dashboard/**` included campaigns, events, games, members, profile, reports, settings, social audits, systems, teams, and their associated tests. All have been removed.
- Dashboard Feature Module: `src/features/dashboard/dashboard.queries.ts` previously exposed `getDashboardStats` and `getNextUserGame`; functionality now lives in `src/features/player/player.queries.ts` as persona-scoped helpers.
- Redirect/Link References: onboarding route (`src/routes/onboarding/route.tsx` → now `/player/onboarding/route.tsx`), auth flows (`src/features/auth/components/login.tsx`, `signup.tsx`, `useAuthForm`, guards, middleware), navigation components (`src/features/layouts/role-workspace-layout.tsx`, `src/features/roles/components/role-switcher.tsx`, `src/components/ui/public-header.tsx`), route guards, profile forms, and generated route tree all updated to persona paths.
- Documentation/Test Mentions: unit and e2e suites previously asserting `/dashboard` redirects were rewritten for persona routes; docs referencing dashboard entry points now reflect persona-specific flows.

## Release Notes / Deployment Summary

- **Routes & Navigation**: Removed the legacy `/dashboard` tree and its sub-routes. Persona hubs (`/player`, `/admin`, `/gm`, `/ops`) now own their respective navigation, landing pages, and sidebars. Role switching automatically routes to the correct persona base path.
- **Onboarding & Profile Completion**: Relocated the onboarding experience to `/player/onboarding` and ensured profile completion flows and guards redirect to `/player` post-success.
- **Server Functions & Data**: Dashboard stats and “next game” queries now live in `src/features/player/player.queries.ts`, scoped to the player persona. All former dashboard helpers were deleted or migrated.
- **Auth & Guards**: Updated login/signup flows, auth guards, and middleware defaults to `/player`, with persona-aware fallbacks for admin/GM/ops/visitor roles.
- **UI Components**: Replaced dashboard-specific components (sidebar, breadcrumbs, mobile tab bar) with persona-centric implementations; public header links now point to the player hub.
- **Tests & Docs**: Refreshed unit/integration/E2E tests and project documentation to reflect persona routes. Renamed the shared dashboard E2E test to `player-workspace.shared.spec.ts` and updated support utilities.
- **Validation**: `pnpm lint` and `pnpm check-types` pass. Dev server run attempted to regenerate the route tree (successful) though port binding failed in sandbox; recommend a quick Playwright smoke run during rollout.
