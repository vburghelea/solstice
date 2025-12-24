# Solstice Codebase Guide

Generated: 2025-12-24T21:05:08Z (UTC)

Per-file inventory of the codebase. Every code file in the scope below is listed.

## Coverage Scope

- Included extensions: .ts, .tsx, .js, .mjs, .cjs, .sh, .d.ts
- Excluded directories: .git, .next, .output, .sst, .tanstack, .turbo, coverage, dev-dist, dist, e2e-target-auth-flow, e2e-test-results, logs, node_modules, playwright-report, repomix-bundles, test-results
- Code file counts: .d.ts=7, .js=3, .mjs=5, .sh=8, .ts=250, .tsx=123
- Total code files: 396

## Updating This File

- Run: `node scripts/update-code-guide.mjs`.
- Review `CODE_GUIDE.md` for expected changes and commit updates.
- Adjust `excludeDirs` or `codeExts` in `scripts/update-code-guide.mjs` if scope changes.

## Quick Reference

- Stack: TanStack Start (React) + Drizzle ORM + PostgreSQL + Better Auth + Tailwind/shadcn.
- Deployment: SST on AWS Lambda, CloudFront, RDS Postgres (ca-central-1).
- Frontend: Vite, React Query, TanStack Router, PWA via Vite PWA plugin.
- Auth: Better Auth with Google OAuth + 2FA, Drizzle adapter.
- Payments: Square (sandbox/production) with mock fallback.

## Key Patterns (Observed)

- Server functions use createServerFn; most use Zod inputValidator, but a few files do not (listed in Tech Debt).
- Server-only dependencies are dynamically imported or wrapped to avoid client bundle pollution.
- Role checks centralized in PermissionService (roles feature) + auth guards in src/lib/auth/guards.
- Audit log uses hash chaining and PII redaction in src/lib/audit/index.ts.
- Notification emails are sent via SES with retry; in-app notifications are persisted first.

## Root Configuration and Tooling

- `drizzle.config.ts` - Drizzle Kit config for migrations and DB naming.
- `eslint.config.js` - ESLint flat config (TypeScript/React/TanStack rules).
- `playwright.config.ts` - Playwright config for E2E projects and reporters.
- `sst-env.d.ts` - SST environment type declarations for the app.
- `sst.config.ts` - SST infrastructure definition (Lambda, RDS, CloudFront, alarms, secrets).
- `vite.config.ts` - Vite config with TanStack Start, Nitro adapter, PWA, React compiler, and browser shims.
- `vitest.config.ts` - Vitest config for unit/integration tests (jsdom, RTL).

## .husky (Generated/Tooling)

- `.husky/_/husky.sh` - Husky hook bootstrap script used by Git hooks.

## .netlify (Generated/Tooling)

- `.netlify/v1/functions/server.mjs` - Netlify server handler that re-exports the built server fetch entry.

## .nitro (Generated/Tooling)

- `.nitro/types/nitro-config.d.ts` - Generated Nitro type definitions.
- `.nitro/types/nitro-imports.d.ts` - Generated Nitro type definitions.
- `.nitro/types/nitro-routes.d.ts` - Generated Nitro type definitions.
- `.nitro/types/nitro.d.ts` - Generated Nitro type definitions.

## Repomix Config Scripts

- `repomix-configs/app-1-router-types.sh` - Repomix helper script: App 1 Router Types.
- `repomix-configs/doc-1-alignment.sh` - Repomix helper script: Doc 1 Alignment.
- `repomix-configs/evt-1-cancellation.sh` - Repomix helper script: Evt 1 Cancellation.
- `repomix-configs/evt-2-pricing-tests.sh` - Repomix helper script: Evt 2 Pricing Tests.
- `repomix-configs/evt-3-utilities.sh` - Repomix helper script: Evt 3 Utilities.
- `repomix-configs/test-all-configs.sh` - Repomix helper script: Test All Configs.

## Scripts

- `scripts/check-db-connections.ts` - CLI: list DB connections, optionally terminate idle, show limits.
- `scripts/check-users.ts` - CLI: list users, credential vs OAuth, and recent activity.
- `scripts/clean-test-users.ts` - CLI: remove E2E test users/teams from the database.
- `scripts/generate-auth-secret.js` - CLI: generate a Better Auth secret.
- `scripts/generate-erd.js` - Generate ERD diagrams from mermaid definitions.
- `scripts/get-square-location.ts` - CLI: fetch Square sandbox location IDs.
- `scripts/seed-e2e-data.ts` - Seed database with E2E test data/users.
- `scripts/seed-global-admins.ts` - Seed global admin users in the database.
- `scripts/test-auth.ts` - CLI: validate Better Auth config and env wiring.
- `scripts/test-db-connection.ts` - CLI: validate pooled/unpooled DB connections.
- `scripts/test-routing.ts` - Playwright smoke test for login and teams navigation.
- `scripts/test-security-headers.sh` - Shell script: check security headers via curl.
- `scripts/test-server-auth.ts` - CLI: exercise server-side auth session retrieval.
- `scripts/test-square-sandbox.ts` - CLI: validate Square sandbox APIs (locations/catalog/payments).
- `scripts/update-code-guide.mjs` - Generator for CODE_GUIDE.md.

