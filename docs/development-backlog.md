# Development Backlog

Below is a **prioritized ticket backlog** that will take the current "Solstice" codebase from an auth-only skeleton to a thin, end-to-end **Member → Membership Purchase → Dashboard** slice and lay the foundation for Teams and Events. Each ticket lists:

- **Priority** (P0 = must ship next; P1 = after P0 etc.)
- **Status** (✅ Complete, 🚧 In Progress, ❌ Not Started)
- **Depends on** (other tickets or existing code)
- **Key code/doc references** (files you will touch or read)
- **Technical notes / first-implementation thoughts**

---

## Completed Work

### ✅ DONE: Quadball Canada Design System Integration

|               |                                                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What**      | Integrated Quadball Canada branding, created public/admin layouts, responsive navigation                                                                                                                                             |
| **Code refs** | `src/features/layouts/*`, `src/shared/ui/*`, auth pages styling                                                                                                                                                                      |
| **Delivered** | <ul><li>Public layout with header/footer</li><li>Admin dashboard layout with sidebar</li><li>Hero section, event cards</li><li>Mobile-responsive navigation</li><li>Consistent auth page styling</li><li>Dark mode support</li></ul> |

### ✅ DONE: Profile Schema Extension

|               |                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**      | Extended user table with profile fields needed for membership/teams                                                                                                                                               |
| **Code refs** | `src/db/schema/auth.schema.ts`, `src/features/profile/*`                                                                                                                                                          |
| **Delivered** | <ul><li>Profile columns: dob, gender, emergency_contact, pronouns, phone, privacy_settings</li><li>Profile feature module structure</li><li>isProfileComplete utility</li><li>Profile schemas and tests</li></ul> |

---

## P0 - Critical Path (Ship These First)

### ✅ P0-1: Complete User-Profile server functions

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ✅ Complete                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Why now**    | Profile schema exists but no way to update it; blocks profile completion flow                                                                                                                                                                                                                                                                                                                                                                                |
| **Depends on** | Profile schema (✅ complete)                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Code refs**  | `src/features/profile/profile.mutations.ts` / `.queries.ts`                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Tasks**      | <ul><li>~~Add profile fields~~ ✅ DONE</li><li>~~Create Drizzle migration~~ ✅ DONE</li><li>~~Implement **server functions** in profile.mutations.ts / .queries.ts~~ ✅ DONE</li><li>~~Add Zod schema~~ ✅ DONE</li><li>~~Unit tests for schemas~~ ✅ DONE</li><li>~~Add integration tests for server functions~~ ✅ DONE (unit tests exist)</li></ul>                                                                                                       |
| **Delivered**  | <ul><li>getUserProfile() - fetches authenticated user's profile</li><li>getProfileCompletionStatus() - checks which fields are missing</li><li>updateUserProfile() - updates partial profile fields</li><li>completeUserProfile() - completes profile with all required fields</li><li>updatePrivacySettings() - updates only privacy settings</li><li>Full TypeScript types and Zod validation</li><li>Profile versioning and completion tracking</li></ul> |

---

### ❌ P0-2: Implement "Complete Your Profile" protected flow

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Why now**    | Guarantees required data before user can purchase membership or register for events.                                                                                                                                                                                                                                                                                                                                                                                 |
| **Depends on** | P0-1 (profile server functions)                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Code refs**  | `src/routes/(auth)` guard pattern<br>`docs/quadball-plan/ui-flows/user-journeys.md` (New Member Onboarding)                                                                                                                                                                                                                                                                                                                                                          |
| **Tasks**      | <ul><li>Create route group `src/routes/onboarding/` with a multi-step form using the **TanStack Form hook** from `src/lib/form.ts` (follows `.cursor/rules/form-rule.mdc`).</li><li>Reuse `ValidatedInput` etc. Expand with new reusable components (e.g. DatePicker stub).</li><li>Add route guard: if `user.profileComplete === false`, redirect any protected route to onboarding.</li><li>Persist with profile server mutation, invalidate user query.</li></ul> |
| **Thoughts**   | The form slice doubles as first real-world test of our centralized form hook; update `docs/quadball-plan/ui-flows/component-guide.md` with example.                                                                                                                                                                                                                                                                                                                  |

