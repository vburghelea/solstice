# Tenant Distribution + Route Tree Implementation Plan

This plan converts the current single-tenant QC-centric app into a dual-distribution
(QC + viaSport) platform with a tenant-driven route tree, feature gating, org context,
and branding. It is a file-by-file implementation plan with explicit sequencing.

## Context to Read Before Implementing

### High-level RFP + architecture context

- `docs/sin-rfp/Gpt-5.2-pro-conversaion.md`
- `docs/sin-rfp/system-requirements-addendum.md`
- `docs/sin-rfp/viasport-sin-rfp.md`
- `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`
- `docs/sin-rfp/phase-0/architecture-reference.md`
- `docs/sin-rfp/phase-0/security-controls.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`

### Repo-wide rules + architecture notes

- `AGENTS.md`
- `CLAUDE.md`
- `CODE_GUIDE.md`
- `.cursor/rules/*` (expected, but not present; only `.cursor/rules_unused/` exists)
- `docs/quadball-plan/*` (read as needed for feature-specific decisions)

### Existing layout + navigation

- `src/features/layouts/admin-layout.tsx`
- `src/features/layouts/admin-nav.ts`
- `src/components/ui/admin-sidebar.tsx`
- `src/components/ui/mobile-admin-header.tsx`
- `src/components/ui/breadcrumbs.tsx`
- `src/styles.css`

### Existing routing

- [x] `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/onboarding/route.tsx`
- `src/routes/dashboard/route.tsx`
- `src/routes/dashboard/index.tsx`
- `src/routes/dashboard/forbidden.tsx`
- `src/routes/dashboard/admin/route.tsx`
- `src/routes/dashboard/admin/roles.tsx`
- `src/routes/dashboard/admin/sin.tsx`
- `src/routes/dashboard/events.tsx` + `src/routes/dashboard/events/*`
- `src/routes/dashboard/teams.tsx` + `src/routes/dashboard/teams/*`
- `src/routes/api/*` (Square callbacks/webhooks)
- `src/routes/api/health.ts`

### Org context + auth guards

- `src/lib/auth/guards/route-guards.ts`
- `src/lib/auth/guards/org-guard.ts`
- `src/lib/auth/guards/org-context.ts`
- `src/lib/auth/middleware/auth-guard.ts`
- `src/lib/auth/utils/admin-check.ts`
- `src/lib/server/errors.ts`

### Tenant-sensitive features to gate

- `src/features/organizations/*`
- `src/features/audit/*`
- `src/features/forms/*`
- `src/features/imports/*`
- `src/features/reporting/*`
- `src/features/reports/*`
- `src/features/security/*`
- `src/features/privacy/*`
- `src/features/notifications/*`
- `src/features/membership/*`
- `src/features/events/*`
- `src/features/teams/*`
- `src/features/members/*`

### Branding + auth

- `src/features/auth/components/login.tsx`
- `src/features/auth/components/signup.tsx`
- `src/features/dashboard/PublicPortalPage.tsx`
- `src/components/ui/logo.tsx`
- `src/lib/auth/server-helpers.ts`
- `src/lib/email/sendgrid.ts`
- `vite.config.ts` (PWA manifest)

### Environment + infra

- `src/lib/env.client.ts`
- `src/lib/env.server.ts`
- `sst.config.ts`
- `sst-env.d.ts`
- `.env`, `.env.local`, `.env.e2e` (values only, do not commit)
- `src/db/schema/organizations.schema.ts`
- `src/db/migrations/*` (org type enum migration)

---

## End State (Route Tree)

This is the target route tree. It keeps `/dashboard/*` as the main authenticated shell
and splits SIN admin into sub-routes. It introduces `/dashboard/sin/*` for viaSport
user-facing SIN features and `/dashboard/select-org` for org context selection.

