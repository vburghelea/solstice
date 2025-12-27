# Solstice Codebase Guide

Update instructions: Run `node scripts/update-code-guide.mjs`.

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

- `drizzle.config.ts` (71 lines) - Drizzle Kit config for migrations and DB naming.
- `eslint.config.js` (53 lines)
- `playwright.config.ts` (98 lines)
- `sst-env.d.ts` (84 lines)
- `sst.config.ts` (609 lines) - SST infra: stage/tenant mapping (qc/sin),
  VPC (bastion+NAT), Postgres+proxy+SSL, TanStack Start on Lambda+CloudFront,
  S3 artifacts, SQS notifications+DLQ, cron jobs, secrets, alarms/dashboard.
- `vite.config.ts` (234 lines) - Vite config with TanStack Start, Nitro adapter, PWA, React compiler, and browser shims.
- `vitest.config.ts` (42 lines)

## .husky (Generated/Tooling)

- `.husky/_/husky.sh` (8 lines)

## .netlify (Generated/Tooling)

- `.netlify/v1/functions/server.mjs` (13 lines)

## .nitro (Generated/Tooling)

- `.nitro/types/nitro-config.d.ts` (15 lines)
- `.nitro/types/nitro-imports.d.ts` (0 lines)
- `.nitro/types/nitro-routes.d.ts` (7 lines)
- `.nitro/types/nitro.d.ts` (2 lines)

## Repomix Config Scripts

- `repomix-configs/app-1-router-types.sh` (22 lines)
- `repomix-configs/doc-1-alignment.sh` (22 lines)
- `repomix-configs/evt-1-cancellation.sh` (24 lines)
- `repomix-configs/evt-2-pricing-tests.sh` (23 lines)
- `repomix-configs/evt-3-utilities.sh` (23 lines)
- `repomix-configs/test-all-configs.sh` (34 lines)

## Scripts

- `scripts/check-db-connections.ts` (100 lines) - CLI: list DB connections, optionally terminate idle, show limits.
- `scripts/check-users.ts` (68 lines) - CLI: list users, credential vs OAuth, and recent activity.
- `scripts/clean-test-users.ts` (56 lines)
- `scripts/generate-auth-secret.js` (69 lines)
- `scripts/generate-erd.js` (85 lines)
- `scripts/get-square-location.ts` (81 lines)
- `scripts/seed-e2e-data.ts` (714 lines) - Seed database with E2E test data/users.
- `scripts/seed-global-admins.ts` (388 lines)
- `scripts/seed-sin-data.ts` (733 lines) - Destructive: deletes existing SIN data before seeding.
- `scripts/test-auth.ts` (44 lines)
- `scripts/test-db-connection.ts` (70 lines)
- `scripts/test-routing.ts` (71 lines)
- `scripts/test-security-headers.sh` (38 lines)
- `scripts/test-server-auth.ts` (34 lines)
- `scripts/test-square-sandbox.ts` (103 lines) - CLI: validate Square sandbox APIs (locations/catalog/payments).
- `scripts/update-code-guide.mjs` (529 lines)

## E2E (Playwright)

- `e2e/auth.setup.ts` (38 lines) - Playwright auth setup that logs in and writes storage state.
- `e2e/fixtures/auth-fixtures.ts` (25 lines)
- `e2e/fixtures/auth.ts` (48 lines)
- `e2e/fixtures/base.ts` (8 lines)
- `e2e/helpers/auth.ts` (47 lines)
- `e2e/helpers/constants.ts` (22 lines)
- `e2e/helpers/global-setup.ts` (34 lines)
- `e2e/helpers/setup.ts` (89 lines)
- `e2e/helpers/test-data-reset.ts` (36 lines)
- `e2e/tests/authenticated/dashboard.shared.spec.ts` (138 lines)
- `e2e/tests/authenticated/events-flow.auth.spec.ts` (149 lines)
- `e2e/tests/authenticated/file-upload-validation.auth.spec.ts` (32 lines)
- `e2e/tests/authenticated/logout.shared.spec.ts` (118 lines)
- `e2e/tests/authenticated/members-directory.auth.spec.ts` (56 lines)
- `e2e/tests/authenticated/membership-no-active.auth.spec.ts` (75 lines)
- `e2e/tests/authenticated/membership.auth.spec.ts` (320 lines)
- `e2e/tests/authenticated/navigation.shared.spec.ts` (147 lines)
- `e2e/tests/authenticated/profile-edit.auth.spec.ts` (241 lines)
- `e2e/tests/authenticated/profile.auth.spec.ts` (58 lines)
- `e2e/tests/authenticated/report-export.auth.spec.ts` (26 lines)
- `e2e/tests/authenticated/roles-management.auth.spec.ts` (26 lines)
- `e2e/tests/authenticated/settings.auth.spec.ts` (93 lines)
- `e2e/tests/authenticated/sin-admin-access.auth.spec.ts` (29 lines)
- `e2e/tests/authenticated/sin-portal-access.auth.spec.ts` (35 lines)
- `e2e/tests/authenticated/team-browse.auth.spec.ts` (299 lines)
- `e2e/tests/authenticated/team-members.auth.spec.ts` (348 lines)
- `e2e/tests/authenticated/teams-create-no-conflict.auth.spec.ts` (156 lines)
- `e2e/tests/authenticated/teams.auth.spec.ts` (284 lines)
- `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts` (143 lines)
- `e2e/tests/unauthenticated/auth-pages.unauth.spec.ts` (96 lines)
- `e2e/tests/unauthenticated/auth-server-validation.unauth.spec.ts` (64 lines)
- `e2e/tests/unauthenticated/auth-validation.unauth.spec.ts` (71 lines)
- `e2e/utils/api-auth.ts` (55 lines)
- `e2e/utils/auth-verify.ts` (17 lines)
- `e2e/utils/auth.ts` (159 lines)
- `e2e/utils/cleanup.ts` (54 lines)
- `e2e/utils/membership-cleanup.ts` (21 lines)
- `e2e/utils/test-data.ts` (38 lines)

