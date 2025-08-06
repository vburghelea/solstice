## Gemini Added Memories

- **Forms Documentation (docs/FORMS.md):**
- **Location of Form Components:** `src/components/form-fields/` (e.g., `ValidatedInput`, `ValidatedSelect`, `FormSubmitButton`).
- **Validation Strategy:** Prefer Zod schemas for runtime validation and type inference. Avoid inline validation.
- **Server Function Validation:** Use `.validator(schema.parse)` for server functions.
- **Best Practices:** Schema-first validation, consistent error handling, loading state management, accessibility, performance optimization (debouncing).
- **Migration:** Guide provided for migrating from `useState` to TanStack Form.

**Security Configuration (docs/SECURITY.md):**

- **Layers of Security:** Security Headers (Netlify Edge Functions), Secure Cookie Configuration (Better Auth), Rate Limiting, Password Validation, Content Security Policy (CSP).
- **Security Headers:** CSP (nonce-based), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, X-XSS-Protection, Permissions-Policy, Strict-Transport-Security.
- **Cookie Configuration:** `secure: true`, `sameSite: "lax"`, `httpOnly: true`.
- **Rate Limiting:** Configured for auth (5 req/15 min) and API (100 req/15 min) endpoints.
- **Password Requirements:** Min 8 chars, requires uppercase, lowercase, numbers, special chars.
- **CSP:** Nonce-based for inline scripts, allows specific external resources, blocks unsafe inline styles.
- **Environment Variables:** `COOKIE_DOMAIN`, `OAUTH_ALLOWED_DOMAINS`.
- **Development vs. Production:** Differences in cookie security, email verification, CSP.

**TanStack Start Best Practices (docs/TANSTACK-START-BEST-PRACTICES.md):**

- **Server Functions:** Always use Zod validation with `.validator(schema.parse)` for runtime safety, better error messages, and type inference. Avoid direct type assertions.
- **Type Safety:** Create proper type definitions for Drizzle ORM's `jsonb` fields. Define typed error responses.
- **File Organization:** Organize server functions by feature (e.g., `teams.schemas.ts`, `teams.queries.ts`, `teams.mutations.ts`).
- **Common Pitfalls:** Nested data in update operations, matching call structure to schema, clean imports.
- **Pre-commit Checks:** `pnpm lint`, `pnpm check-types`, `pnpm test` must pass.

**Authentication Custom Fields (docs/auth-custom-fields.md):**

- **Challenge:** Better Auth session returns limited user fields.
- **Solution:** Extend user table in `src/db/schema/auth.schema.ts` with custom fields (e.g., `profileComplete`, `gender`, `pronouns`). Define `ExtendedUser` type in `src/lib/auth/types.ts`. Fetch complete user data via `getCurrentUser` server function in `src/features/auth/auth.queries.ts`.
- **Usage:** Access custom fields through route context.

**Code Improvements (docs/code-improvements.md):**

- **`process is not defined` Error:** Caused by server-only code accessing `process.env` in client bundle. Resolved by Vite `define` solution in `vite.config.ts`.
- **CSP Implementation:** Nonce-based solution implemented in `src/server.ts` and `src/router.tsx`.
- **Auth Client Facade:** Cleaner API for authentication (`auth.signIn.email()` instead of `authClient.signIn.email()`).
- **Theme Management:** Centralized `useTheme` hook in `src/shared/hooks/useTheme`.
- **Centralized Icon Management:** Icons imported from `src/shared/ui/icons`.
- **Authentication Route Guards:** Declarative guards using `useAuthGuard` in `src/features/auth/useAuthGuard.tsx`.

**Database Connection Guide (docs/database-connections.md):**

