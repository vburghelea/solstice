# Development Backlog

**Last Updated**: September 19, 2025

This is the prioritized development roadmap for Solstice, Quadball Canada's league management platform. Each ticket includes priority (P0 = highest), status, dependencies, and key implementation details.

---

## 🚨 Critical Issues (Address First)

These are production-critical issues that should be addressed before new feature development:

### CRIT-1: Square Membership Reconciliation Gap ✅

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Priority**   | 🔴 Critical (Revenue & Compliance)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Issue**      | The checkout callback now verifies payments, but webhook processing still stops at logging. Memberships are not being updated on `payment.updated` events, refunds are ignored, and the confirm mutation lacks a retry/polling fallback. A webhook replay or Square delay can leave users paid but inactive.                                                                                                                                                                                                           |
| **Code refs**  | `src/routes/api/webhooks/square.ts:1-366`, `src/features/membership/membership.mutations.ts:25-352`, `SQUARE_FIX_SUMMARY.md`                                                                                                                                                                                                                                                                                                                                                                                           |
| **Tasks**      | <ul><li>✅ Persist membership activation/cancellation inside the webhook handler using `finalizeMembershipForSession`</li><li>✅ Handle refund events by downgrading associated memberships and emailing admins</li><li>✅ Add a light polling fallback to `confirmMembershipPurchase` so the UI re-checks status when the webhook lags</li><li>✅ Capture telemetry/logs for webhook signature failures and processing outcomes</li><li>✅ Backfill automated tests covering webhook success + refund flows</li></ul> |
| **Completion** | Webhook events now finalize memberships, downgrade refunded purchases, add retry logic to the confirm mutation, and carry dedicated unit coverage for both success and refund paths.                                                                                                                                                                                                                                                                                                                                   |
| **Why urgent** | Without webhook reconciliation the system can mis-report paid status and miss refunds, exposing Quadball Canada to revenue loss and manual support escalations.                                                                                                                                                                                                                                                                                                                                                        |

### CRIT-2: Team Creation Regression After Deactivation ✅

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Priority**   | 🔴 Critical (Blocks Smoke Tests & Team Management)                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Issue**      | The smoke test suite uncovered two regressions: `listTeams` rejected `null` payloads supplied by router calls, and attempting to create a new team after deactivating a previous one violated the `team_members_active_user_idx` constraint because prior memberships stayed active. These faults broke the dashboard, prevented team creation, and halted the automated release pipeline.                                                                                                   |
| **Code refs**  | `src/features/teams/teams.schemas.ts`, `src/features/teams/teams.mutations.ts`, `src/components/ui/admin-sidebar.tsx`, `e2e/tests/authenticated/teams-create-no-conflict.auth.spec.ts`, `logs/pnpm-e2e-smoke.log`                                                                                                                                                                                                                                                                            |
| **Tasks**      | <ul><li>✅ Normalize `listTeamsSchema` so missing or `null` payloads default to `{ includeInactive: false }`</li><li>✅ Guard `createTeam` with friendly handling for the active-membership uniqueness constraint</li><li>✅ Wrap `deactivateTeam` work in a transaction that marks memberships inactive before toggling the team itself</li><li>✅ Clear client cache and force a clean redirect to `/auth/login` after logout so follow-up E2E flows run against a fresh session</li></ul> |
| **Completion** | Smoke tests now pass end-to-end: dashboard queries no longer throw, team creators can spin up replacement teams without constraint collisions, and logout reliably returns to the auth screen during automated runs.                                                                                                                                                                                                                                                                         |
| **Why urgent** | The regression blocked QA on core team management flows and prevented release smoke tests from completing, making it a P0 fix.                                                                                                                                                                                                                                                                                                                                                               |

---

## 🚀 High Priority Features (Ship Next)