## src (Application Code)

### Top-level entries

- `src/client.tsx` (25 lines) - Client entry: hydrates Start app, attaches router diagnostics, exposes **ROUTER** in dev.
- `src/routeTree.gen.ts` (1006 lines) - Auto-generated route tree (do not edit).
- `src/router.tsx` (67 lines)
- `src/server.ts` (9 lines)
- `src/start.ts` (7 lines) - TanStack Start entry point. Creates the Start instance with global
  function middleware: requestIdMiddleware for request tracing and orgContextMiddleware for
  organization context injection into server functions.
- `src/vite-env.d.ts` (29 lines)

### src/app

- `src/app/providers.tsx` (29 lines) - React providers: QueryClientProvider + StepUpProvider.

### src/components

- `src/components/DefaultCatchBoundary.tsx` (68 lines)
- `src/components/NotFound.tsx` (60 lines)
- `src/components/ThemeToggle.tsx` (15 lines)
- `src/components/form-fields/FormSubmitButton.tsx` (36 lines)
- `src/components/form-fields/ValidatedCheckbox.tsx` (64 lines)
- `src/components/form-fields/ValidatedColorPicker.tsx` (93 lines)
- `src/components/form-fields/ValidatedCombobox.tsx` (103 lines)
- `src/components/form-fields/ValidatedDatePicker.tsx` (317 lines)
- `src/components/form-fields/ValidatedFileUpload.tsx` (140 lines)
- `src/components/form-fields/ValidatedInput.tsx` (78 lines)
- `src/components/form-fields/ValidatedPhoneInput.tsx` (103 lines)
- `src/components/form-fields/ValidatedSelect.tsx` (86 lines)
- `src/components/form-fields/__tests__/validated-inputs.test.tsx` (145 lines)
- `src/components/ui/SafeLink.tsx` (45 lines) - Safari/WebKit-compatible Link wrapper. On WebKit browsers,
  falls back to a native anchor with manual navigation to avoid Safari click event issues. Preserves
  active state styling and TanStack Router Link API compatibility on other browsers.
- `src/components/ui/TypedLink.tsx` (57 lines) - Fully generic-typed Link component with Safari/WebKit
  workaround. Preserves TanStack Router's generic type parameters (TFrom, TTo, TMaskFrom, TMaskTo)
  for proper TypeScript inference while handling WebKit click event quirks.
- `src/components/ui/app-sidebar.tsx` (126 lines)
- `src/components/ui/admin-sidebar.tsx` (103 lines)
- `src/components/ui/alert-dialog.tsx` (139 lines)
- `src/components/ui/alert.tsx` (63 lines)
- `src/components/ui/avatar.tsx` (51 lines)
- `src/components/ui/badge.tsx` (45 lines)
- `src/components/ui/breadcrumbs.tsx` (82 lines)
- `src/components/ui/button.tsx` (57 lines)
- `src/components/ui/card.tsx` (86 lines)
- `src/components/ui/checkbox.tsx` (30 lines)
- `src/components/ui/command.tsx` (173 lines)
- `src/components/ui/data-state.tsx` (38 lines) - Reusable error state component for data loading failures.
  Displays a styled error card with customizable title, description, and optional retry button.
  Uses destructive color scheme for visual prominence.
- `src/components/ui/data-table.tsx` (180 lines)
- `src/components/ui/dialog.tsx` (132 lines)
- `src/components/ui/dropdown-menu.tsx` (236 lines)
- `src/components/ui/icons.tsx` (42 lines)
- `src/components/ui/input.tsx` (21 lines)
- `src/components/ui/label.tsx` (22 lines)
- `src/components/ui/logo.tsx` (38 lines)
- `src/components/ui/mobile-admin-header.tsx` (29 lines)
- `src/components/ui/mobile-app-header.tsx` (37 lines)
- `src/components/ui/mobile-data-cards.tsx` (136 lines)
- `src/components/ui/popover.tsx` (44 lines)
- `src/components/ui/radio-group.tsx` (43 lines)
- `src/components/ui/select.tsx` (171 lines)
- `src/components/ui/separator.tsx` (28 lines)
- `src/components/ui/skeleton.tsx` (13 lines)
- `src/components/ui/sonner.tsx` (23 lines)
- `src/components/ui/table.tsx` (105 lines)
- `src/components/ui/tabs.tsx` (61 lines)
- `src/components/ui/textarea.tsx` (18 lines)

### src/cron

- `src/cron/enforce-retention.ts` (11 lines) - AWS Lambda cron handler for data retention enforcement.
  Dynamically imports and executes applyRetentionPolicies to delete expired data per PIPEDA compliance.
  Disables callback wait to allow Lambda to terminate promptly.
- `src/cron/notification-worker.ts` (100 lines) - SQS consumer Lambda for async notification delivery.
  Processes batched notification messages concurrently, calls sendNotification for each, and returns
  partial batch failures for SQS retry. Supports in-app and email notification dispatch.
- `src/cron/process-notifications.ts` (17 lines) - AWS Lambda cron handler for scheduled notification processing.
  Runs processScheduledNotifications and processNotificationDigests in parallel to dispatch
  time-based notifications and aggregate digest emails.

### src/db

- `src/db/connections.ts` (524 lines) - DB connection manager with health tracking.
  Manages pooled (RDS Proxy) and unpooled connections with exponential backoff, failure counting,
  structured logging, and getConnectionMetrics for monitoring. Handles SST LinkedDatabase config.
- `src/db/index.ts` (26 lines)
- `src/db/schema/audit.schema.ts` (44 lines)
- `src/db/schema/auth.schema.ts` (99 lines)
- `src/db/schema/events.schema.ts` (356 lines)
- `src/db/schema/forms.schema.ts` (139 lines)
- `src/db/schema/imports.schema.ts` (91 lines)
- `src/db/schema/index.ts` (14 lines)
- `src/db/schema/membership.schema.ts` (119 lines)
- `src/db/schema/notifications.schema.ts` (114 lines)
- `src/db/schema/organizations.schema.ts` (151 lines)
- `src/db/schema/privacy.schema.ts` (114 lines)
- `src/db/schema/reporting.schema.ts` (119 lines)
- `src/db/schema/reports.schema.ts` (53 lines)
- `src/db/schema/roles.schema.ts` (120 lines)
- `src/db/schema/security.schema.ts` (44 lines)
- `src/db/schema/teams.schema.ts` (140 lines)
- `src/db/server-helpers.ts` (19 lines)

