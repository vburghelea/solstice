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

### HP-1: Events Feature Frontend Implementation

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**     | ✅ Completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Priority**   | 🔴 Highest (Core feature missing)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Why now**    | Complete backend exists but no UI. This is the biggest missing piece of the app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Depends on** | Events backend (✅ complete)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Code refs**  | `src/routes/dashboard/events.tsx`, `src/features/events/*`, `src/routes/events/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Notes**      | Dashboard events list, creation form, management console, public event detail, and registration flow are live (`src/routes/dashboard/events/index.tsx`, `src/routes/events/$slug.tsx`, `src/routes/events/$slug.register.tsx`, `src/routes/dashboard/events/$eventId.manage.tsx`). Need to extend E2E coverage for the new workflows.                                                                                                                                                                                                                              |
| **Tasks**      | <ul><li>✅ Replace "Feature coming soon" placeholder with event listing</li><li>✅ Create EventList component using listEvents query</li><li>✅ Add EventCreateForm for organizers</li><li>✅ Build public event detail page at /events/[slug]</li><li>✅ Implement event registration flow (team/individual)</li><li>✅ Add event management dashboard for organizers</li><li>✅ Create EventCard component for grid display</li><li>✅ Add filtering/sorting for event types and dates</li><li>⏳ Write end-to-end coverage for happy-path event flows</li></ul> |

### HP-2: Integrate Roles System with Admin Access

|                |                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | 🚧 In Progress                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Priority**   | 🟠 High (Security/Scalability)                                                                                                                                                                                                                                                                                                                                                                                          |
| **Why now**    | Currently using hardcoded email list for admin access. Robust roles system exists but unused.                                                                                                                                                                                                                                                                                                                           |
| **Depends on** | Roles schema (✅ complete), PermissionService (✅ complete)                                                                                                                                                                                                                                                                                                                                                             |
| **Code refs**  | `src/lib/auth/utils/admin-check.ts`, `src/features/roles/permission.service.ts`                                                                                                                                                                                                                                                                                                                                         |
| **Tasks**      | <ul><li>✅ Refactor isAdmin to use PermissionService.isGlobalAdmin(userId)</li><li>✅ Update requireAdmin to accept userId instead of email</li><li>✅ Update all call sites of requireAdmin</li><li>Create admin role seed script</li><li>Add UI for role management in admin dashboard</li><li>Test role-based access in membership reports</li><li>Remove legacy hardcoded email list references from docs</li></ul> |

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

|              |                                                                                                                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**   | ❌ Not Started                                                                                                                                                                                                                                                                                  |
| **Priority** | 🟢 Medium (Code quality)                                                                                                                                                                                                                                                                        |
| **Issue**    | Duplicate UI components exist in both `src/components/ui` and `src/shared/ui`                                                                                                                                                                                                                   |
| **Solution** | Keep components in `src/components/ui` where shadcn installs them by default                                                                                                                                                                                                                    |
| **Tasks**    | <ul><li>Move unique components from `src/shared/ui` to `src/components/ui`</li><li>Update all imports to use `~/components/ui`</li><li>Delete `src/shared/ui` directory</li><li>Update CLAUDE.md to reflect single UI location</li><li>Verify `npx shadcn@latest add` works correctly</li></ul> |

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