```txt
src/routes/
  __root.tsx
  index.tsx

  auth/
    route.tsx
    login.tsx
    signup.tsx

  onboarding/
    route.tsx
    index.tsx

  api/
    ... (unchanged)

  dashboard/
    route.tsx                 # AppLayout
    index.tsx                 # QC dashboard OR redirect to /dashboard/sin
    forbidden.tsx
    profile.tsx
    settings.tsx
    privacy.tsx
    select-org.tsx            # NEW

    # QC product (existing)
    membership.tsx
    members.tsx
    reports.tsx

    events.tsx
    events/
      index.tsx
      create.tsx
      $slug.tsx
      $slug.index.tsx
      $slug.register.tsx
      $eventId.manage.tsx

    teams.tsx
    teams/
      index.tsx
      browse.tsx
      create.tsx
      $teamId.tsx
      $teamId.index.tsx
      $teamId.manage.tsx
      $teamId.members.tsx

    # viaSport product (NEW)
    sin.tsx                   # layout + org selection guard
    sin/
      index.tsx
      reporting.tsx
      forms.tsx
      forms/
        $formId.tsx
      submissions/
        $submissionId.tsx
      imports.tsx
      analytics.tsx

    admin/
      route.tsx               # admin subnav layout inside AppLayout
      index.tsx               # admin landing
      roles.tsx

      sin.tsx                 # SIN Admin layout (subnav + outlet)
      sin/
        index.tsx
        organizations.tsx
        audit.tsx
        notifications.tsx
        security.tsx
        privacy.tsx
        forms.tsx
        imports.tsx
        reporting.tsx
        analytics.tsx
```

**Adjustment to the GPT conversation tree:** keep a single AppLayout for `/dashboard/*`
so the sidebar is consistent and we avoid double sidebars. Admin and SIN Admin
subnavs render inside the content area for `/dashboard/admin/*` and
`/dashboard/admin/sin/*`.

---

## Phase 0 — Tenant Model & Feature Flags (Foundation)

### Create tenant config and feature gating

- [x] `src/tenant/tenant.types.ts`
  - Define `TenantKey`, `FeatureKey`, `TenantConfig`, `BrandConfig`.
  - Add `OrgTypeLabelMap`, `OrgHierarchyRules`, `AdminRoleNames`.
  - FeatureKey set should include baseline vs SIN features, for example:
    - Distribution: `qc_portal`, `sin_portal`
    - QC modules: `qc_membership`, `qc_events`, `qc_teams`, `qc_members_directory`,
      `qc_reports`, `qc_payments_square`
    - SIN admin modules: `sin_admin`, `sin_admin_orgs`, `sin_admin_audit`,
      `sin_admin_notifications`, `sin_admin_security`, `sin_admin_privacy`,
      `sin_admin_forms`, `sin_admin_imports`, `sin_admin_reporting`,
      `sin_admin_analytics`
    - SIN user modules: `sin_reporting`, `sin_forms`, `sin_imports`, `sin_analytics`
    - Platform baseline: `security_core`, `notifications_core`
  - Default baseline features to `true` for both tenants unless explicitly disabled.
- [x] `src/tenant/tenant-env.ts`
  - Read `TENANT_KEY` (server) and `VITE_TENANT_KEY` (client).
  - Default to `qc`, validate against allowed values.
  - Hard-fail on mismatch if both are present (canonical rule):
    - Server: `TENANT_KEY ?? VITE_TENANT_KEY ?? "qc"`
    - Client: `VITE_TENANT_KEY ?? "qc"`
    - If both exist and differ: throw (dev + prod)
- [x] `src/tenant/tenants/qc.ts`
  - QC branding, feature flags, org labels, hierarchy rules.
- [x] `src/tenant/tenants/viasport.ts`
  - viaSport branding, feature flags, org labels, hierarchy rules.
- [x] `src/tenant/index.ts`
  - Export `tenant`, `getTenantConfig()`, `isTenant()`, `getBrand()`.
- [x] `src/tenant/feature-gates.ts`
  - `isFeatureEnabled(key)`
  - `assertFeatureEnabled(key)` for server calls
  - `requireFeatureInRoute(key)` for route `beforeLoad`
  - `filterNavItems(items, user)` helper for UI gating

### Wire env values