### src/diagnostics

- `src/diagnostics/routerDiagnostics.ts` (64 lines)

### src/features (Domain Modules)

#### audit

- `src/features/audit/audit.queries.ts` (122 lines)
- `src/features/audit/audit.schemas.ts` (22 lines)
- `src/features/audit/components/audit-log-table.tsx` (174 lines)

#### auth

- `src/features/auth/__tests__/login-with-router.test.tsx` (109 lines)
- `src/features/auth/__tests__/login.test.tsx` (246 lines)
- `src/features/auth/__tests__/signup-with-router.test.tsx` (115 lines)
- `src/features/auth/auth.queries.ts` (71 lines)
- `src/features/auth/auth.schemas.ts` (89 lines)
- `src/features/auth/components/login.tsx` (367 lines)
- `src/features/auth/components/signup.tsx` (218 lines)
- `src/features/auth/hooks/useAuth.ts` (42 lines)
- `src/features/auth/hooks/useAuthForm.ts` (67 lines)
- `src/features/auth/index.ts` (8 lines)
- `src/features/auth/mfa/mfa-enrollment.tsx` (177 lines) - MFA enrollment UI component. Guides users through
  TOTP setup: password confirmation, QR code display via react-qr-code, backup code generation,
  and verification. Integrates with Better Auth twoFactor APIs and marks enrollment complete.
- `src/features/auth/mfa/mfa-recovery.tsx` (45 lines) - MFA backup code recovery UI. Allows users who have
  lost access to their authenticator app to sign in using a one-time backup code.
  Calls Better Auth twoFactor.verifyBackupCode on submission.
- `src/features/auth/mfa/mfa.mutations.ts` (34 lines)
- `src/features/auth/step-up.tsx` (291 lines) - Step-up authentication context and dialog.
  StepUpProvider wraps app with MFA re-verification dialog for sensitive actions. useStepUpPrompt
  triggers dialog; StepUpDialog handles password/MFA re-auth with Better Auth twoFactor APIs.

#### dashboard

- `src/features/dashboard/MemberDashboard.tsx` (544 lines)
- `src/features/dashboard/PublicPortalPage.tsx` (95 lines)
- `src/features/dashboard/index.ts` (3 lines)

#### events

- `src/features/events/__tests__/events.base-schemas.test.ts` (201 lines)
- `src/features/events/__tests__/events.registration.integration.test.ts` (521 lines)
- `src/features/events/__tests__/events.schemas.test.ts` (314 lines)
- `src/features/events/__tests__/payment-metadata.test.ts` (39 lines)
- `src/features/events/__tests__/registration-pricing.test.ts` (148 lines)
- `src/features/events/components/event-create-form-minimal.tsx` (16 lines)
- `src/features/events/components/event-create-form.tsx` (866 lines)
- `src/features/events/components/event-list.tsx` (513 lines)
- `src/features/events/events.db-types.ts` (75 lines)
- `src/features/events/events.mutations.ts` (1280 lines) - Square/e-transfer registration + refunds.
- `src/features/events/events.queries.ts` (460 lines)
- `src/features/events/events.schemas.ts` (118 lines)
- `src/features/events/events.types.ts` (168 lines)
- `src/features/events/index.ts` (33 lines)
- `src/features/events/utils/index.ts` (4 lines)
- `src/features/events/utils/jsonb.ts` (44 lines) - Type-safe JSONB field casting utilities for events.
  Provides castEventJsonbFields and castRegistrationJsonbFields to convert raw DB records to
  strongly-typed EventWithDetails and EventRegistrationWithRoster interfaces.
- `src/features/events/utils/payment-metadata.ts` (61 lines) - Payment metadata builders for event registrations.
  Includes buildEtransferSnapshot for capturing e-transfer instructions, markEtransferPaidMetadata
  and markEtransferReminderMetadata for audit trails, and appendCancellationNote for admin context.
- `src/features/events/utils/pricing.ts` (31 lines) - Event registration pricing calculator. Computes
  registration amount in cents for team/individual types, applying early-bird discounts when
  deadline hasn't passed. Handles zero/negative fees and clamps discount percentage.
- `src/features/events/utils/time.ts` (45 lines) - Clock abstraction for testable time handling.
  Provides systemClock, fixedClock for deterministic tests, mutableClock for step-based time
  advancement, and getClockFromContext for server function test injection.

#### forms

- `src/features/forms/components/form-builder-shell.tsx` (1627 lines) - Builder + submission review workflow.
- `src/features/forms/forms.mutations.ts` (589 lines)
- `src/features/forms/forms.queries.ts` (327 lines)
- `src/features/forms/forms.schemas.ts` (143 lines)
- `src/features/forms/forms.utils.ts` (384 lines) - Form validation and processing utilities.
  sanitizePayload (XSS protection), validateFormPayload (required/min/max/regex rules),
  validateFileUpload (size/type checks), getFileConfigForField, conditional field logic.

#### imports

- `src/features/imports/components/import-wizard-shell.tsx` (858 lines) - Bulk data import wizard UI.
  Supports CSV/Excel parsing via papaparse/xlsx, column mapping templates, interactive vs batch
  processing lanes, validation preview, import job tracking, and rollback capability.
- `src/features/imports/imports.mutations.ts` (512 lines) - Batch + interactive imports; rollback window.
- `src/features/imports/imports.queries.ts` (195 lines)
- `src/features/imports/imports.schemas.ts` (81 lines)

#### layouts