- **Connection Types:** Pooled (`pooledDb`) for serverless functions/API routes, Unpooled (`unpooledDb`) for migrations/long operations.
- **Automatic Selection:** Default `db` export automatically selects based on environment.
- **Environment Variables:** `NETLIFY_DATABASE_URL`, `NETLIFY_DATABASE_URL_UNPOOLED` (Netlify auto), `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (manual), `DATABASE_POOLED_URL`, `DATABASE_UNPOOLED_URL` (custom override).
- **Best Practices:** Use default `db` for most cases, explicitly use `pooledDb` in serverless functions, `unpooledDb` for migrations.

**Development Backlog (docs/development-backlog.md):**

- **Completed Work:** Roundup Games Design System, Profile Schema Extension, Complete Profile Onboarding Flow.
- **High Priority Features:** Events Feature Frontend Implementation, Integrate Roles System with Admin Access.
- **Next Up:** UI Component Consolidation, Members Directory Feature, Team Invitations Flow.
- **Future Roadmap:** Event Registration Payment, E-transfer, Image Uploads, Mobile PWA, Public Content Pages, Advanced Permissions, Bulk Operations, Analytics Dashboard.
- **Cross-Cutting Notes:** All new features require E2E tests, documentation updates, Zod validation for server functions, shadcn components installed to `src/components/ui`, rate limiting with Pacer.

**E2E Auth Validation Updates (docs/e2e-auth-validation-updates.md):**

- **Updates:** Tests updated to match TanStack Form validation behavior (error messages) instead of HTML5 validation.
- **Password Mismatch:** Added timeout for TanStack Form validation.
- **Email Format:** Verifies invalid email prevents navigation.
- **Server-Side Validation:** Separate file for tests requiring API responses.
- **Search Functionality:** Debounced search requires ~2 seconds timeout.
- **UI Structure:** Differences from test expectations (e.g., no `.transition-shadow` classes).

**E2E Testing Issues (docs/e2e-testing-issues.md):**

- **Comprehensive Patch:** Applied fixes for logout, WebKit navigation, login error handling, Firefox slowMo.
- **All Issues Fixed:** Logout tests, Firefox NS_BINDING_ABORTED, navigation issues with SafeLink, profile/team management, login error display, WebKit navigation.
- **Key Fixes:** Better Auth's `signOut()`, try-catch for login errors, SafeLink for WebKit, 50ms slowMo for Firefox.
- **Root Cause Analysis:** TanStack Router + WebKit incompatibility, logout state management, browser timing differences, error state rendering.
- **Recommended Changes:** Server-side logout, loading states, WebKit-compatible navigation component (`SafeLink`), proper error boundaries, navigation guards.

**E2E Testing Workarounds (docs/e2e-testing-workarounds.md):**

- **Firefox:** `slowMo: 100` to prevent `NS_BINDING_ABORTED` errors.
- **WebKit/Safari:** `SafeLink` component (uses native `<a>` tags, handles navigation with `useNavigate()`, detects active states).
- **Better Auth `signOut`:** Use documented method with `fetchOptions` for consistent behavior.
- **Login Error Handling:** Try-catch wrapper around auth operations.

**Project Brief (docs/project-brief.md):**

- **Overview:** Comprehensive platform for tabletop/board game enthusiasts to organize sessions, events, memberships, teams.
- **User Roles:** Organization Admins (Global, Event Coordinators), Team Logins, Individual Logins.
- **Features:** Event Management, Export/Reporting, Membership Renewal, Landing Page, Payment Integration, Notifications, Integrations (Social Media, Google Forms/Calendar).
- **Security/Privacy:** GDPR compliance, secure handling of sensitive data.
- **Goals:** User-friendly, comprehensive functionality, customizable, flexible, secure.
- **Brand Guidelines:** Color Palette (Red, Neutrals), Typography (Oswald, Montserrat, Roboto).

**Rate Limiting (docs/rate-limiting-with-pacer.md, docs/rate-limiting.md):**

- **Tool:** TanStack Pacer for client-side rate limiting.
- **Types:** `auth` (5 req/15 min), `api` (100 req/1 min), `search` (10 req/10 sec), `mutation` (20 req/1 min).
- **Usage:** `useRateLimitedServerFn` hook to wrap server functions. `useRateLimitedSearch` for search operations.
- **Benefits:** Prevents overwhelming server, immediate user feedback, reduced server load.
- **Why Client-Side Only:** Effective for serverless deployments (no shared state needed, immediate feedback, reduced server load).

**Server Functions Guide (docs/roundup-games-plan/api/server-functions.md):**

- **Overview:** Type-safe communication between client and server, wrapped with `serverOnly()`.
- **Access:** Full access to DB, auth state, external APIs, server-side env vars.
- **Use Cases:** Data fetching (`.queries.ts`), data mutation (`.mutations.ts`), auth logic, edge middleware, page data (route loaders).
- **Creation:** Organize in feature directories, handle authentication/authorization, implement error handling (Zod validation recommended).
- **Calling:** Use TanStack Query to call server functions from client components.
- **Best Practices:** File organization, type safety, authentication patterns, database transactions, caching strategy (React Query).

**Architecture Overview (docs/roundup-games-plan/architecture/overview.md):**

- **System Architecture:** Client Layer (Browser -> TanStack Router -> React Components -> TanStack Query -> Server Functions) -> Server Layer (TanStack Start -> Better Auth -> Business Logic -> Drizzle ORM -> PostgreSQL).
- **Technology Choices:** TanStack Start, Better Auth, Drizzle ORM, Neon PostgreSQL, React Query, Tailwind CSS + shadcn/ui.
- **Core Principles:** Feature-Based Organization, Type Safety Everywhere, Security First, Performance Optimization.
- **Deployment:** Local (Vite, Netlify Dev, Docker), Production (Netlify, Neon).

**Database Schema & Relationships (docs/roundup-games-plan/database/schema-overview.md):**

- **Overview:** PostgreSQL with Drizzle ORM.
- **Implemented:** Better Auth tables (`users`, `sessions`, `accounts`).
- **Future Entities:** RBAC, Membership, Team, Event, Payment, Audit, Game Systems.
- **Design Principles:** Extensibility via JSONB, Audit Trail, Soft Deletes, Optimistic Concurrency.
- **Performance:** Current and future indexes.
- **Data Integrity:** Current and future constraints.
- **Migration Strategy:** Drizzle for schema changes (`pnpm db:generate`, `pnpm db:push`).
- **Security:** Sessions expire, passwords hashed, OAuth tokens secure. Future: Sensitive data encryption, Row-Level Security.

**Roundup Games Platform (docs/roundup-games-plan/index.md):**

- **Current Features:** Authentication, User Profiles, Dashboard, Theme Support.
- **In Progress:** Teams.
- **Planned:** Events, Payments, Email, Analytics.
- **Project Documentation:** Architecture, Server Functions, Database Schema, Component Guide, Roadmap.

**External Integrations (docs/roundup-games-plan/integrations/README.md):**

- **SendGrid Email:** Planned for transactional emails (welcome, receipts, password resets). Configured via `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`.
- **Cloudinary Media Storage:** Planned for team logos, event photos, user avatars, documents. Configured via `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Social Media APIs:** Planned for Instagram (embed posts), Facebook (event cross-posting).
- **Development Guidelines:** Add env vars, create service wrapper, webhook handlers, documentation.
- **Security Best Practices:** Never commit API keys, validate webhook signatures, rate limiting, error handling, logging.