- [x] `src/lib/env.client.ts`
  - Add `VITE_TENANT_KEY` to client env schema.
- [x] `src/lib/env.server.ts`
  - Add `TENANT_KEY` and `VITE_TENANT_KEY` to server env schema.
  - Suggested schema:
    - `TENANT_KEY: z.enum([\"qc\", \"viasport\"]).prefault(\"qc\")`
    - `VITE_TENANT_KEY: z.enum([\"qc\", \"viasport\"]).optional()`
- [x] `sst.config.ts`
  - Set `TENANT_KEY` and `VITE_TENANT_KEY` in `environment`.
  - Use different values per AWS account/stage.
  - Prefer canonical stages: `qc-dev`, `sin-dev`, `qc-perf`, `sin-perf`,
    `qc-prod`, `sin-prod` (prefix selects tenant, suffix selects env class).
    Hard-fail if canonical stage implies a tenant that disagrees with
    `TENANT_KEY`/`VITE_TENANT_KEY`.
  - Optional: derive `app.name` from tenant (e.g., `solstice-qc`, `solstice-viasport`)
    if you want separate stack names. Decide before changing to avoid state churn.

### Add real `league` org type (Decision: Option A)

- [x] `src/db/schema/organizations.schema.ts`
  - Add `league` to `organizationTypeEnum`.
- [x] `src/features/organizations/organizations.schemas.ts`
  - Add `league` to `organizationTypeSchema`.
- [x] `src/features/organizations/components/organization-admin-panel.tsx`
  - Add `league` to org type options.
- [x] `src/features/reporting/reporting.schemas.ts`
  - Add `league` to `reportingOrganizationTypeSchema`.
- [x] `src/features/reporting/components/reporting-dashboard-shell.tsx`
  - Add `league` to `organizationTypeOptions`.
- [x] `src/db/migrations/*`
  - Generate + apply enum migration (`organization_type`).
  - Org hierarchy note:
    - viaSport: `governing_body → pso → league → club → (teams)`
    - QC: `pso → league → club → (teams)` (QC can set root as `pso` or `governing_body`)

---

## Phase 1 — Global Admin Roles + Tenant-Aware Permissions

### Replace hard-coded role names with tenant config

- [x] `src/lib/auth/utils/admin-check.ts`
  - Use `tenant.admin.globalRoleNames` for global admin checks.
- [x] `src/features/roles/permission.service.ts`
  - Use tenant role names in `isGlobalAdmin()` and `isAnyAdmin()`.
- [x] `src/features/roles/permission.server.ts`
  - Use tenant role names in server checks.
  - Ensure tenant role names match existing seeded roles (or update seeds/tests).

### Update role UI + tests

- [x] `src/features/roles/components/role-management-dashboard.tsx`
  - Replace “Solstice/Quadball” copy with tenant brand.
- [x] `src/features/roles/__tests__/permission.service.test.ts`
  - Update expected global role names.
- [x] `src/features/roles/components/__tests__/role-management-dashboard.test.tsx`
  - Update snapshot/copy expectations.

### Seed scripts

- [x] `scripts/seed-global-admins.ts`
  - Derive default global roles from tenant config.
  - Add viaSport global admin role(s) if absent.

---

## Phase 2 — Server-Side Feature Gating (Non-negotiable)

Add `assertFeatureEnabled()` at the top of each server function to ensure
QC cannot call viaSport-only endpoints even if URLs are guessed.

### QC-only features

- [x] `src/features/membership/membership.queries.ts`
- [x] `src/features/membership/membership.mutations.ts`
- [x] `src/features/membership/membership.admin-queries.ts`
- [x] `src/features/events/events.queries.ts`
- [x] `src/features/events/events.mutations.ts`
- [x] `src/features/teams/teams.queries.ts`
- [x] `src/features/teams/teams.mutations.ts`
- [x] `src/features/teams/teams.cleanup.ts`
- [x] `src/features/members/members.queries.ts`

### viaSport SIN features