- `src/features/layouts/__tests__/admin-layout.test.tsx` (122 lines)
- `src/features/layouts/app-layout.tsx` (52 lines)
- `src/features/layouts/admin-layout.tsx` (50 lines)
- `src/features/layouts/admin-nav.ts` (25 lines)
- `src/features/layouts/app-nav.ts` (135 lines)
- `src/features/layouts/nav.types.ts` (18 lines)
- `src/features/layouts/sin-admin-nav.ts` (85 lines)

#### members

- `src/features/members/index.ts` (3 lines)
- `src/features/members/members.queries.ts` (354 lines) - Privacy filtering for email/phone/birth year.
- `src/features/members/members.schemas.ts` (9 lines)
- `src/features/members/members.types.ts` (51 lines)

#### membership

- `src/features/membership/__tests__/membership.finalize.integration.test.ts` (316 lines)
- `src/features/membership/__tests__/membership.schemas.test.ts` (194 lines)
- `src/features/membership/__tests__/membership.validation.test.ts` (135 lines)
- `src/features/membership/__tests__/square.webhook.test.ts` (197 lines)
- `src/features/membership/components/admin-memberships-report.tsx` (242 lines)
- `src/features/membership/hooks/usePaymentReturn.ts` (87 lines)
- `src/features/membership/index.ts` (18 lines)
- `src/features/membership/membership.admin-queries.ts` (135 lines)
  Provides getAllMemberships server function for fetching paginated membership records with user
  info, status filtering, and admin role enforcement. Used by membership reports dashboard.
- `src/features/membership/membership.db-types.ts` (11 lines)
- `src/features/membership/membership.finalize.ts` (124 lines) - Idempotent membership finalization.
  finalizeMembershipForSession atomically creates/updates membership + payment session in
  a transaction. Handles duplicate payment IDs, sets expiry dates, and uses atomic JSONB merge.
- `src/features/membership/membership.mutations.ts` (439 lines)
  createCheckoutSession (Square integration), confirmMembershipPurchase (with retry logic for
  pending payments). Validates membership type, prevents duplicates, and tracks payment sessions.
- `src/features/membership/membership.queries.ts` (208 lines)
- `src/features/membership/membership.schemas.ts` (30 lines)
- `src/features/membership/membership.types.ts` (60 lines)

#### notifications

- `src/features/notifications/components/notification-bell.tsx` (79 lines)
- `src/features/notifications/components/notification-preferences-card.tsx` (125 lines)
- `src/features/notifications/components/notification-template-panel.tsx` (337 lines) - Admin UI for managing
  notification templates. CRUD operations for email/in-app templates with category selection,
  subject/body editing, system template flag, and inline draft editing with React Query mutations.
- `src/features/notifications/notifications.mutations.ts` (282 lines)
- `src/features/notifications/notifications.queries.ts` (111 lines)
- `src/features/notifications/notifications.schemas.ts` (93 lines)
- `src/features/notifications/notifications.types.ts` (24 lines)

#### organizations

- `src/features/organizations/__tests__/organizations.access.test.ts` (217 lines)
- `src/features/organizations/components/org-switcher.tsx` (89 lines)
- `src/features/organizations/components/organization-admin-panel.tsx` (542 lines)
- `src/features/organizations/org-context.tsx` (73 lines)
- `src/features/organizations/organizations.access.ts` (260 lines)
- `src/features/organizations/organizations.mutations.ts` (882 lines) - Org hierarchy + delegated access; sets active org cookie.
- `src/features/organizations/organizations.queries.ts` (242 lines)
- `src/features/organizations/organizations.schemas.ts` (135 lines)
- `src/features/organizations/organizations.types.ts` (65 lines)

#### privacy

- `src/features/privacy/components/onboarding-policy-step.tsx` (148 lines)
- `src/features/privacy/components/privacy-acceptance-card.tsx` (91 lines)
- `src/features/privacy/components/privacy-admin-panel.tsx` (256 lines) - GDPR/PIPEDA privacy request admin.
  Lists all privacy requests with status updates, triggers data export generation, initiates
  erasure workflows, and provides download links for completed export files.
- `src/features/privacy/components/privacy-dashboard.tsx` (81 lines)
- `src/features/privacy/components/retention-policy-panel.tsx` (304 lines) - Data retention policy admin UI.
  Configure retention/archive/purge periods per data type, toggle legal hold status, and view
  existing policies in a table. Supports PIPEDA compliance requirements.
- `src/features/privacy/privacy.mutations.ts` (659 lines) - Privacy export + erasure (DSAR) + retention policies.
- `src/features/privacy/privacy.queries.ts` (156 lines)
- `src/features/privacy/privacy.schemas.ts` (74 lines)

#### profile

- `src/features/profile/__tests__/profile.queries.test.ts` (123 lines)
- `src/features/profile/__tests__/profile.schemas.test.ts` (211 lines)
- `src/features/profile/__tests__/profile.validation.test.ts` (232 lines)
- `src/features/profile/components/complete-profile-form-simple.tsx` (429 lines)
- `src/features/profile/components/profile-view.tsx` (637 lines) - User profile view/edit component.
  Displays profile fields with inline editing mode, validated form fields (date picker, selects),
  privacy settings toggles, emergency contact section, and UTC date handling for age calculation.
- `src/features/profile/hooks/useProfileFormReducer.ts` (106 lines)
- `src/features/profile/index.ts` (8 lines)
- `src/features/profile/profile-guard.ts` (26 lines) - Profile completion route guard utilities.
  requireCompleteProfile throws redirect to /onboarding if profile incomplete or /auth/login
  if unauthenticated. needsProfileCompletion returns boolean for conditional UI rendering.
- `src/features/profile/profile.mutations.ts` (255 lines)
- `src/features/profile/profile.queries.ts` (162 lines)
- `src/features/profile/profile.schemas.ts` (67 lines)
- `src/features/profile/profile.types.ts` (60 lines)
- `src/features/profile/profile.utils.ts` (6 lines)

#### reporting