---

### ❌ P0-3: Membership tables, pricing seeds & purchase server functions

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Why now**    | Core business requirement; absolutely required before any team/event work.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Depends on** | P0-1 (some columns needed by FK)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Code refs**  | `docs/quadball-plan/database/schema-overview.md` (Membership section)<br>`docs/quadball-plan/integrations/README.md` (Square)                                                                                                                                                                                                                                                                                                                                                                                               |
| **Tasks**      | <ul><li>Add tables: `membership_types`, `memberships` (user FK), indexes per docs.</li><li>Seed one basic annual type in migration.</li><li>Server functions: `listMembershipTypes()`, `createCheckoutSession(typeId)`, `confirmMembershipPurchase()` invoked by Square webhook (placeholder now).</li><li>Use helper `src/lib/payments/square.ts` (already referenced in docs but not present) – create it with minimal "mock" implementation that returns a fake checkout URL for now so front-end can proceed.</li></ul> |
| **Thoughts**   | Keep Square integration stubbed behind feature flag env var to unblock UI/test writing; real webhook will land in P1.                                                                                                                                                                                                                                                                                                                                                                                                       |

---

### ❌ P0-4: "Buy / Renew Membership" UI slice

|                |                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Why now**    | Demonstrates DB ↔ payments ↔ UI flow; enables smoke tests and stakeholder demos.                                                                                                                                                                                                                                                                                                                             |
| **Depends on** | P0-3                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Code refs**  | `docs/quadball-plan/ui-flows/user-journeys.md` (Member Renewal & Onboarding flows)                                                                                                                                                                                                                                                                                                                             |
| **Tasks**      | <ul><li>Add page `/membership` under dashboard layout: shows active membership or list of `membership_types`.</li><li>When "Buy Now" clicked, call `createCheckoutSession` -> redirect to returned checkout URL (fake).</li><li>After redirect back (Square will call `?success=1`), fetch server function to verify & show confirmation.</li><li>Unit/integration tests (Vitest + Testing Library).</li></ul> |
| **Thoughts**   | UI can be basic list → card per membership type, using shadcn `Card`. Add skeleton loader while fetching.                                                                                                                                                                                                                                                                                                      |

---

## Frontend Enhancement Tickets

### FE-1: Dashboard Home Page Implementation

|                |                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                         |
| **Why now**    | Empty dashboard looks unfinished; users need immediate value after login                                                                                                                                                                                                                               |
| **Depends on** | None (can be done in parallel with P0 work)                                                                                                                                                                                                                                                            |
| **Code refs**  | `src/routes/dashboard/index.tsx`, existing admin layout                                                                                                                                                                                                                                                |
| **Tasks**      | <ul><li>Create dashboard home with welcome message using user's name</li><li>Add quick stats cards (placeholder data ok): membership status, team count, upcoming events</li><li>Add quick action buttons: Complete Profile, Buy Membership, Join Team</li><li>Mobile-responsive grid layout</li></ul> |
| **Thoughts**   | Use existing Card components; this gives immediate polish while backend work continues                                                                                                                                                                                                                 |

---

### FE-2: Public Pages Content & Polish

|                |                                                                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                 |
| **Why now**    | Public site needs real content; currently using placeholder text/images                                                                                                                                                                                                        |
| **Depends on** | None (frontend only)                                                                                                                                                                                                                                                           |
| **Code refs**  | `src/routes/index.tsx`, `src/shared/ui/hero-section.tsx`, `src/shared/ui/event-card.tsx`                                                                                                                                                                                       |
| **Tasks**      | <ul><li>Replace placeholder images with Quadball-specific imagery</li><li>Update hero section copy to match brand voice</li><li>Create About, Teams, Resources static pages</li><li>Add loading states for event cards</li><li>Implement 404 page with brand styling</li></ul> |
| **Thoughts**   | Work with stakeholders for copy/images; can use Unsplash API for temp Quadball images                                                                                                                                                                                          |