- [x] `src/features/organizations/organizations.queries.ts`
- [x] `src/features/organizations/organizations.mutations.ts`
- [x] `src/features/audit/audit.queries.ts`
- [x] `src/features/forms/forms.queries.ts`
- [x] `src/features/forms/forms.mutations.ts`
- [x] `src/features/imports/imports.queries.ts`
- [x] `src/features/imports/imports.mutations.ts`
- [x] `src/features/reporting/reporting.queries.ts`
- [x] `src/features/reporting/reporting.mutations.ts`
- [x] `src/features/reports/reports.queries.ts`
- [x] `src/features/reports/reports.mutations.ts`
- [x] `src/features/security/security.queries.ts`
- [x] `src/features/security/security.mutations.ts`
- [x] `src/features/privacy/privacy.queries.ts`
- [x] `src/features/privacy/privacy.mutations.ts`
- [x] `src/features/notifications/notifications.queries.ts`
- [x] `src/features/notifications/notifications.mutations.ts`
  - Template CRUD guarded by `sin_admin_*`; user preference endpoints stay
    enabled under `notifications_core`.
  - Keep core security/notification protections enabled even when SIN admin is off.

### API routes to gate

- [x] `src/routes/api/payments/square/callback.ts`
- [x] `src/routes/api/webhooks/square.ts`
- [x] `src/routes/api/test-square.ts`
- [x] `src/routes/api/debug-square.ts`

---

## Phase 3 — Navigation + Layout Refactor

### Navigation types and generators

- [x] `src/features/layouts/nav.types.ts`
  - `NavItem` type with `feature`, `requiresGlobalAdmin`, `requiresOrgRole`.
- [x] `src/features/layouts/app-nav.ts`
  - Build nav lists for QC vs viaSport based on feature flags.
- [x] `src/features/layouts/admin-nav.ts`
  - Convert from static arrays to `getAdminNav()`.
- [x] `src/features/layouts/sin-admin-nav.ts`
  - Add SIN Admin subnav items.

### Layout components

- [x] `src/features/layouts/app-layout.tsx`
  - New AppLayout used by `/dashboard/route.tsx`.
- [x] `src/components/ui/app-sidebar.tsx`
  - Single sidebar with sections (Portal / Admin Console / Account).
- [x] `src/features/layouts/admin-layout.tsx`
  - Either remove or convert to a lightweight AdminSectionLayout
    (no sidebar; AppLayout already provides it).
- [x] `src/components/ui/mobile-app-header.tsx`
  - New mobile header for AppLayout with brand + NotificationBell.
- [x] `src/components/ui/mobile-admin-header.tsx`
  - Tenant-driven brand text and “Admin Console”.
- [x] `src/components/ui/breadcrumbs.tsx`
  - Add labels for `sin`, `organizations`, `audit`, `notifications`, etc.

---

## Phase 4 — Route Refactor to Target Tree

### Base layout

- [x] `src/routes/dashboard/route.tsx`
  - Render `AppLayout` and keep `requireAuthAndProfile` guard.
- [x] `src/routes/onboarding/route.tsx`
  - Use AppLayout or a minimal layout; keep redirect logic.

### QC routes (gated)

- [x] `src/routes/dashboard/index.tsx`
  - Redirect to `/dashboard/sin` for viaSport tenant.
- [x] `src/routes/dashboard/membership.tsx`
  - Add `beforeLoad` feature gate `qc_membership`.
- [x] `src/routes/dashboard/members.tsx`
  - Add `beforeLoad` feature gate `qc_members_directory`.
- [x] `src/routes/dashboard/reports.tsx`
  - Add `beforeLoad` feature gate `qc_reports`.
- [x] `src/routes/dashboard/events.tsx`
  - Add `beforeLoad` feature gate `qc_events` (covers child routes).
- [x] `src/routes/dashboard/teams.tsx`
  - Add `beforeLoad` feature gate `qc_teams` (covers child routes).

### viaSport SIN user portal

- [x] `src/routes/dashboard/sin.tsx` (NEW)
  - Layout route: `requireFeatureInRoute("sin_portal")`
  - Enforce active org selection or redirect to `/dashboard/select-org`.