- `src/features/reporting/components/reporting-dashboard-shell.tsx` (587 lines)
- `src/features/reporting/reporting.mutations.ts` (330 lines) - Reporting cycles/tasks + reminder scheduling (step-up).
- `src/features/reporting/reporting.queries.ts` (229 lines)
- `src/features/reporting/reporting.schemas.ts` (58 lines)

#### reports

- `src/features/reports/components/report-builder-shell.tsx` (647 lines) - Saved report builder and export UI.
  Create/edit saved reports with data source selection, column/filter/sort configuration,
  organization scoping, sharing options, and export to CSV/Excel/PDF formats.
- `src/features/reports/reports.mutations.ts` (359 lines) - PII field masking + export ACL.
- `src/features/reports/reports.queries.ts` (34 lines)
- `src/features/reports/reports.schemas.ts` (36 lines)

#### roles

- `src/features/roles/__tests__/permission.service.test.ts` (183 lines)
- `src/features/roles/components/__tests__/role-management-dashboard.test.tsx` (129 lines)
- `src/features/roles/components/role-management-dashboard.tsx` (901 lines)
- `src/features/roles/permission.server.ts` (120 lines)
- `src/features/roles/permission.service.ts` (169 lines)
  PermissionService class with isGlobalAdmin, canManageTeam, canManageEvent, hasAnyRole methods.
  Queries userRoles/roles tables. isAnyAdmin helper exported for client-side role checks.
- `src/features/roles/roles.mutations.ts` (442 lines) - Role assignment server functions.
  assignRoleToUser (with team/event scoping, expiry), removeRoleFromUser. Requires global admin
  - step-up re-auth. Prevents duplicate assignments and validates scope conflicts.
- `src/features/roles/roles.queries.ts` (201 lines) - Role management data queries.
  getRoleManagementData (roles with assignment counts, MFA requirement flags, recent assignments),
  searchUsersForRoleAssignment (typeahead user search with LIKE escaping).
- `src/features/roles/roles.types.ts` (57 lines)

#### security

- `src/features/security/components/security-dashboard.tsx` (136 lines) - Admin security operations dashboard.
  Manual account lock/unlock controls with reason tracking, recent security events log,
  and active account locks list. Used for incident response and user management.
- `src/features/security/security.mutations.ts` (91 lines)
- `src/features/security/security.queries.ts` (192 lines)
- `src/features/security/security.schemas.ts` (29 lines)

#### settings

- `src/features/settings/components/settings-view.tsx` (728 lines) - User account settings page.
  Change password form (with strength meter), session management (view/revoke), linked OAuth accounts
  (link/unlink), MFA enrollment/recovery cards, and notification preferences panel.
- `src/features/settings/index.ts` (4 lines)
- `src/features/settings/settings.mutations.ts` (164 lines)
- `src/features/settings/settings.queries.ts` (135 lines)
- `src/features/settings/settings.schemas.ts` (69 lines)
- `src/features/settings/settings.types.ts` (45 lines)

#### teams

- `src/features/teams/__tests__/teams.schemas.test.ts` (380 lines)
- `src/features/teams/components/__tests__/team-invitations.test.tsx` (90 lines)
- `src/features/teams/components/team-invitations.tsx` (184 lines)
- `src/features/teams/teams.cleanup.ts` (42 lines)
  clearUserTeamsForTesting server function removes all team memberships for a user by email.
  Guarded to only run in non-production or when E2E_TEST_EMAIL is set.
- `src/features/teams/teams.db-types.ts` (12 lines)
- `src/features/teams/teams.mutations.ts` (754 lines)
  createTeam (with captain auto-add), updateTeam, addTeamMember, removeTeamMember, updateTeamMember,
  requestTeamMembership, handleTeamInvite (accept/reject). Enforces single active membership constraint.
- `src/features/teams/teams.queries.ts` (368 lines)
  getTeam/getTeamBySlug (with member count), listTeams (with creator info), searchTeams (text search),
  getTeamMembers (with user details), getUserTeams, isTeamMember, getTeamInvitations.
- `src/features/teams/teams.schemas.ts` (106 lines)

### src/lib

- `src/lib/__tests__/oauth-domain.test.ts` (27 lines)
- `src/lib/audit/index.ts` (298 lines) - Audit logging with hash chain and PII protection.
  Inserts audit entries with SHA-256 hash chain for tamper detection, redacts sensitive fields
  (password, tokens), hashes PII (phone, DOB), and provides logAuthEvent/logSecurityEvent helpers.
- `src/lib/auth-client.ts` (78 lines) - Client-side Better Auth facade with lazy initialization.
  Exposes auth methods (signIn, signUp, signOut, session, twoFactor, etc.) via getters that
  initialize the client on first use with proper baseURL configuration.
- `src/lib/auth/guards/__tests__/route-guards.test.tsx` (91 lines)
- `src/lib/auth/guards/org-context.ts` (72 lines)
  Reads x-organization-id header, resolves membership for authenticated user, and injects
  userId/organizationId/organizationMembership into server function context.
- `src/lib/auth/guards/org-guard.ts` (82 lines)
  getOrganizationMembership fetches membership record; requireOrganizationMembership throws
  unauthorized/forbidden errors if user lacks membership or required role.
- `src/lib/auth/guards/route-guards.ts` (85 lines) - TanStack Router beforeLoad guard utilities.
  requireAuth redirects unauthenticated users to login with redirect param; redirectIfAuthenticated
  bounces logged-in users from auth pages; requireAuthAndProfile combines auth + profile checks.
- `src/lib/auth/guards/step-up.ts` (149 lines) - Step-up authentication guards for sensitive operations.
  Checks MFA enablement, enforces 15-minute re-auth window, extracts session timestamps from
  Better Auth. requireRecentAuth throws forbidden if session is stale.
- `src/lib/auth/index.ts` (9 lines)
- `src/lib/auth/middleware/__tests__/auth-guard.test.ts` (111 lines)
- `src/lib/auth/middleware/auth-guard.ts` (107 lines)
  Validates session via Better Auth, checks account lockout, resolves organization membership
  from x-organization-id header, and injects AuthedRequestContext into function context.