## E2E (Playwright)

- `e2e/auth.setup.ts` - Playwright auth setup that logs in and writes storage state.
- `e2e/fixtures/auth-fixtures.ts` - E2E fixture: Auth Fixtures.
- `e2e/fixtures/auth.ts` - E2E fixture: Auth.
- `e2e/fixtures/base.ts` - E2E fixture: Base.
- `e2e/helpers/auth.ts` - E2E helper: Auth.
- `e2e/helpers/constants.ts` - E2E helper: Constants.
- `e2e/helpers/global-setup.ts` - E2E helper: Global Setup.
- `e2e/helpers/setup.ts` - E2E helper: Setup.
- `e2e/helpers/test-data-reset.ts` - E2E helper: Test Data Reset.
- `e2e/tests/authenticated/dashboard.shared.spec.ts` - Authenticated E2E test: Dashboard.
- `e2e/tests/authenticated/events-flow.auth.spec.ts` - Authenticated E2E test: Events Flow.
- `e2e/tests/authenticated/file-upload-validation.auth.spec.ts` - Authenticated E2E test: File Upload Validation.
- `e2e/tests/authenticated/logout.shared.spec.ts` - Authenticated E2E test: Logout.
- `e2e/tests/authenticated/members-directory.auth.spec.ts` - Authenticated E2E test: Members Directory.
- `e2e/tests/authenticated/membership-no-active.auth.spec.ts` - Authenticated E2E test: Membership No Active.
- `e2e/tests/authenticated/membership.auth.spec.ts` - Authenticated E2E test: Membership.
- `e2e/tests/authenticated/navigation.shared.spec.ts` - Authenticated E2E test: Navigation.
- `e2e/tests/authenticated/profile-edit.auth.spec.ts` - Authenticated E2E test: Profile Edit.
- `e2e/tests/authenticated/profile.auth.spec.ts` - Authenticated E2E test: Profile.
- `e2e/tests/authenticated/report-export.auth.spec.ts` - Authenticated E2E test: Report Export.
- `e2e/tests/authenticated/roles-management.auth.spec.ts` - Authenticated E2E test: Roles Management.
- `e2e/tests/authenticated/settings.auth.spec.ts` - Authenticated E2E test: Settings.
- `e2e/tests/authenticated/sin-admin-access.auth.spec.ts` - Authenticated E2E test: Sin Admin Access.
- `e2e/tests/authenticated/team-browse.auth.spec.ts` - Authenticated E2E test: Team Browse.
- `e2e/tests/authenticated/team-members.auth.spec.ts` - Authenticated E2E test: Team Members.
- `e2e/tests/authenticated/teams-create-no-conflict.auth.spec.ts` - Authenticated E2E test: Teams Create No Conflict.
- `e2e/tests/authenticated/teams.auth.spec.ts` - Authenticated E2E test: Teams.
- `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts` - Unauthenticated E2E test: Auth Flow.
- `e2e/tests/unauthenticated/auth-pages.unauth.spec.ts` - Unauthenticated E2E test: Auth Pages.
- `e2e/tests/unauthenticated/auth-server-validation.unauth.spec.ts` - Unauthenticated E2E test: Auth Server Validation.
- `e2e/tests/unauthenticated/auth-validation.unauth.spec.ts` - Unauthenticated E2E test: Auth Validation.
- `e2e/utils/api-auth.ts` - E2E utility: Api Auth.
- `e2e/utils/auth-verify.ts` - E2E utility: Auth Verify.
- `e2e/utils/auth.ts` - E2E utility: Auth.
- `e2e/utils/cleanup.ts` - E2E utility: Cleanup.
- `e2e/utils/membership-cleanup.ts` - E2E utility: Membership Cleanup.
- `e2e/utils/test-data.ts` - E2E utility: Test Data.

## src (Application Code)

### Top-level entries

- `src/client.tsx` - Client entry: hydrates Start app, attaches router diagnostics, exposes **ROUTER** in dev.
- `src/routeTree.gen.ts` - Auto-generated route tree from file-based routing (do not edit).
- `src/router.tsx` - Router factory: QueryClient integration + CSP nonce handling + SSR query integration.
- `src/server.ts` - Server entry: createStartHandler with defaultStreamHandler.
- `src/start.ts` - Start instance config: requestId + orgContext middleware for server functions.
- `src/vite-env.d.ts` - Type declarations.