**UI & Component Guide (docs/roundup-games-plan/ui-flows/component-guide.md):**

- **Component System:** shadcn/ui for foundational components.
- **Project-Specific Components:** `ValidatedInput`, `FormSubmitButton`, `ThemeToggle`.
- **Component Patterns:** Consistent form components, loading states (skeletons, inline loaders), error states.
- **Styling Conventions:** Tailwind CSS, `class-variance-authority` for variants.
- **Accessibility:** Semantic HTML, ARIA labels, keyboard navigation, focus indicators, error announcements.
- **Future Components:** DataTable, DatePicker, FileUpload, RichTextEditor, StatsCard.
- **Development Guidelines:** Check existing components, start with shadcn/ui, naming conventions, TypeScript types, test accessibility.

**User Journeys (docs/roundup-games-plan/ui-flows/user-journeys.md):**

- **Core User Types:** Players, Team Managers, Event Coordinators, Administrators.
- **Primary Journeys:** New Member Onboarding (Implemented), Team Registration for Event (Planned), Event Creation and Management (Planned), Member Renewal (Planned).
- **Supporting Flows:** Password Reset (Planned), Team Roster Management (Planned), Profile Updates (Implemented).
- **Error Handling:** Authentication errors, permission errors, payment errors, validation errors.
- **Mobile Considerations:** Optimized for mobile (touch-friendly, progressive forms, simplified navigation, offline support).
- **Analytics Events:** Track registration, membership, event, profile completion.