- `src/lib/auth/middleware/role-guard.ts` (61 lines) - Role-based route protection guards.
  requireRole checks user against required roles with optional team/event context scoping.
  requireGlobalAdmin is a convenience wrapper for global admin-only routes.
- `src/lib/auth/server-helpers.ts` (205 lines)
  Lazy-initializes betterAuth with Drizzle adapter, Google OAuth, TOTP 2FA, secure cookies
  (HTTPS-aware), domain filtering, and TanStack Start cookie integration. getAuth() accessor.
- `src/lib/auth/types.ts` (69 lines)
- `src/lib/auth/utils/admin-check.ts` (54 lines)
  isAdmin/requireAdmin check via PermissionService (server); isAdminClient checks user.roles
  (client). Enforces MFA requirement for admins. Exports GLOBAL_ADMIN_ROLE_NAMES list.
- `src/lib/db/jsonb-utils.ts` (87 lines) - Atomic JSONB operations for Drizzle ORM.
  Provides atomicJsonbMerge, atomicJsonbSet, atomicJsonbDelete, and atomicJsonbDeepMerge
  SQL helpers to prevent race conditions in concurrent JSONB column updates.
- `src/lib/email/sendgrid.ts` (346 lines)
  Type-safe email sending with Zod schemas, template ID constants, attachment support, and
  automatic mock mode in development. Used for transactional emails (receipts, invites, etc.).
- `src/lib/env.client.ts` (40 lines)
- `src/lib/env.server.ts` (172 lines)
  Uses @t3-oss/env-core with Zod validation for database URLs, OAuth, Square, SendGrid, and SST/AWS vars.
  Dotenv loading with AWS Lambda/Vite runtime detection. Exports getDbUrl, getPooledDbUrl, getUnpooledDbUrl,
  getBaseUrl (SST or VITE_BASE_URL), getAuthSecret (cached, validated). Runtime helpers: isProduction,
  isDevelopment, isTest, isServerless, isAWSLambda, getSSTStage.
- `src/lib/env/oauth-domain.ts` (19 lines)
- `src/lib/form.ts` (32 lines) - TanStack Form helper types and utilities.
  Exports FieldComponentProps and FormSubmitButtonProps interfaces for form components,
  plus isFieldApi type guard for runtime field API validation.
- `src/lib/hooks/index.ts` (1 lines)
- `src/lib/hooks/useAppForm.ts` (23 lines)
- `src/lib/imports/batch-runner.ts` (314 lines) - Batch import job execution engine.
  Reads import file from S3, applies mapping template, validates against form schema, creates
  form submissions in batches, and tracks errors/progress. Org membership enforced.
- `src/lib/imports/worker.ts` (6 lines)
- `src/lib/notifications/digest.ts` (124 lines) - Notification digest email processor.
  Groups unread notifications by user preference (daily/weekly), builds digest email body,
  sends via sendDigestEmail, and marks notifications with digestSentAt timestamp.
- `src/lib/notifications/queue.ts` (56 lines) - SQS notification queue producer.
  enqueueNotification sends notifications to SQS queue (FIFO-aware with deduplication) for
  async processing, or falls back to direct send when queue URL isn't configured in dev.
- `src/lib/notifications/scheduler.ts` (126 lines) - Scheduled notification manager.
  scheduleNotification creates future notification jobs; processScheduledNotifications polls
  for due items, applies template variables, enqueues delivery, and handles retries with backoff.
- `src/lib/notifications/send.ts` (245 lines) - Notification dispatch engine.
  sendNotification creates in-app notification record, checks user preferences, and sends
  email via SES with exponential backoff retry. sendDigestEmail for digest-specific emails.
- `src/lib/pacer/hooks.ts` (69 lines) - Client-side rate limiting hooks via TanStack Pacer.
  useRateLimitedServerFn wraps server functions with configurable rate limits and toast
  feedback on rejection. useRateLimitedSearch is a convenience wrapper for search ops.
- `src/lib/pacer/index.ts` (5 lines)
- `src/lib/pacer/rate-limit-config.ts` (27 lines) - Rate limit preset configuration.
  Defines auth (5/15min), api (100/1min), search (10/10s), and mutation (20/1min) presets
  with fixed or sliding window types for TanStack Pacer.
- `src/lib/payments/square-real.ts` (630 lines) - Real Square SDK implementation.
  SquarePaymentService class: createCheckoutSession for payment links, verifyPayment for
  confirmation, processWebhook for signature validation, refundPayment, and retrievePayment.
- `src/lib/payments/square.ts` (281 lines) - Square payment facade with mock mode.
  squarePaymentService singleton auto-selects MockSquarePaymentService when SQUARE_ACCESS_TOKEN
  missing or SQUARE_MOCK=true. Exports createServerFn wrappers for checkout/verify/webhook.
- `src/lib/privacy/retention.ts` (222 lines) - Data retention policy enforcement.
  applyRetentionPolicies processes each policy type, respects legal holds and immutable audit
  logs, deletes S3 files before DB rows, and supports batch deletion for PIPEDA compliance.
- `src/lib/privacy/submission-files.ts` (153 lines) - S3 file cleanup for form submissions.
  deleteSubmissionFilesByRow resolves S3 bucket/key from various field patterns (s3://, ARN,
  URL, storage keys) and batch-deletes objects. Used by retention policies.
- `src/lib/security/config.ts` (72 lines) - Centralized security configuration object.
  Defines cookie settings (secure in prod), session lifecycle (30d expiry), CORS config,
  rate limit defaults, password requirements, and OAuth allowed domains.
- `src/lib/security/detection.ts` (87 lines) - Automated security threat detection.
  applySecurityRules checks recent security events and triggers account lockouts for brute
  force patterns: 5 login fails/15min, 10/hour, or 3 MFA fails/5min.
- `src/lib/security/events.ts` (84 lines) - Security event recording and audit integration.
  recordSecurityEvent inserts to securityEvents table with IP/geo/UA extraction from headers,
  risk scoring, and dual-logs to audit trail for auth-related events.
