# Development Backlog

Below is a **prioritized ticket backlog** that will take the current codebase from an auth-only skeleton to a thin, end-to-end **Member → Dashboard** slice and lay the foundation for Teams and Events. Each ticket lists:

- **Priority** (P0 = must ship next; P1 = after P0 etc.)
- **Status** (✅ Complete, 🚧 In Progress, ❌ Not Started)
- **Depends on** (other tickets or existing code)
- **Key code/doc references** (files you will touch or read)
- **Technical notes / first-implementation thoughts**

---

## Completed Work

### ✅ DONE: Roundup Games Design System Integration

|               |                                                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What**      | Integrated Roundup Games branding, created public/admin layouts, responsive navigation                                                                                                                                               |
| **Code refs** | `src/features/layouts/*`, `src/shared/ui/*`, auth pages styling                                                                                                                                                                      |
| **Delivered** | <ul><li>Public layout with header/footer</li><li>Admin dashboard layout with sidebar</li><li>Hero section, event cards</li><li>Mobile-responsive navigation</li><li>Consistent auth page styling</li><li>Dark mode support</li></ul> |

### ✅ DONE: Profile Schema Extension

|               |                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**      | Extended user table with profile fields needed for membership/teams                                                                                                                       |
| **Code refs** | `src/db/schema/auth.schema.ts`, `src/features/profile/*`                                                                                                                                  |
| **Delivered** | <ul><li>Profile columns: gender, pronouns, phone, privacy_settings</li><li>Profile feature module structure</li><li>isProfileComplete utility</li><li>Profile schemas and tests</li></ul> |

### ✅ DONE: Complete Profile Onboarding Flow (P0-2)

|               |                                                                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**      | Multi-step profile completion form with route guards to ensure required data before membership purchase                                                                                                               |
| **Code refs** | `src/routes/onboarding/*`, `src/features/profile/components/*`, `src/features/profile/profile-guard.ts`, `src/shared/ui/*`                                                                                            |
| **Delivered** | <ul><li>2-step onboarding form (Personal Info, Privacy)</li><li>Route guards with `requireCompleteProfile()`</li><li>shadcn/ui components integration</li><li>Mobile-responsive UI with progress indicators</li></ul> |

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

- ✅ **Roundup Games Design System** - Public/admin layouts, responsive navigation, dark mode
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

|               |                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ❌ Not Started                                                                                                                                                                                                                            |
| **Priority**  | 🟢 Medium                                                                                                                                                                                                                                 |
| **Why**       | Backend exists but no UI for pending invitations                                                                                                                                                                                          |
| **Code refs** | `src/features/teams/components/team-invitations.tsx` (create)                                                                                                                                                                             |
| **Tasks**     | <ul><li>Show pending status in team members list</li><li>Create invitations dashboard section</li><li>Add accept/decline buttons</li><li>Send invitation emails via SendGrid</li><li>Add notification badge for pending invites</li></ul> |

---

## 🔮 Future Roadmap

- **Event Registration Payment Flow** - Integrate Square for event fees
- **E-transfer Payment Option** - Alternative payment method
- **Image Uploads** - Profile pictures and team logos via Cloudinary
- **Mobile PWA** - Offline support for event day check-ins
- **Public Content Pages** - About, Resources, Contact pages
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

## Frontend Enhancement Tickets

### FE-2: Public Pages Content & Polish

|                |                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                      |
| **Why now**    | Public site needs real content; currently using placeholder text/images                                                                                                                                                                                                             |
| **Depends on** | None (frontend only)                                                                                                                                                                                                                                                                |
| **Code refs**  | `src/routes/index.tsx`, `src/shared/ui/hero-section.tsx`, `src/shared/ui/event-card.tsx`                                                                                                                                                                                            |
| **Tasks**      | <ul><li>Replace placeholder images with tabletop game-specific imagery</li><li>Update hero section copy to match brand voice</li><li>Create About, Teams, Resources static pages</li><li>Add loading states for event cards</li><li>Implement 404 page with brand styling</li></ul> |
| **Thoughts**   | Work with stakeholders for copy/images; can use Unsplash API for temp ones images                                                                                                                                                                                                   |

---

---

### FE-4: Mobile PWA Optimization

|                |                                                                                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                  |
| **Why now**    | Mobile usage expected to be high for event check-ins; current mobile experience is basic                                                                                                                                                                                        |
| **Depends on** | None, but best after core features (P1+)                                                                                                                                                                                                                                        |
| **Code refs**  | `public/manifest.json` (create), `src/app.tsx`, service worker setup                                                                                                                                                                                                            |
| **Tasks**      | <ul><li>Add PWA manifest with Roundup Games branding</li><li>Implement service worker for offline support</li><li>Add install prompt for mobile users</li><li>Optimize touch targets for mobile</li><li>Add pull-to-refresh on dashboard</li><li>Test on real devices</li></ul> |
| **Thoughts**   | Vite has PWA plugin; focus on offline-first for event days with poor connectivity                                                                                                                                                                                               |

---

### FE-3: Loading & Error States Polish

|                |                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                           |
| **Why now**    | Current error handling is basic; need consistent UX across app                                                                                                                                                                                           |
| **Depends on** | None                                                                                                                                                                                                                                                     |
| **Code refs**  | `src/components/DefaultCatchBoundary.tsx`, existing components                                                                                                                                                                                           |
| **Tasks**      | <ul><li>Create consistent error boundary UI with retry actions</li><li>Add skeleton loaders for all data-fetching components</li><li>Add optimistic updates for better perceived performance</li><li>Implement retry logic for failed requests</li></ul> |
| **Thoughts**   | Already using Sonner for toasts; focus on skeleton loaders and error boundaries                                                                                                                                                                          |

---

## Form Component Library (Remaining Tasks)

|               |                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | 🚧 Partially Complete                                                                                                                                                                                             |
| **Completed** | ValidatedDatePicker, ValidatedSelect, ValidatedInput, Sonner toasts, shadcn components                                                                                                                            |
| **Remaining** | <ul><li>Create PhoneInput with formatting</li><li>Create FileUpload component (for future profile pics)</li><li>Add Storybook or demo page for component library</li><li>Unit tests for form components</li></ul> |
| **Code refs** | `src/components/form-fields/*`                                                                                                                                                                                    |

### Security Hardening: OAuth Domain Allowlist

|               |                                                                                                                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**    | ❌ Not Started                                                                                                                                                                                                                                                                     |
| **Priority**  | 🟢 Medium (Security hygiene)                                                                                                                                                                                                                                                       |
| **Issue**     | `securityConfig.oauth.allowedDomains` is still an empty placeholder with a TODO. Production should enforce an allowlist for organizational SSO domains to prevent rogue sign-ups on OAuth identity providers.                                                                      |
| **Code refs** | `src/lib/security/config.ts:60-70`, `docs/SECURITY.md`                                                                                                                                                                                                                             |
| **Tasks**     | <ul><li>Add `OAUTH_ALLOWED_DOMAINS` parsing to `env.server.ts` with validation</li><li>Wire the env-driven list into the security config and OAuth guard rails</li><li>Document deployment guidance in `SECURITY.md`</li><li>Add unit coverage for configuration parsing</li></ul> |