**SendGrid Email Integration (docs/sendgrid-email-integration.md):**

- **Status:** Complete (January 2025).
- **Environment Variables:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`.
- **Code Architecture:** Service pattern with environment-based switching (`sendgrid.ts`, `sendgrid-service.ts`, `mock-email-service.ts`).
- **Email Templates:** Membership Purchase Receipt, Welcome Email, Password Reset, Team Invitation, Event Confirmation.
- **Development Mode:** Mock service logs to console, no actual emails sent.
- **Best Practices:** Always use templates, include text version, test in development, monitor delivery, handle failures gracefully.

**State Management Recommendations (docs/state-management-recommendations.md):**

- **Current Strengths:** Minimal state, React Query for server state, calculated values, state proximity.
- **Improvements:** Custom hooks (`useAuthForm`, `useLocalStorage`, `useFocusOnMount`, `useAsyncState`, `useProfileFormReducer`), Context for cross-cutting concerns (`ThemeContext`).
- **Recommendations:** Group related state, avoid contradictions/redundancy.
- **Tool Usage:** `useState` (simple), `useReducer` (complex related state), `Context` (cross-cutting), `React Query` (server state).
- **Anti-Patterns:** Don't sync props to state, don't duplicate server data, don't create deeply nested state, don't store derived state.

**TanStack Start (docs/tanstack-start.md):**

- **Overview:** Full-stack React framework with TanStack Router, SSR, streaming, server functions.
- **Dependencies:** TanStack Router, Vite.
- **Router:** `src/router.tsx` dictates behavior, `routeTree.gen.ts` auto-generated for type safety.
- **Server Entry Point:** `src/server.ts` for SSR-related work.
- **Client Entry Point:** `src/client.tsx` for hydrating client-side JavaScript.
- **Root of Application:** `__root` route (`src/routes/__root.tsx`) for application shell and global logic.
- **Routes:** Defined with `createFileRoute`, code-split, lazy-loaded, critical data fetching via `loader`.
- **Navigation:** `Link` component, `useNavigate` hook, `useRouter` hook.
- **Server Functions (RPCs):** Created with `createServerFn`, run only on server, can be called from client/server, access request context, environment variables.
- **Mutations:** Use server functions, invalidate data on client (`router.invalidate()` or `queryClient.invalidateQueries()`).
- **Data Loading:** `loader` function in routes, isomorphic, cached on client.
- **Server Function Configuration:** `method` (`GET`/`POST`), `response` (`data`/`full`/`raw`).
- **Input Validation:** `validator` method (can use Zod).
- **Context:** Access server request context using utilities from `@tanstack/react-start/server`.
- **Returning Values:** Primitives, JSON-serializable objects, redirect errors, notFound errors, raw Response objects.
- **Error Handling:** Server functions throw errors (serialized to client with 500 status).
- **Cancellation:** Client-side server function calls can be cancelled via `AbortSignal`.
- **Calling Server Functions:** From route lifecycles, hooks/components (`useServerFn`), other server functions.
- **No-JS Server Functions:** Form submission with `action={yourFn.url}`.
- **Static Server Functions:** Executed at build time, cached as static assets (`type: 'static'`).
- **Middleware:** Customize server function behavior (`createMiddleware`), for authentication, authorization, logging, context. Global middleware (`registerGlobalMiddleware`) and server function specific middleware.

**Teams Feature Documentation (docs/teams-feature.md):**

- **Status:** Complete (January 2025).
- **Database:** `teams`, `team_members` tables.
- **Features:** Create, manage, browse teams; member invitations and roles (`captain`, `coach`, `player`, `substitute`).
- **Server Functions:** Queries (`getTeam`, `listTeams`, `getTeamMembers`, `searchTeams`, `canUserManageTeam`), Mutations (`createTeam`, `updateTeam`, `addTeamMember`, `updateTeamMember`, `removeTeamMember`, `deactivateTeam`).
- **UI Components:** Routes for listing, creating, browsing, managing teams and members.
- **Permissions:** Any authenticated user with complete profile can create teams. Captains/Coaches manage.
- **TypeScript Workaround:** Type assertions (`as any`) due to TanStack Start type inference limitations.

**Teams Feature TypeScript Errors (docs/teams-typescript-errors.md):**

- **Issue:** False positive TypeScript errors due to TanStack Start's server function validator pattern limitations (GitHub Issue #2759).
- **Error Pattern:** "Object literal may only specify known properties, and 'X' does not exist in type 'OptionalFetcherDataOptions<undefined, (data: unknown) => ...>'".
- **Workaround:** Type assertions (`as any`) used temporarily.

**Testing Server Functions in Production (docs/testing-server-functions.md):**

- **Approaches:** Health Check Endpoints, Integration Tests (Playwright), Production Monitoring (APM like Sentry, New Relic), Synthetic Monitoring, Manual Testing Checklist, Database Query Monitoring, Load Testing (k6, Artillery), Feature Flags, Rollback Strategy, Production Debugging.
- **Key Recommendations:** Health checks, structured logging, monitor key metrics, test with production-like data, rollback plans, feature flags, document everything.

**UI Design Prompt (docs/ui-design-prompt.md):**

- **Project Summary:** Comprehensive registration and events management platform.
- **User Types:** Organization Admins, Team Logins, Individual Players.
- **Core Features:** Landing Page, User Dashboards (Admin, Team, Individual), Event Management Interface, Registration Flow.
- **UX Requirements:** Mobile-responsive, intuitive, clear visual hierarchy, accessibility, fast loading.
- **Brand Guidelines:** Color Palette (Red, Neutrals), Typography (Oswald, Montserrat, Roboto).
- **Design Priorities:** User-friendly, professional, efficient, flexible, secure.
- **Key UI Components:** Event cards, forms with validation, payment interfaces, user role management, data export/reporting, notifications, profile forms, team rosters, analytics dashboards.

**User Roles, Tags, and Permissions V2 (docs/user-roles-and-permissions-v2.md):**

- **System:** Hybrid of Roles (access control) and Tags (categorization). Membership Status tracked separately.
- **Roles:** Platform Admin (Global), Games Admin (Organization), Team Admin (Team-specific), Event Admin (Event-specific). Users can have multiple roles.
- **Tags:** Descriptive labels for searching/filtering (Official, Team, Player, Custom).
- **Database Schema:** `roles`, `user_roles`, `tags`, `user_tags` tables. Includes seed data.
- **Implementation:** Types/Interfaces (`Role`, `UserRole`, `Tag`, `UserTag`), `PermissionService` (e.g., `canUserAccessTeam`, `isGlobalAdmin`), `TagService` (e.g., `getUserTags`, `findUsersByTags`, `assignTag`).
- **Updated Auth Context:** `getCurrentUser` includes roles, tags, and active membership.
- **Search Implementation:** `searchUsers` server function filters by tags, roles, membership, team.
- **Usage Examples:** Assigning roles, checking permissions, managing tags, filtering UI elements.
- **Benefits:** Clear separation, flexible scoping, searchability, membership independence, extensibility, performance.
- **Migration Strategy:** Phase 1 (roles), Phase 2 (tags), Phase 3 (search/filtering), Phase 4 (admin UI), Phase 5 (automated tag management).
- **Immediate Tasks:** Create roles schema, update schema index, create `PermissionService`, update `getCurrentUser`, hide Reports tab, add role guards, create seed script, write tests for `PermissionService`.