### HP-1: Admin Roles & Access Management

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Priority**   | 🟠 High (Security/Scalability)                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Why now**    | PermissionService exists, but there is no tooling to seed or manage roles and several dashboards still rely on implicit admin lists. Without UI + seeds we cannot delegate administration safely.                                                                                                                                                                                                                                        |
| **Depends on** | Roles schema (✅ complete), `PermissionService` (✅ complete)                                                                                                                                                                                                                                                                                                                                                                            |
| **Code refs**  | `src/lib/auth/utils/admin-check.ts`, `src/features/roles/permission.service.ts`, `docs/user-roles-and-permissions-v2.md`                                                                                                                                                                                                                                                                                                                 |
| **Tasks**      | <ul><li>✅ Create `scripts/seed-global-admins.ts` to bootstrap roles per environment</li><li>✅ Add admin dashboard UI for assigning/removing roles with audit trail</li><li>✅ Update reports and guarded routes to rely on role checks (no email allowlists)</li><li>✅ Document the operational process in `docs/user-roles-and-permissions-v2.md`</li><li>✅ Add E2E coverage for role assignment & restricted page access</li></ul> |

### HP-2: Events Flow E2E Coverage

|                |                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                       |
| **Priority**   | 🟠 High (Regression Risk)                                                                                                                                                                                                                                                                                                                                                          |
| **Why now**    | The full events workflow (create → register → manage) shipped without automated regression coverage. Manual spot-checking is brittle, and we already caught bugs during launch.                                                                                                                                                                                                    |
| **Depends on** | Events frontend/backend (✅ complete), Playwright setup (✅ complete)                                                                                                                                                                                                                                                                                                              |
| **Code refs**  | `src/routes/dashboard/events/*`, `src/routes/events/*`, `e2e/tests/`                                                                                                                                                                                                                                                                                                               |
| **Tasks**      | <ul><li>✅ Add Playwright happy-path spec covering organizer creation, attendee registration, and management dashboard actions</li><li>✅ Seed representative fixtures in `scripts/seed-e2e-data.ts`</li><li>✅ Confirmed registration flow stays Square-free so browser tests run offline</li><li>✅ Document local-only workflow (no GitHub Actions artifact required)</li></ul> |

### HP-3: Team Invitations Experience

|                |                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                     |
| **Priority**   | 🟠 High (Onboarding Experience)                                                                                                                                                                                                                                                                                                                                                  |
| **Why now**    | Teams can add members, but there is no UI for pending invitations or email notifications. Captains must coordinate manually, blocking the team onboarding flow.                                                                                                                                                                                                                  |
| **Depends on** | Team APIs (✅), SendGrid mock (✅)                                                                                                                                                                                                                                                                                                                                               |
| **Code refs**  | `src/features/teams/*`, `src/lib/email/sendgrid.ts`, `docs/teams-feature.md`                                                                                                                                                                                                                                                                                                     |
| **Tasks**      | <ul><li>✅ Build dashboard view for pending invitations with accept/decline actions</li><li>✅ Surface pending status in team member list and header badge</li><li>✅ Send SendGrid invitation emails and log in dev mode</li><li>✅ Add auditing fields for who sent the invite and reminder timestamps</li><li>✅ Write Playwright coverage for invite → accept flow</li></ul> |
| **Completion** | Team invitations now flow end-to-end: invites email the recipient, appear on the Teams dashboard with accept/decline actions, pending statuses are reflected throughout the roster views, and non-members can request to join from team detail pages. Automated Vitest + Playwright coverage guards the new behavior.                                                            |

---

## ✅ Completed Work (Summary)

<details>
<summary>Click to expand completed work history</summary>

### Phase 1: Foundation (Auth, Profile, Design System)

- ✅ **Quadball Canada Design System** - Public/admin layouts, responsive navigation, dark mode
- ✅ **Profile Schema & Onboarding** - Extended user table, 3-step onboarding flow, profile guards
- ✅ **Profile Server Functions** - Complete CRUD operations with validation
- ✅ **Form Component Library** - ValidatedInput, ValidatedDatePicker, ValidatedSelect with TanStack Form

### Phase 2: Core Business Logic (Memberships, Teams)

- ✅ **Membership System** - Database schema, purchase flow, mock Square integration
- ✅ **Membership UI** - Purchase/renewal flow, status display, admin reporting
- ✅ **Teams Feature** - Complete CRUD, member management, browse/search functionality
- ✅ **Profile Edit** - Inline editing with proper validation and E2E tests

### Phase 3: Infrastructure (Payments, Email, Security)