- `src/lib/security/index.ts` (16 lines)
- `src/lib/security/lockout.ts` (117 lines) - Account lockout management functions.
  lockAccount creates lock record and notifies admins; unlockAccount releases locks;
  isAccountLocked checks for active locks (respecting unlockAt expiry).
- `src/lib/security/password-config.ts` (15 lines)
- `src/lib/security/utils/password-validator.ts` (86 lines) - Password validation + strength scoring helpers.
- `src/lib/server/auth.ts` (16 lines) - Server auth helpers: middleware list + requireUser.
- `src/lib/server/debug-guard.ts` (31 lines) - Development-only endpoint protection.
  debugGuard returns 404 in production builds (via import.meta.env.PROD), undefined in dev.
  withDebugGuard is a wrapper for conditionally executing debug handlers.
- `src/lib/server/errors.ts` (47 lines) - Typed server error factory functions.
  TypedServerError class with Zod schema, plus convenience factories: unauthorized, forbidden,
  notFound, badRequest, validationError, internalError. Used throughout server functions.
- `src/lib/server/fn-utils.ts` (46 lines) - Server function utility helpers.
  unwrapServerFnResult handles Response/fetcher unwrapping; callServerFn adds data wrapper;
  zod$ is a typed adapter for passing Zod schemas to inputValidator.
- `src/lib/server/notifications/events/cancellation.ts` (33 lines) - Event cancellation notification helper.
  sendEventCancellationNotifications queries event registrants (users + teams) and logs
  notification dispatch count. Called when an event is cancelled.
- `src/lib/server/request-context.ts` (13 lines)
- `src/lib/server/request-id.middleware.ts` (19 lines)
- `src/lib/server/request-id.ts` (11 lines)
- `src/lib/storage/artifacts.ts` (19 lines) - S3 client + artifacts bucket resolution.
- `src/lib/utils/csv-export.ts` (102 lines) - CSV export utility for client-side downloads.
  exportToCSV generates RFC-compliant CSV with proper quoting/escaping, custom header labels,
  and triggers browser download. Handles dates, objects, and special characters.

### src/nitro

- `src/nitro/aws-lambda-response-streaming.mjs` (178 lines)
- `src/nitro/aws-lambda-response.mjs` (169 lines)
- `src/nitro/aws-lambda-streaming.mjs` (169 lines)

### src/routes (File-based Routing)

#### \_\_root.tsx

- `src/routes/__root.tsx` (197 lines)

#### admin

- `src/routes/admin/roles.tsx` (7 lines)

#### api

- `src/routes/api/auth/$.ts` (21 lines)
- `src/routes/api/auth/$action/$provider.ts` (17 lines)
- `src/routes/api/debug-square.ts` (45 lines)
- `src/routes/api/health.ts` (195 lines) - Comprehensive health check endpoint.
  GET handler returns status (healthy/degraded/unhealthy), DB connection test with latency,
  Square config validation, membership types availability, and connection pool metrics.
- `src/routes/api/payments/square/callback.ts` (471 lines)
- `src/routes/api/test-square.ts` (38 lines)
- `src/routes/api/test/cleanup.ts` (166 lines)
- `src/routes/api/webhooks/square.ts` (460 lines)

#### auth

- `src/routes/auth/login.tsx` (18 lines)
- `src/routes/auth/route.tsx` (21 lines)
- `src/routes/auth/signup.tsx` (6 lines)

#### dashboard

- `src/routes/dashboard/admin/index.tsx` (49 lines)
- `src/routes/dashboard/admin/roles.tsx` (14 lines)
- `src/routes/dashboard/admin/route.tsx` (18 lines)
- `src/routes/dashboard/admin/sin.tsx` (55 lines)
- `src/routes/dashboard/admin/sin/analytics.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/audit.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/forms.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/imports.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/index.tsx` (98 lines)
- `src/routes/dashboard/admin/sin/notifications.tsx` (22 lines)
- `src/routes/dashboard/admin/sin/organizations.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/privacy.tsx` (24 lines)
- `src/routes/dashboard/admin/sin/reporting.tsx` (18 lines)
- `src/routes/dashboard/admin/sin/security.tsx` (18 lines)
- `src/routes/dashboard/events.tsx` (13 lines)
- `src/routes/dashboard/events/$eventId.manage.tsx` (873 lines) - Admin event management page.
  Tabbed interface for event overview, registrations table (with e-transfer status, refund actions),
  and settings. Supports event cancellation, status updates, e-transfer payment marking, and CSV export.
- `src/routes/dashboard/events/$slug.index.tsx` (620 lines) - Event detail page for attendees.
  Displays event info (date, location, pricing, capacity), registration status check, admin manage
  link, and register CTA. Shows early-bird pricing when applicable.
- `src/routes/dashboard/events/$slug.register.tsx` (805 lines) - Event registration flow.
  Multi-step form: registration type (individual/team), team selection, emergency contact,
  terms acceptance, and payment method (Square/e-transfer). Calculates pricing with discounts.