### src/app

- `src/app/providers.tsx` - React providers: QueryClientProvider + StepUpProvider.

### src/components

- `src/components/DefaultCatchBoundary.tsx` - React component: DefaultCatchBoundary.
- `src/components/NotFound.tsx` - React component: NotFound.
- `src/components/ThemeToggle.tsx` - React component: ThemeToggle.
- `src/components/form-fields/FormSubmitButton.tsx` - React component: FormSubmitButton.
- `src/components/form-fields/ValidatedCheckbox.tsx` - React component: ValidatedCheckbox.
- `src/components/form-fields/ValidatedColorPicker.tsx` - React component: ValidatedColorPicker.
- `src/components/form-fields/ValidatedCombobox.tsx` - React component: ValidatedCombobox.
- `src/components/form-fields/ValidatedDatePicker.tsx` - React component: ValidatedDatePicker.
- `src/components/form-fields/ValidatedFileUpload.tsx` - React component: ValidatedFileUpload.
- `src/components/form-fields/ValidatedInput.tsx` - React component: ValidatedInput.
- `src/components/form-fields/ValidatedPhoneInput.tsx` - React component: ValidatedPhoneInput.
- `src/components/form-fields/ValidatedSelect.tsx` - React component: ValidatedSelect.
- `src/components/form-fields/__tests__/validated-inputs.test.tsx` - Test: Validated Inputs.
- `src/components/ui/SafeLink.tsx` - React component: SafeLink.
- `src/components/ui/TypedLink.tsx` - React component: TypedLink.
- `src/components/ui/admin-sidebar.tsx` - React component: Admin Sidebar.
- `src/components/ui/alert-dialog.tsx` - React component: Alert Dialog.
- `src/components/ui/alert.tsx` - React component: Alert.
- `src/components/ui/avatar.tsx` - React component: Avatar.
- `src/components/ui/badge.tsx` - React component: Badge.
- `src/components/ui/breadcrumbs.tsx` - React component: Breadcrumbs.
- `src/components/ui/button.tsx` - React component: Button.
- `src/components/ui/card.tsx` - React component: Card.
- `src/components/ui/checkbox.tsx` - React component: Checkbox.
- `src/components/ui/command.tsx` - React component: Command.
- `src/components/ui/data-state.tsx` - React component: Data State.
- `src/components/ui/data-table.tsx` - React component: Data Table.
- `src/components/ui/dialog.tsx` - React component: Dialog.
- `src/components/ui/dropdown-menu.tsx` - React component: Dropdown Menu.
- `src/components/ui/icons.tsx` - React component: Icons.
- `src/components/ui/input.tsx` - React component: Input.
- `src/components/ui/label.tsx` - React component: Label.
- `src/components/ui/logo.tsx` - React component: Logo.
- `src/components/ui/mobile-admin-header.tsx` - React component: Mobile Admin Header.
- `src/components/ui/mobile-data-cards.tsx` - React component: Mobile Data Cards.
- `src/components/ui/popover.tsx` - React component: Popover.
- `src/components/ui/radio-group.tsx` - React component: Radio Group.
- `src/components/ui/select.tsx` - React component: Select.
- `src/components/ui/separator.tsx` - React component: Separator.
- `src/components/ui/skeleton.tsx` - React component: Skeleton.
- `src/components/ui/sonner.tsx` - React component: Sonner.
- `src/components/ui/table.tsx` - React component: Table.
- `src/components/ui/tabs.tsx` - React component: Tabs.
- `src/components/ui/textarea.tsx` - React component: Textarea.

### src/cron

- `src/cron/enforce-retention.ts` - Cron job entry: Enforce Retention.
- `src/cron/notification-worker.ts` - Cron job entry: Notification Worker.
- `src/cron/process-notifications.ts` - Cron job entry: Process Notifications.

### src/db

- `src/db/connections.ts` - DB connection manager (pooled/unpooled) and health tracking.
- `src/db/index.ts` - DB entry point: expose db() helper and schema exports.
- `src/db/schema/audit.schema.ts` - Drizzle schema for Audit.
- `src/db/schema/auth.schema.ts` - Drizzle schema for Auth.
- `src/db/schema/events.schema.ts` - Drizzle schema for Events.
- `src/db/schema/forms.schema.ts` - Drizzle schema for Forms.
- `src/db/schema/imports.schema.ts` - Drizzle schema for Imports.
- `src/db/schema/index.ts` - Barrel exports for Schema.
- `src/db/schema/membership.schema.ts` - Drizzle schema for Membership.
- `src/db/schema/notifications.schema.ts` - Drizzle schema for Notifications.
- `src/db/schema/organizations.schema.ts` - Drizzle schema for Organizations.
- `src/db/schema/privacy.schema.ts` - Drizzle schema for Privacy.
- `src/db/schema/reporting.schema.ts` - Drizzle schema for Reporting.
- `src/db/schema/reports.schema.ts` - Drizzle schema for Reports.
- `src/db/schema/roles.schema.ts` - Drizzle schema for Roles.
- `src/db/schema/security.schema.ts` - Drizzle schema for Security.
- `src/db/schema/teams.schema.ts` - Drizzle schema for Teams.
- `src/db/server-helpers.ts` - Server-only DB helpers with dynamic imports.