- [x] `src/routes/dashboard/sin/index.tsx` (NEW)
  - SIN landing with cards linking to reporting/forms/imports/analytics.
- [x] `src/routes/dashboard/sin/reporting.tsx` (NEW)
  - Render reporting user dashboard (subset of `ReportingDashboardShell`).
- [x] `src/routes/dashboard/sin/forms.tsx` (NEW)
  - List assigned forms for active org.
- [x] `src/routes/dashboard/sin/forms/$formId.tsx` (NEW)
  - Form submission view using existing form renderer.
- [x] `src/routes/dashboard/sin/submissions/$submissionId.tsx` (NEW)
  - Submission detail and history view.
- [x] `src/routes/dashboard/sin/imports.tsx` (NEW)
  - Read-only status view for imports (if needed for users).
- [x] `src/routes/dashboard/sin/analytics.tsx` (NEW)
  - Report builder/export UI gated by org role.

### Admin routes

- [x] `src/routes/dashboard/admin/route.tsx`
  - Render AdminSectionLayout and keep `requireGlobalAdmin` guard.
- [x] `src/routes/dashboard/admin/index.tsx` (NEW)
  - Admin landing links: Roles + SIN Admin.
- [x] `src/routes/dashboard/admin/sin.tsx`
  - Convert to layout route with `SinAdminSubnav` + `<Outlet />`.
  - Gate at the parent layout route whenever possible to avoid per-page misses.
- [x] `src/routes/dashboard/admin/sin/index.tsx` (NEW)
  - Overview cards for SIN admin modules.
- [x] `src/routes/dashboard/admin/sin/organizations.tsx`
  - Render `OrganizationAdminPanel`.
- [x] `src/routes/dashboard/admin/sin/audit.tsx`
  - Render `AuditLogTable`.
- [x] `src/routes/dashboard/admin/sin/notifications.tsx`
  - Render notification admin UI.
- [x] `src/routes/dashboard/admin/sin/security.tsx`
  - Render `SecurityDashboard`.
- [x] `src/routes/dashboard/admin/sin/privacy.tsx`
  - Render `PrivacyDashboard`, `PrivacyAdminPanel`, `RetentionPolicyPanel`.
- [x] `src/routes/dashboard/admin/sin/forms.tsx`
  - Render `FormBuilderShell`.
- [x] `src/routes/dashboard/admin/sin/imports.tsx`
  - Render `ImportWizardShell`.
- [x] `src/routes/dashboard/admin/sin/reporting.tsx`
  - Render `ReportingDashboardShell`.
- [x] `src/routes/dashboard/admin/sin/analytics.tsx`
  - Render `ReportBuilderShell`.

### Org selection

- [x] `src/routes/dashboard/select-org.tsx` (NEW)
  - Org selection UI (see Phase 5).

---

## Phase 5 — Org Context & Org Switcher

### Org access model

- [x] `src/features/organizations/organizations.access.ts` (NEW)
  - Compute accessible orgs for a user via membership + delegated access + descendants.
- [x] `src/features/organizations/organizations.queries.ts`
  - Add `listAccessibleOrganizations()` for OrgSwitcher.
- [x] `src/features/organizations/organizations.mutations.ts`
  - Enforce tenant hierarchy rules on create/update.

### Client org context

- [x] `src/features/organizations/components/org-switcher.tsx` (NEW)
  - Render accessible orgs and set `active_org_id` cookie.
- [x] `src/features/organizations/org-context.tsx` (NEW)
  - React context and hook for active org id.

### Server org context

- [x] `src/lib/auth/guards/org-context.ts`
  - Prefer cookie (`active_org_id`), allow `x-organization-id` override,
    always verify membership server-side.
- [x] `src/lib/auth/middleware/auth-guard.ts`
  - Include resolved org id/role in function context.
- [x] `src/start.ts`
  - Add client-side function middleware to pass active org if needed.
  - Cookie config (if set via server response):
    - `httpOnly: true`, `secure: isProduction()`, `sameSite: \"lax\"`
    - `maxAge: 60 * 60 * 24 * 30` (30 days)