- ✅ **Square Payment Integration** - Real API with Payment Links, webhook handler, refunds
- ✅ **SendGrid Email Service** - Transactional emails with templates, environment switching
- ✅ **Rate Limiting** - TanStack Pacer client-side implementation
- ✅ **Events Backend** - Complete schema, queries, mutations (no UI yet)
- ✅ **Event Registration Payments** - Square checkout, e-transfer workflows, and admin reconciliation tools

### Phase 4: Polish (Dashboard, Forms, Testing)

- ✅ **Dashboard Home Page** - Personalized welcome, quick stats, action buttons
- ✅ **TanStack Form Migration** - All auth forms using consistent validation
- ✅ **E2E Test Suite** - Comprehensive tests for auth, profile, teams, memberships

</details>

---

## 📋 Next Up (After Critical & High Priority)

### UI Component Consolidation

|                |                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                         |
| **Priority**   | 🟢 Medium (Code quality)                                                                                                                                                                                                                                                                                                                                                             |
| **Issue**      | Duplicate UI components existed in both `src/components/ui` and the legacy `src/shared/ui`, causing inconsistent imports and stale variants.                                                                                                                                                                                                                                         |
| **Solution**   | Keep all shadcn-derived components in `src/components/ui`, update documentation, and remove the redundant shared directory.                                                                                                                                                                                                                                                          |
| **Tasks**      | <ul><li>✅ Consolidated components under `src/components/ui` and removed `src/shared/ui`</li><li>✅ Updated all source imports to use `~/components/ui`</li><li>✅ Refreshed developer docs (CLAUDE.md, AGENTS.md, testing guides, component guide) to reference the new location</li><li>✅ Confirmed `components.json` alias points shadcn installs to `~/components/ui`</li></ul> |
| **Completion** | Codebase now has a single canonical UI library path, eliminating duplicate component definitions and keeping shadcn installs aligned with the documented location.                                                                                                                                                                                                                   |

### Members Directory Feature

|               |                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ✅ Completed                                                                                                                                                                                                                                                                                  |
| **Priority**  | 🟢 Medium                                                                                                                                                                                                                                                                                     |
| **Why**       | Essential for team captains and admins to find players                                                                                                                                                                                                                                        |
| **Code refs** | `src/routes/dashboard/members.tsx`, `src/features/members/*`                                                                                                                                                                                                                                  |
| **Notes**     | Directory UI, privacy-aware query, CSV export, and detail dialog shipped (`src/routes/dashboard/members.tsx`, `src/features/members/members.queries.ts`). Playwright coverage in `e2e/tests/authenticated/members-directory.auth.spec.ts`.                                                    |
| **Tasks**     | <ul><li>✅ Create getAllMembers server query with joins</li><li>✅ Build filterable DataTable UI</li><li>✅ Add search by name/email/team</li><li>✅ Implement privacy settings respect</li><li>✅ Add export to CSV functionality</li><li>✅ Create member detail view (read-only)</li></ul> |

### Team Invitations Flow

|               |                                                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ✅ Completed                                                                                                                                                                                                                  |
| **Priority**  | 🟢 Medium                                                                                                                                                                                                                     |
| **Why**       | Backend exists but no UI for pending invitations                                                                                                                                                                              |
| **Code refs** | `src/features/teams/components/team-invitations.tsx` (create)                                                                                                                                                                 |
| **Notes**     | Pending invites surface on `/dashboard/teams`, roster views show `pending` badges with inviter context, and invitation emails fire through SendGrid mocks in dev. Playwright + Vitest coverage protects accept/decline flows. |

---

## 🔮 Future Roadmap

- **Image Uploads** - Profile pictures and team logos via Cloudinary
- **Advanced Permissions** - Event-specific and team-specific roles
- **Bulk Operations** - Import/export members, batch email sending
- **Analytics Dashboard** - Membership trends, event attendance stats

---

## 📝 Cross-Cutting Notes

- **E2E Tests Required**: All new features must include E2E tests in `e2e/tests/`
- **Documentation**: Update relevant docs in `/docs/` with any schema or API changes
- **Type Safety**: Use Zod validation for all server functions (see CLAUDE.md)
- **Components**: Install new shadcn components to `src/components/ui` (per components.json)
- **Rate Limiting**: Use `useRateLimitedServerFn` from Pacer for client-side rate limiting