### src/diagnostics

- `src/diagnostics/routerDiagnostics.ts` - Router diagnostics subscription (dev-only logging).

### src/features (Domain Modules)

#### audit

- `src/features/audit/audit.queries.ts` - Server-side queries for Audit.
- `src/features/audit/audit.schemas.ts` - Zod schemas for Audit.
- `src/features/audit/components/audit-log-table.tsx` - React component: Audit Log Table.

#### auth

- `src/features/auth/__tests__/login-with-router.test.tsx` - Test: Login With Router.
- `src/features/auth/__tests__/login.test.tsx` - Test: Login.
- `src/features/auth/__tests__/signup-with-router.test.tsx` - Test: Signup With Router.
- `src/features/auth/auth.queries.ts` - Server-side queries for Auth.
- `src/features/auth/auth.schemas.ts` - Zod schemas for Auth.
- `src/features/auth/components/login.tsx` - React component: Login.
- `src/features/auth/components/signup.tsx` - React component: Signup.
- `src/features/auth/hooks/useAuth.ts` - React hook: UseAuth.
- `src/features/auth/hooks/useAuthForm.ts` - React hook: UseAuthForm.
- `src/features/auth/index.ts` - Barrel exports for Auth.
- `src/features/auth/mfa/mfa-enrollment.tsx` - Feature module file for Auth.
- `src/features/auth/mfa/mfa-recovery.tsx` - Feature module file for Auth.
- `src/features/auth/mfa/mfa.mutations.ts` - Server-side mutations for Mfa.
- `src/features/auth/step-up.tsx` - Feature module file for Auth.

#### dashboard

- `src/features/dashboard/MemberDashboard.tsx` - Member dashboard view and stats.
- `src/features/dashboard/PublicPortalPage.tsx` - Public portal content for unauthenticated users.
- `src/features/dashboard/index.ts` - Barrel exports for Dashboard.

#### events

- `src/features/events/__tests__/events.base-schemas.test.ts` - Test: Events.Base Schemas.
- `src/features/events/__tests__/events.registration.integration.test.ts` - Test: Events.Registration.Integration.
- `src/features/events/__tests__/events.schemas.test.ts` - Test: Events.Schemas.
- `src/features/events/__tests__/payment-metadata.test.ts` - Test: Payment Metadata.
- `src/features/events/__tests__/registration-pricing.test.ts` - Test: Registration Pricing.
- `src/features/events/components/event-create-form-minimal.tsx` - React component: Event Create Form Minimal.
- `src/features/events/components/event-create-form.tsx` - React component: Event Create Form.
- `src/features/events/components/event-list.tsx` - React component: Event List.
- `src/features/events/events.db-types.ts` - DB-specific type overrides for Events.
- `src/features/events/events.mutations.ts` - Server-side mutations for Events.
- `src/features/events/events.queries.ts` - Server-side queries for Events.
- `src/features/events/events.schemas.ts` - Zod schemas for Events.
- `src/features/events/events.types.ts` - TypeScript types for Events.
- `src/features/events/index.ts` - Feature module file for Events.
- `src/features/events/utils/index.ts` - Barrel exports for Utils.
- `src/features/events/utils/jsonb.ts` - Feature module file for Events.
- `src/features/events/utils/payment-metadata.ts` - Feature module file for Events.
- `src/features/events/utils/pricing.ts` - Feature module file for Events.
- `src/features/events/utils/time.ts` - Feature module file for Events.

#### forms

- `src/features/forms/components/form-builder-shell.tsx` - React component: Form Builder Shell.
- `src/features/forms/forms.mutations.ts` - Server-side mutations for Forms.
- `src/features/forms/forms.queries.ts` - Server-side queries for Forms.
- `src/features/forms/forms.schemas.ts` - Zod schemas for Forms.
- `src/features/forms/forms.utils.ts` - Utilities for Forms.

#### imports

- `src/features/imports/components/import-wizard-shell.tsx` - React component: Import Wizard Shell.
- `src/features/imports/imports.mutations.ts` - Server-side mutations for Imports.
- `src/features/imports/imports.queries.ts` - Server-side queries for Imports.
- `src/features/imports/imports.schemas.ts` - Zod schemas for Imports.