---

## Phase 6 — Tenant Branding + Copy

Replace hard-coded QC copy with tenant-driven branding.

- `src/routes/__root.tsx`
  - Use tenant brand for `<title>` and meta description.
  - Add `data-tenant` attribute for CSS overrides.
- [x] `src/styles.css`
  - Add `[data-tenant="viasport"]` CSS variable overrides.
- [x] `src/components/ui/logo.tsx`
  - Use tenant-specific logo and alt text.
- [x] `src/components/ui/app-sidebar.tsx`
  - Brand name + subtitle from tenant config.
- [x] `src/components/ui/mobile-app-header.tsx`
  - Tenant brand + subtitle.
- [x] `src/components/ui/admin-sidebar.tsx`
  - Tenant brand + “Admin Console” label.
- [x] `src/components/ui/mobile-admin-header.tsx`
  - Tenant brand + “Admin Console” label.
- [x] `src/features/auth/components/login.tsx`
- [x] `src/features/auth/components/signup.tsx`
- [x] `src/features/dashboard/PublicPortalPage.tsx`
- [x] `src/features/dashboard/MemberDashboard.tsx`
- [x] `src/routes/dashboard/index.tsx`
- [x] `src/routes/dashboard/membership.tsx`
- [x] `src/routes/dashboard/members.tsx`
- [x] `src/routes/dashboard/forbidden.tsx`
- [x] `src/lib/auth/server-helpers.ts`
  - Use tenant brand for `appName` and 2FA issuer.
- [x] `src/lib/email/sendgrid.ts`
- [x] `vite.config.ts`
  - Make PWA manifest tenant-aware (name, short_name, theme_color, icons).
  - Store tenant-specific icons under `public/icons/` (e.g., `viasport-icon.svg`).

---

## Phase 7 — QA, Tests, and Docs

### Tests

- [x] `src/features/layouts/__tests__/admin-layout.test.tsx`
  - Update for AppLayout + tenant branding.
- [x] `src/features/roles/__tests__/permission.service.test.ts`
- [x] `src/features/roles/components/__tests__/role-management-dashboard.test.tsx`
- [x] `src/tenant/__tests__/feature-gates.test.ts`
- [x] `src/tenant/__tests__/tenant-env.test.ts`
- [x] `e2e/tests/*`
  - Add checks: QC cannot access `/dashboard/sin/*`.
  - viaSport redirects `/dashboard` → `/dashboard/sin`.

### Documentation

- [x] `docs/sin-rfp/phase-0/architecture-reference.md`
  - Add tenant distribution layer explanation.
- [x] `docs/sin-rfp/phase-0/security-controls.md`
  - Add note on server-side feature gating.
- [x] `docs/sin-rfp/phase-0/audit-retention-policy.md`
  - Ensure policy references org-scoped auditing.
- [x] `docs/sin-rfp/route-tree-implementation-plan.md`
  - Keep environment mismatch hard-fail requirements and org hierarchy notes.

---

## Notes & Guardrails

- Do not introduce non-ASCII content in code files unless it already exists.
- Server-only imports must remain inside `handler()` (TanStack Start rule).
- Feature gating must be done in three layers: UI, route guard, server fn.
- Prefer a single AppLayout for `/dashboard/*` to avoid double sidebars.
- Org type labels can be tenant-specific, but the DB enum must include `league`.
- Tenant key mismatch must hard-fail (dev + prod).

---

## Sequencing Summary

1. Tenant model + env wiring (Phase 0)
2. Global admin role + permission wiring (Phase 1)
3. Server-side feature gating (Phase 2)
4. AppLayout + nav refactor (Phase 3)
5. Route tree refactor (Phase 4)
6. Org context + org switcher (Phase 5)
7. Branding + tenant copy (Phase 6)
8. Tests + docs (Phase 7)

This sequence minimizes churn and prevents QC from accessing viaSport-only endpoints
at any step.