---

### FE-3: Form Component Library Expansion

|                |                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                                              |
| **Why now**    | Profile completion (P0-2) needs date picker, select dropdowns; membership forms need these too                                                                                                                                                                                                                              |
| **Depends on** | Can start anytime, needed by P0-2                                                                                                                                                                                                                                                                                           |
| **Code refs**  | `src/components/form-fields/*`, `src/shared/ui/*`                                                                                                                                                                                                                                                                           |
| **Tasks**      | <ul><li>Create DatePicker component (can use react-day-picker)</li><li>Create Select component with search</li><li>Create PhoneInput with formatting</li><li>Create FileUpload component (for future profile pics)</li><li>Add Storybook or demo page for component library</li><li>Unit tests for each component</li></ul> |
| **Thoughts**   | These are reusable across profile, membership, team forms; invest in good DX                                                                                                                                                                                                                                                |

---

### FE-4: Mobile PWA Optimization

|                |                                                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                    |
| **Why now**    | Mobile usage expected to be high for event check-ins; current mobile experience is basic                                                                                                                                                                                          |
| **Depends on** | None, but best after core features (P1+)                                                                                                                                                                                                                                          |
| **Code refs**  | `public/manifest.json` (create), `src/app.tsx`, service worker setup                                                                                                                                                                                                              |
| **Tasks**      | <ul><li>Add PWA manifest with Quadball Canada branding</li><li>Implement service worker for offline support</li><li>Add install prompt for mobile users</li><li>Optimize touch targets for mobile</li><li>Add pull-to-refresh on dashboard</li><li>Test on real devices</li></ul> |
| **Thoughts**   | Vite has PWA plugin; focus on offline-first for event days with poor connectivity                                                                                                                                                                                                 |

---

### FE-5: Loading & Error States Polish

|                |                                                                                                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                                                                                                                                               |
| **Why now**    | Current error handling is basic; need consistent UX across app                                                                                                                                                                                                                                                               |
| **Depends on** | None                                                                                                                                                                                                                                                                                                                         |
| **Code refs**  | `src/components/DefaultCatchBoundary.tsx`, existing components                                                                                                                                                                                                                                                               |
| **Tasks**      | <ul><li>Create consistent error boundary UI with retry actions</li><li>Add skeleton loaders for all data-fetching components</li><li>Create toast/notification system for success/error feedback</li><li>Add optimistic updates for better perceived performance</li><li>Implement retry logic for failed requests</li></ul> |
| **Thoughts**   | Can use Sonner for toasts; skeleton loaders improve perceived performance significantly                                                                                                                                                                                                                                      |

---

## P1 - Foundation & Production Readiness

### ❌ P1-1: Real Square checkout & webhook handler

|                |                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                     |
| **Why now**    | Turn fake flow into production-ready; blockers for any payment processing.                                                                         |
| **Depends on** | P0-3, P0-4                                                                                                                                         |
| **Code refs**  | Add `src/lib/payments/square.ts`, `src/routes/api/webhooks/square.ts` (see integration docs)                                                       |
| **Tasks**      | Implement Square SDK client, environment-driven keys, idempotent webhook handler (upsert payment, mark membership paid). Add signature validation. |
| **Thoughts**   | Follow the pattern in docs, reuse rate-limit util for webhook bursts.                                                                              |

---

### ❌ P1-2: SendGrid transactional email scaffolding

|                |                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ❌ Not Started                                                                                                                                                                       |
| **Why now**    | Users need confirmation email after membership purchase; also foundation for later comms.                                                                                            |
| **Depends on** | P1-1 (so we can send after payment succeeds)                                                                                                                                         |
| **Code refs**  | `docs/quadball-plan/integrations/README.md` (SendGrid)                                                                                                                               |
| **Tasks**      | <ul><li>Create typed wrapper `src/lib/email/sendgrid.ts`.</li><li>Add basic template "Membership purchase receipt".</li><li>Call inside membership confirmation server fn.</li></ul> |