#### layouts

- `src/features/layouts/__tests__/admin-layout.test.tsx` - Test: Admin Layout.
- `src/features/layouts/admin-layout.tsx` - Feature module file for Layouts.
- `src/features/layouts/admin-nav.ts` - Feature module file for Layouts.

#### members

- `src/features/members/index.ts` - Barrel exports for Members.
- `src/features/members/members.queries.ts` - Server-side queries for Members.
- `src/features/members/members.schemas.ts` - Zod schemas for Members.
- `src/features/members/members.types.ts` - TypeScript types for Members.

#### membership

- `src/features/membership/__tests__/membership.finalize.integration.test.ts` - Test: Membership.Finalize.Integration.
- `src/features/membership/__tests__/membership.schemas.test.ts` - Test: Membership.Schemas.
- `src/features/membership/__tests__/membership.validation.test.ts` - Test: Membership.Validation.
- `src/features/membership/__tests__/square.webhook.test.ts` - Test: Square.Webhook.
- `src/features/membership/components/admin-memberships-report.tsx` - React component: Admin Memberships Report.
- `src/features/membership/hooks/usePaymentReturn.ts` - React hook: UsePaymentReturn.
- `src/features/membership/index.ts` - Feature module file for Membership.
- `src/features/membership/membership.admin-queries.ts` - Feature module file for Membership.
- `src/features/membership/membership.db-types.ts` - DB-specific type overrides for Membership.
- `src/features/membership/membership.finalize.ts` - Idempotent membership finalization from payment sessions.
- `src/features/membership/membership.mutations.ts` - Server-side mutations for Membership.
- `src/features/membership/membership.queries.ts` - Server-side queries for Membership.
- `src/features/membership/membership.schemas.ts` - Zod schemas for Membership.
- `src/features/membership/membership.types.ts` - TypeScript types for Membership.

#### notifications

- `src/features/notifications/components/notification-bell.tsx` - React component: Notification Bell.
- `src/features/notifications/components/notification-preferences-card.tsx` - React component: Notification Preferences Card.
- `src/features/notifications/components/notification-template-panel.tsx` - React component: Notification Template Panel.
- `src/features/notifications/notifications.mutations.ts` - Server-side mutations for Notifications.
- `src/features/notifications/notifications.queries.ts` - Server-side queries for Notifications.
- `src/features/notifications/notifications.schemas.ts` - Zod schemas for Notifications.
- `src/features/notifications/notifications.types.ts` - TypeScript types for Notifications.

#### organizations

- `src/features/organizations/components/organization-admin-panel.tsx` - React component: Organization Admin Panel.
- `src/features/organizations/organizations.mutations.ts` - Server-side mutations for Organizations.
- `src/features/organizations/organizations.queries.ts` - Server-side queries for Organizations.
- `src/features/organizations/organizations.schemas.ts` - Zod schemas for Organizations.
- `src/features/organizations/organizations.types.ts` - TypeScript types for Organizations.

#### privacy

- `src/features/privacy/components/privacy-acceptance-card.tsx` - React component: Privacy Acceptance Card.
- `src/features/privacy/components/privacy-admin-panel.tsx` - React component: Privacy Admin Panel.
- `src/features/privacy/components/privacy-dashboard.tsx` - React component: Privacy Dashboard.
- `src/features/privacy/components/retention-policy-panel.tsx` - React component: Retention Policy Panel.
- `src/features/privacy/privacy.mutations.ts` - Server-side mutations for Privacy.
- `src/features/privacy/privacy.queries.ts` - Server-side queries for Privacy.
- `src/features/privacy/privacy.schemas.ts` - Zod schemas for Privacy.

#### profile

- `src/features/profile/__tests__/profile.queries.test.ts` - Test: Profile.Queries.
- `src/features/profile/__tests__/profile.schemas.test.ts` - Test: Profile.Schemas.
- `src/features/profile/__tests__/profile.validation.test.ts` - Test: Profile.Validation.
- `src/features/profile/components/complete-profile-form-simple.tsx` - React component: Complete Profile Form Simple.
- `src/features/profile/components/profile-view.tsx` - React component: Profile View.
- `src/features/profile/hooks/useProfileFormReducer.ts` - React hook: UseProfileFormReducer.
- `src/features/profile/index.ts` - Barrel exports for Profile.
- `src/features/profile/profile-guard.ts` - Feature module file for Profile.
- `src/features/profile/profile.mutations.ts` - Server-side mutations for Profile.
- `src/features/profile/profile.queries.ts` - Server-side queries for Profile.
- `src/features/profile/profile.schemas.ts` - Zod schemas for Profile.
- `src/features/profile/profile.types.ts` - TypeScript types for Profile.
- `src/features/profile/profile.utils.ts` - Utilities for Profile.