- `src/routes/dashboard/events/$slug.tsx` (9 lines)
- `src/routes/dashboard/events/create.tsx` (34 lines)
- `src/routes/dashboard/events/index.tsx` (35 lines)
- `src/routes/dashboard/forbidden.tsx` (36 lines)
- `src/routes/dashboard/index.tsx` (217 lines)
- `src/routes/dashboard/members.tsx` (632 lines)
- `src/routes/dashboard/membership.tsx` (352 lines)
- `src/routes/dashboard/privacy.tsx` (16 lines)
- `src/routes/dashboard/profile.tsx` (21 lines)
- `src/routes/dashboard/reports.tsx` (31 lines)
- `src/routes/dashboard/select-org.tsx` (48 lines)
- `src/routes/dashboard/sin.tsx` (19 lines)
- `src/routes/dashboard/sin/analytics.tsx` (56 lines)
- `src/routes/dashboard/sin/forms.tsx` (80 lines)
- `src/routes/dashboard/sin/forms/$formId.tsx` (105 lines)
- `src/routes/dashboard/sin/imports.tsx` (85 lines)
- `src/routes/dashboard/sin/index.tsx` (69 lines)
- `src/routes/dashboard/sin/reporting.tsx` (110 lines)
- `src/routes/dashboard/sin/submissions/$submissionId.tsx` (159 lines)
- `src/routes/dashboard/route.tsx` (16 lines)
- `src/routes/dashboard/settings.tsx` (14 lines)
- `src/routes/dashboard/teams.tsx` (13 lines)
- `src/routes/dashboard/teams/$teamId.index.tsx` (305 lines)
- `src/routes/dashboard/teams/$teamId.manage.tsx` (325 lines)
- `src/routes/dashboard/teams/$teamId.members.tsx` (396 lines)
- `src/routes/dashboard/teams/$teamId.tsx` (22 lines)
- `src/routes/dashboard/teams/browse.tsx` (198 lines)
- `src/routes/dashboard/teams/create.tsx` (332 lines)
- `src/routes/dashboard/teams/index.tsx` (187 lines)

#### index.tsx

- `src/routes/index.tsx` (15 lines) - Landing page route (redirects authenticated users).

#### onboarding

- `src/routes/onboarding/index.tsx` (165 lines)
- `src/routes/onboarding/route.tsx` (42 lines)

### src/shared

- `src/shared/contexts/ThemeContext.tsx` (38 lines) - React context provider for theme state.
  ThemeProvider wraps app and exposes theme/resolvedTheme/setTheme/toggleTheme via useTheme
  hook. Delegates to useTheme hook implementation for persistence and system detection.
- `src/shared/hooks/useAsyncState.ts` (67 lines) - Typed async state machine hook.
  Manages idle/loading/success/error states as discriminated union with execute/reset/setData
  helpers and boolean status flags. Ensures mutually exclusive states.
- `src/shared/hooks/useFocusOnMount.ts` (72 lines) - Focus management utilities.
  useFocusOnMount returns a ref that auto-focuses on mount; createFocusManager provides
  refs array with focusNext/focusPrevious/focusFirst/focusLast for multi-element navigation.
- `src/shared/hooks/useLocalStorage.ts` (134 lines) - SSR-safe localStorage state hook.
  Syncs React state with localStorage, handles serialization, cross-tab synchronization via
  storage events, and provides removeValue function. Graceful fallback when localStorage unavailable.
- `src/shared/hooks/useTheme.ts` (65 lines) - Theme preference hook with system detection.
  Manages light/dark/system theme modes, listens for prefers-color-scheme changes, persists
  to localStorage, applies 'dark' class to document root. Returns theme/resolvedTheme/toggleTheme.
- `src/shared/lib/csv.ts` (18 lines)
- `src/shared/lib/json.ts` (22 lines)
- `src/shared/lib/utils.ts` (6 lines)
- `src/shared/lib/xlsx.ts` (94 lines) - Excel XLSX file generation utility.
  generateXlsx creates proper .xlsx files from JSON row data using xlsx library, with
  auto-column-width sizing and configurable max width. Returns Buffer for download.

### src/shims

- `src/shims/async-local-storage.browser.ts` (26 lines)
- `src/shims/stream-web.browser.ts` (8 lines)
- `src/shims/stream.browser.ts` (16 lines)

### src/tenant

- `src/tenant/__tests__/feature-gates.test.ts` (97 lines)
- `src/tenant/__tests__/tenant-env.test.ts` (52 lines)
- `src/tenant/feature-gates.ts` (54 lines)
- `src/tenant/index.ts` (22 lines)
- `src/tenant/tenant-env.ts` (56 lines)
- `src/tenant/tenant.types.ts` (73 lines)
- `src/tenant/tenants/qc.ts` (63 lines)
- `src/tenant/tenants/viasport.ts` (63 lines)

### src/tests

- `src/tests/mocks/auth.ts` (66 lines) - Test mocks for Better Auth client/session.
- `src/tests/setup.ts` (181 lines) - Vitest global setup, DOM mocks, and TanStack Start test shims.
- `src/tests/utils.tsx` (43 lines)
- `src/tests/utils/router.tsx` (205 lines) - TanStack Router test helpers and mock user context.

### src/types

- `src/types/env.d.ts` (5 lines)

### src/workers

- `src/workers/import-batch.ts` (29 lines) - CLI worker for batch import execution.
  Parses --job-id from argv, optionally uses SIN_IMPORT_ACTOR_USER_ID env var, and calls
  runBatchImportJob. Designed for background/cron job execution.

## Tech Debt / Accuracy Notes

- Better Auth cookie cache is disabled due to upstream bug (see src/lib/auth/server-helpers.ts).
- Root route duplicates server/client user fetch logic (see src/routes/\_\_root.tsx).
- createServerFn without inputValidator: `src/features/auth/auth.queries.ts`, `src/features/auth/mfa/mfa.mutations.ts`, `src/features/profile/profile.queries.ts`, `src/features/settings/settings.queries.ts`, `src/lib/server/auth.ts`

## Files to Add

New files created after 2025-12-24T21:05:08Z that need documentation:

### E2E Tests

### Scripts

### UI Components

### Features - Layouts

### Features - Organizations

### Features - Privacy

### Routes - Dashboard Admin SIN

### Routes - Dashboard SIN

### Tenant Module (New)

## Files to Update

Existing files modified after 2025-12-24T21:05:08Z that need documentation refresh:

### Scripts

### UI Components

### Database Schema

### Features - Audit

### Features - Auth

### Features - Dashboard

### Features - Events

### Features - Forms

### Features - Imports

### Features - Layouts

### Features - Members

### Features - Membership

### Features - Notifications

### Features - Organizations

### Features - Privacy

### Features - Reporting

### Features - Reports

### Features - Roles

### Features - Security

### Features - Teams

### Lib - Auth

### Lib - Other

### Routes

### Config