---

### ❌ P1-3: Team entity MVP (DB, server functions, UI list)

|                |                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                                                                     |
| **Why now**    | Teams are prerequisite for event registration.                                                                                                                                                     |
| **Depends on** | P0 slice (so only members can create teams).                                                                                                                                                       |
| **Code refs**  | `docs/quadball-plan/database/schema-overview.md` (Team System)                                                                                                                                     |
| **Tasks**      | <ul><li>Add `teams`, `team_members` tables.</li><li>Server functions `createTeam`, `getTeam`, `listTeams`.</li><li>UI → simple page inside dashboard to create team & list user's teams.</li></ul> |

---

### 🚧 P1-4: Global auth + API rate-limit middleware wiring

|                |                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **Status**     | 🚧 Partially Complete (utility exists, not wired up)                                                   |
| **Why now**    | Rate-limit util exists but no middleware; must protect login / membership endpoints before prod tests. |
| **Depends on** | none (parallel)                                                                                        |
| **Code refs**  | `src/lib/security/middleware/rate-limit.ts`                                                            |
| **Tasks**      | Create middleware registered in auth routes and soon-to-be API mutations; throw 429 with JSON error.   |

---

## P2 - Enhanced Features

### ❌ P2-1: Event entity schema & list (no registration yet)

|                |                                                                                    |
| -------------- | ---------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started (UI components exist)                                               |
| **Why now**    | Stakeholders can start creating draft tournaments while payment UI is stabilizing. |
| **Depends on** | P1-3 (teams not strictly required for listing but will be for registration).       |
| **Code refs**  | `docs/quadball-plan/database/schema-overview.md` Event section                     |
| **Tasks**      | Add `events` table, `listEvents` query; public `/events` route with cards.         |

---

### ❌ P2-2: TanStack Form hook adoption sweep

|                |                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Status**     | ❌ Not Started                                                                                               |
| **Why now**    | Only the onboarding/profile form uses the hook; bring login/signup to same pattern and document conventions. |
| **Depends on** | P0-2 (proof of concept)                                                                                      |
| **Code refs**  | `.cursor/rules/form-rule.mdc`, `src/lib/form.ts`, existing auth components                                   |
| **Tasks**      | Refactor `LoginForm`, `SignupForm` to `useAppForm`. Remove prop drilling, ensure type inference.             |

---

### ❌ P2-3: Admin "Memberships" report page

|                |                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | ❌ Not Started                                                                                                                                    |
| **Why now**    | Finance team needs ability to see who paid; now that membership flow live.                                                                        |
| **Depends on** | P1-1, P1-2                                                                                                                                        |
| **Code refs**  | `docs/project-brief.md` Reporting section                                                                                                         |
| **Tasks**      | <ul><li>Add RBAC check (`global_admin`) in server fn.</li><li>DataTable component (planned in UI guide) for roster.</li><li>CSV export.</li></ul> |

---

## P3 - Future Roadmap

Future roadmap (outline, not fully specced tickets yet):

- **Team roster management (add players, invitations)**
- **Event registration flow (team & individual)**
- **E-transfer payment alternative**
- **Cloudinary media upload**
- **Social feed embeds**
- **Mobile PWA optimizations**

---

## Cross-Cutting Notes

- **Migrations** – Use _separate numbered_ Drizzle SQL files, zero-downtime pattern from docs.
- **Docs** – Every ticket touching schema or flows must update `/docs/quadball-plan/*` in same PR to keep Single-Source-of-Truth promise.
- **Testing** – All server functions get Vitest unit tests; UI gets RTL tests with mocks; happy path Cypress E2E can wait until after P1.
- **Feature flags** – Square "live" vs "sandbox" via env var (`SQUARE_ENV=live|test`) to avoid accidental charges.

This backlog should give the team **one clear story at a time**, deliver tangible product value after each P0 ticket, and keep architectural risk low by exercising each new layer (DB → server fn → form → UI → test) in small slices.