#### reporting

- `src/features/reporting/components/reporting-dashboard-shell.tsx` - React component: Reporting Dashboard Shell.
- `src/features/reporting/reporting.mutations.ts` - Server-side mutations for Reporting.
- `src/features/reporting/reporting.queries.ts` - Server-side queries for Reporting.
- `src/features/reporting/reporting.schemas.ts` - Zod schemas for Reporting.

#### reports

- `src/features/reports/components/report-builder-shell.tsx` - React component: Report Builder Shell.
- `src/features/reports/reports.mutations.ts` - Server-side mutations for Reports.
- `src/features/reports/reports.queries.ts` - Server-side queries for Reports.
- `src/features/reports/reports.schemas.ts` - Zod schemas for Reports.

#### roles

- `src/features/roles/__tests__/permission.service.test.ts` - Test: Permission.Service.
- `src/features/roles/components/__tests__/role-management-dashboard.test.tsx` - Test: Role Management Dashboard.
- `src/features/roles/components/role-management-dashboard.tsx` - React component: Role Management Dashboard.
- `src/features/roles/permission.server.ts` - Server-only PermissionService wrapper.
- `src/features/roles/permission.service.ts` - Permission checks shared with client helpers.
- `src/features/roles/roles.mutations.ts` - Server-side mutations for Roles.
- `src/features/roles/roles.queries.ts` - Server-side queries for Roles.
- `src/features/roles/roles.types.ts` - TypeScript types for Roles.

#### security

- `src/features/security/components/security-dashboard.tsx` - React component: Security Dashboard.
- `src/features/security/security.mutations.ts` - Server-side mutations for Security.
- `src/features/security/security.queries.ts` - Server-side queries for Security.
- `src/features/security/security.schemas.ts` - Zod schemas for Security.

#### settings

- `src/features/settings/components/settings-view.tsx` - React component: Settings View.
- `src/features/settings/index.ts` - Barrel exports for Settings.
- `src/features/settings/settings.mutations.ts` - Server-side mutations for Settings.
- `src/features/settings/settings.queries.ts` - Server-side queries for Settings.
- `src/features/settings/settings.schemas.ts` - Zod schemas for Settings.
- `src/features/settings/settings.types.ts` - TypeScript types for Settings.

#### teams

- `src/features/teams/__tests__/teams.schemas.test.ts` - Test: Teams.Schemas.
- `src/features/teams/components/__tests__/team-invitations.test.tsx` - Test: Team Invitations.
- `src/features/teams/components/team-invitations.tsx` - React component: Team Invitations.
- `src/features/teams/teams.cleanup.ts` - Feature module file for Teams.
- `src/features/teams/teams.db-types.ts` - DB-specific type overrides for Teams.
- `src/features/teams/teams.mutations.ts` - Server-side mutations for Teams.
- `src/features/teams/teams.queries.ts` - Server-side queries for Teams.
- `src/features/teams/teams.schemas.ts` - Zod schemas for Teams.

### src/lib