---

## 🚀 Active Backlog Focus

### FE-2: Public Pages Content & Polish

|                |                                                                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                    |
| **Why now**    | Public site needs real content; currently using placeholder text/images                                                                                                                                                                                                                                                         |
| **Depends on** | None (frontend only)                                                                                                                                                                                                                                                                                                            |
| **Code refs**  | `src/components/ui/hero-section.tsx`, `src/components/ui/icons.tsx`, `components.json`, `src/features/profile/components/profile-view.tsx`                                                                                                                                                                                      |
| **Tasks**      | <ul><li>✅ Replaced placeholder imagery with Quadball-focused art direction</li><li>✅ Updated public landing hero copy and CTA flows</li><li>✅ Added new About, Teams, and Resources static pages</li><li>✅ Added loading + error states to event cards and listings</li><li>✅ Implemented branded 404 experience</li></ul> |
| **Notes**      | Homepage now pulls live event data with skeleton fallbacks, and the new static pages live under `/about`, `/teams`, `/resources`, and `/events`.                                                                                                                                                                                |

### FE-3: Loading & Error States Polish

|                |                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                  |
| **Why now**    | Current error handling is basic; need consistent UX across app                                                                                                                                                                                                |
| **Depends on** | None                                                                                                                                                                                                                                                          |
| **Code refs**  | `src/components/DefaultCatchBoundary.tsx`, data-fetching components in `src/features/*`                                                                                                                                                                       |
| **Tasks**      | <ul><li>✅ Unified error boundary with retry + fallback messaging</li><li>✅ Added skeleton states to key dashboards (teams browse, events) with refresh indicators</li><li>✅ Added optimistic invite mutations and retry affordances for searches</li></ul> |
| **Notes**      | Shared `DataErrorState` component standardizes inline failures; mutations now optimistically update pending team invites.                                                                                                                                     |

### FE-4: Mobile PWA Optimization

|                |                                                                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                |
| **Why now**    | Mobile usage expected to be high for event check-ins; current mobile experience is basic                                                                                                                                                                    |
| **Depends on** | None, but best after core features (P1+)                                                                                                                                                                                                                    |
| **Code refs**  | `public/manifest.json` (create), `src/app.tsx`, service worker setup                                                                                                                                                                                        |
| **Tasks**      | <ul><li>✅ Added branded web manifest + icons</li><li>✅ Configured Vite PWA plugin with offline caching strategies</li><li>✅ Added home-screen install prompt component</li><li>✅ Tuned mobile nav/touch targets with refreshed header actions</li></ul> |
| **Notes**      | Service worker caches public pages/events, and mobile install prompts surface via `InstallPrompt`.                                                                                                                                                          |

### Form Component Library (Remaining Tasks)

|               |                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ✅ Completed                                                                                                                                                                           |
| **Completed** | PhoneInput with E.164 storage + Canadian formatting, FileUpload with preview/size guard, component demo page, unit tests for new controls                                              |
| **Notes**     | Components live in `src/components/form-fields/`, demo available at `/design-system`, with tests under `src/components/form-fields/__tests__/` covering formatting + validation logic. |

### Security Hardening: OAuth Domain Allowlist

|               |                                                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ✅ Completed                                                                                                                                                                                                                                                         |
| **Priority**  | 🟢 Medium (Security hygiene)                                                                                                                                                                                                                                         |
| **Issue**     | `securityConfig.oauth.allowedDomains` is still an empty placeholder with a TODO. Production should enforce an allowlist for organizational SSO domains to prevent rogue sign-ups on OAuth identity providers.                                                        |
| **Code refs** | `src/lib/env.server.ts`, `src/lib/env/oauth-domain.ts`, `src/lib/auth/server-helpers.ts`, `docs/SECURITY.md`                                                                                                                                                         |
| **Notes**     | OAuth sign-ins now honor the `OAUTH_ALLOWED_DOMAINS` env var, rejecting unapproved domains with a clear error. Parsing is centralized in `parseOAuthAllowedDomains` (covered by `src/lib/__tests__/oauth-domain.test.ts`), and deployment guidance has been updated. |