- `src/lib/__tests__/oauth-domain.test.ts` - Test: Oauth Domain.
- `src/lib/audit/index.ts` - Audit logging with hash chain, redaction, and PII hashing.
- `src/lib/auth-client.ts` - Library module for Auth Client.Ts.
- `src/lib/auth/guards/__tests__/route-guards.test.tsx` - Test: Route Guards.
- `src/lib/auth/guards/org-context.ts` - Library module for Auth.
- `src/lib/auth/guards/org-guard.ts` - Library module for Auth.
- `src/lib/auth/guards/route-guards.ts` - Library module for Auth.
- `src/lib/auth/guards/step-up.ts` - Library module for Auth.
- `src/lib/auth/index.ts` - Barrel exports for Auth.
- `src/lib/auth/middleware/__tests__/auth-guard.test.ts` - Test: Auth Guard.
- `src/lib/auth/middleware/auth-guard.ts` - Library module for Auth.
- `src/lib/auth/middleware/role-guard.ts` - Library module for Auth.
- `src/lib/auth/server-helpers.ts` - Server-only Better Auth config (Drizzle adapter, OAuth, MFA, cookie config).
- `src/lib/auth/types.ts` - Library module for Auth.
- `src/lib/auth/utils/admin-check.ts` - Library module for Auth.
- `src/lib/db/jsonb-utils.ts` - Library module for Db.
- `src/lib/email/sendgrid.ts` - Library module for Email.
- `src/lib/env.client.ts` - Client-safe env parsing with VITE\_ vars and feature flags.
- `src/lib/env.server.ts` - Server env parsing + runtime detection for SST/Lambda.
- `src/lib/env/oauth-domain.ts` - OAuth domain allowlist parsing and validation.
- `src/lib/form.ts` - Library module for Form.Ts.
- `src/lib/hooks/index.ts` - React hook: Index.
- `src/lib/hooks/useAppForm.ts` - React hook: UseAppForm.
- `src/lib/imports/batch-runner.ts` - Library module for Imports.
- `src/lib/imports/worker.ts` - Library module for Imports.
- `src/lib/notifications/digest.ts` - Library module for Notifications.
- `src/lib/notifications/queue.ts` - Library module for Notifications.
- `src/lib/notifications/scheduler.ts` - Library module for Notifications.
- `src/lib/notifications/send.ts` - Notification dispatch: in-app insert + SES email with retry/idempotency.
- `src/lib/pacer/hooks.ts` - Library module for Pacer.
- `src/lib/pacer/index.ts` - Barrel exports for Pacer.
- `src/lib/pacer/rate-limit-config.ts` - Library module for Pacer.
- `src/lib/payments/square-real.ts` - Square SDK implementation: checkout, verification, webhooks, refunds.
- `src/lib/payments/square.ts` - Square facade with mock fallback; chooses real implementation by env.
- `src/lib/privacy/retention.ts` - Library module for Privacy.
- `src/lib/privacy/submission-files.ts` - Library module for Privacy.
- `src/lib/security/config.ts` - Library module for Security.
- `src/lib/security/detection.ts` - Library module for Security.
- `src/lib/security/events.ts` - Library module for Security.
- `src/lib/security/index.ts` - Library module for Security.
- `src/lib/security/lockout.ts` - Library module for Security.
- `src/lib/security/password-config.ts` - Library module for Security.
- `src/lib/security/utils/password-validator.ts` - Password validation + strength scoring helpers.
- `src/lib/server/auth.ts` - Server auth helpers: middleware list + requireUser.
- `src/lib/server/debug-guard.ts` - Library module for Server.
- `src/lib/server/errors.ts` - Library module for Server.
- `src/lib/server/fn-utils.ts` - Library module for Server.
- `src/lib/server/notifications/events/cancellation.ts` - Library module for Server.
- `src/lib/server/request-context.ts` - Library module for Server.
- `src/lib/server/request-id.middleware.ts` - Library module for Server.
- `src/lib/server/request-id.ts` - Library module for Server.
- `src/lib/storage/artifacts.ts` - S3 client + artifacts bucket resolution.
- `src/lib/utils/csv-export.ts` - Library module for Utils.

### src/nitro

- `src/nitro/aws-lambda-response-streaming.mjs` - Nitro AWS Lambda runtime entry file.
- `src/nitro/aws-lambda-response.mjs` - Nitro AWS Lambda runtime entry file.
- `src/nitro/aws-lambda-streaming.mjs` - Nitro AWS Lambda runtime entry file.

### src/routes (File-based Routing)

#### \_\_root.tsx

- `src/routes/__root.tsx` - Root route: loads auth + privacy acceptance, sets head/meta, wires devtools.

#### admin

- `src/routes/admin/roles.tsx` - Route file for /admin/roles (Route component.)

#### api

- `src/routes/api/auth/$.ts` - Better Auth catch-all API route handler.
- `src/routes/api/auth/$action/$provider.ts` - Dynamic Better Auth provider/action handler.
- `src/routes/api/debug-square.ts` - Debug endpoint for Square configuration.
- `src/routes/api/health.ts` - Health check API (DB + Square config).
- `src/routes/api/payments/square/callback.ts` - Square callback handler for payment finalization.
- `src/routes/api/test-square.ts` - Square sandbox test route.
- `src/routes/api/test/cleanup.ts` - E2E cleanup API route.
- `src/routes/api/webhooks/square.ts` - Square webhook handler (payment events/refunds).

#### auth

- `src/routes/auth/login.tsx` - Login route (email/OAuth UI).
- `src/routes/auth/route.tsx` - Auth layout/route config for /auth section.
- `src/routes/auth/signup.tsx` - Signup route (email/OAuth UI).

#### dashboard

- `src/routes/dashboard/admin/roles.tsx` - Route file for /dashboard/admin/roles (Route component.)
- `src/routes/dashboard/admin/route.tsx` - Route file for /dashboard/admin (Route config/layout.)
- `src/routes/dashboard/admin/sin.tsx` - Route file for /dashboard/admin/sin (Route component.)
- `src/routes/dashboard/events.tsx` - Route file for /dashboard/events (Route component.)
- `src/routes/dashboard/events/$eventId.manage.tsx` - Route file for /dashboard/events/:eventId.manage (Route component.)
- `src/routes/dashboard/events/$slug.index.tsx` - Route file for /dashboard/events/:slug.index (Route component.)
- `src/routes/dashboard/events/$slug.register.tsx` - Route file for /dashboard/events/:slug.register (Route component.)
- `src/routes/dashboard/events/$slug.tsx` - Route file for /dashboard/events/:slug (Route component.)
- `src/routes/dashboard/events/create.tsx` - Route file for /dashboard/events/create (Route component.)
- `src/routes/dashboard/events/index.tsx` - Route file for /dashboard/events (Route component.)
- `src/routes/dashboard/forbidden.tsx` - Route file for /dashboard/forbidden (Route component.)
- `src/routes/dashboard/index.tsx` - Route file for /dashboard (Route component.)
- `src/routes/dashboard/members.tsx` - Route file for /dashboard/members (Route component.)
- `src/routes/dashboard/membership.tsx` - Route file for /dashboard/membership (Route component.)
- `src/routes/dashboard/privacy.tsx` - Route file for /dashboard/privacy (Route component.)
- `src/routes/dashboard/profile.tsx` - Route file for /dashboard/profile (Route component.)
- `src/routes/dashboard/reports.tsx` - Route file for /dashboard/reports (Route component.)
- `src/routes/dashboard/route.tsx` - Route file for /dashboard (Route config/layout.)
- `src/routes/dashboard/settings.tsx` - Route file for /dashboard/settings (Route component.)
- `src/routes/dashboard/teams.tsx` - Route file for /dashboard/teams (Route component.)
- `src/routes/dashboard/teams/$teamId.index.tsx` - Route file for /dashboard/teams/:teamId.index (Route component.)
- `src/routes/dashboard/teams/$teamId.manage.tsx` - Route file for /dashboard/teams/:teamId.manage (Route component.)
- `src/routes/dashboard/teams/$teamId.members.tsx` - Route file for /dashboard/teams/:teamId.members (Route component.)
- `src/routes/dashboard/teams/$teamId.tsx` - Route file for /dashboard/teams/:teamId (Route component.)
- `src/routes/dashboard/teams/browse.tsx` - Route file for /dashboard/teams/browse (Route component.)
- `src/routes/dashboard/teams/create.tsx` - Route file for /dashboard/teams/create (Route component.)
- `src/routes/dashboard/teams/index.tsx` - Route file for /dashboard/teams (Route component.)

#### index.tsx

- `src/routes/index.tsx` - Landing page route (redirects authenticated users).

#### onboarding

- `src/routes/onboarding/index.tsx` - Onboarding route (profile completion).
- `src/routes/onboarding/route.tsx` - Onboarding route config/guard wrapper.

### src/shared

- `src/shared/contexts/ThemeContext.tsx` - Shared module: ThemeContext.
- `src/shared/hooks/useAsyncState.ts` - React hook: UseAsyncState.
- `src/shared/hooks/useFocusOnMount.ts` - React hook: UseFocusOnMount.
- `src/shared/hooks/useLocalStorage.ts` - React hook: UseLocalStorage.
- `src/shared/hooks/useTheme.ts` - React hook: UseTheme.
- `src/shared/lib/csv.ts` - Shared module: Csv.
- `src/shared/lib/json.ts` - Shared module: Json.
- `src/shared/lib/utils.ts` - Shared module: Utils.
- `src/shared/lib/xlsx.ts` - Shared module: Xlsx.

### src/shims

- `src/shims/async-local-storage.browser.ts` - Browser shim for node:async_hooks AsyncLocalStorage.
- `src/shims/stream-web.browser.ts` - Browser shim for node:stream/web.
- `src/shims/stream.browser.ts` - Browser shim for node:stream.

### src/tests

- `src/tests/mocks/auth.ts` - Test mocks for Better Auth client/session.
- `src/tests/setup.ts` - Vitest global setup, DOM mocks, and TanStack Start test shims.
- `src/tests/utils.tsx` - Testing Library utilities with QueryClient providers.
- `src/tests/utils/router.tsx` - TanStack Router test helpers and mock user context.

### src/types

- `src/types/env.d.ts` - Type declarations.

### src/workers

- `src/workers/import-batch.ts` - Worker entry: Import Batch.

## Tech Debt / Accuracy Notes

- Better Auth cookie cache is disabled due to upstream bug (see src/lib/auth/server-helpers.ts).
- Root route duplicates server/client user fetch logic (see src/routes/\_\_root.tsx).
- createServerFn without inputValidator: `src/features/auth/auth.queries.ts`, `src/features/auth/mfa/mfa.mutations.ts`, `src/features/profile/profile.queries.ts`, `src/features/settings/settings.queries.ts`, `src/lib/server/auth.ts`
