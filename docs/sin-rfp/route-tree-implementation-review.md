# Route Tree Implementation Review (In Progress)

## Scope

- Compare current working tree changes against `docs/sin-rfp/route-tree-implementation-plan.md`.
- Focus on correctness, regressions, security/tenant gating, and missing tests.

## Progress Log

- 2025-02-??: Collected git status + diffs for tenant config, routing, layouts, org context, feature gating, branding, tests, and docs.
- 2025-02-??: Reviewed org admin, privacy, notification, and reporting server functions for access control gaps.

## Findings (Partial)

## Notes

- This document will be appended throughout the review, not only at the end.

### High

1. Saved report endpoints are not scoped to organization access.
   - `listSavedReports` returns all saved reports when no `organizationId` is provided, and mutations allow any authenticated user with `sin_analytics` to create/update/delete reports for arbitrary org IDs.
   - Impact: cross-org report metadata exposure and potential data tampering (saved report definitions) across tenants/orgs; `listSavedReports` has no auth guard, so unauth callers can enumerate reports.
   - Evidence: `src/features/reports/reports.queries.ts:13`, `src/features/reports/reports.queries.ts:23`, `src/features/reports/reports.mutations.ts:130`, `src/features/reports/reports.mutations.ts:171`, `src/features/reports/components/report-builder-shell.tsx:296`.
   - Suggested fix: enforce `requireOrganizationAccess` for organization-scoped saved reports and scope list queries to the caller’s active org or accessible org list.

2. SIN organization admin endpoints are missing admin enforcement (privilege escalation).
   - `createOrganization` only checks `sin_admin_orgs` + session, so any signed-in user can create orgs and become owner. `searchOrganizations` and `listAllOrganizations` are labeled admin-only but have no auth/role guard.
   - Impact: non-admin users can create orgs and enumerate all orgs, bypassing intended SIN admin controls.
   - Evidence: `src/features/organizations/organizations.mutations.ts:120`, `src/features/organizations/organizations.queries.ts:96`, `src/features/organizations/organizations.queries.ts:123`.
   - Suggested fix: require `requireAdmin`/`PermissionService.isGlobalAdmin` for admin-only org mutations and list-all queries.

3. Privacy admin mutations are missing admin enforcement.
   - Admin-only actions (create policy documents, update privacy requests, retention policy upserts) only check `sin_admin_privacy` + session.
   - Impact: any authenticated user can publish privacy policy versions, change privacy request outcomes, or alter retention rules.
   - Evidence: `src/features/privacy/privacy.mutations.ts:23`, `src/features/privacy/privacy.mutations.ts:133`, `src/features/privacy/privacy.mutations.ts:171`.
   - Suggested fix: require `requireAdmin` for all `sin_admin_privacy` mutations.

4. Reporting queries allow unauthenticated access to sensitive org data.
   - `listReportingTasks` and `listReportingSubmissions` skip auth when no session exists; `listReportingTasks` returns all tasks when no filters are supplied; `listReportingCycles` is also unauthenticated.
   - Impact: unauth callers can enumerate reporting cycles, tasks, and submissions across orgs.
   - Evidence: `src/features/reporting/reporting.queries.ts:36`, `src/features/reporting/reporting.queries.ts:46`, `src/features/reporting/reporting.queries.ts:80`.
   - Suggested fix: require session and org access for all reporting queries, and block unauth access early.

### Medium

1. Active org selection can be bypassed or go stale across sessions.
   - `/dashboard/sin` relies on `context.activeOrganizationId` from `__root`, which reads localStorage/cookie without validating access. Logout does not clear `active_org_id`, so a new user can inherit a stale org and skip `/dashboard/select-org`.
   - Impact: users can land in SIN routes without a valid org selection; server functions still validate access, but the route guard no longer guarantees a valid org context.
   - Evidence: `src/routes/dashboard/sin.tsx:5`, `src/routes/__root.tsx:56`, `src/routes/__root.tsx:68`, `src/components/ui/app-sidebar.tsx:38`, `src/features/organizations/org-context.tsx:23`, `src/features/organizations/components/org-switcher.tsx:22`.
   - Suggested fix: clear `active_org_id` on logout and/or validate the active org against accessible orgs in `beforeLoad` before allowing SIN routes.

2. Report export relies on headers/filters that portal UI does not set.
   - `exportReport` looks for `x-organization-id` or `filters.organizationId`, but the analytics UI does not send either, so non-admin exports fail unless users hand-edit JSON filters.
   - Impact: portal analytics export is broken for non-admin users; delegated org access is ignored because `requireOrganizationMembership` is used.
   - Evidence: `src/features/reports/reports.mutations.ts:287`, `src/features/reports/reports.mutations.ts:301`, `src/features/reports/components/report-builder-shell.tsx:301`.
   - Suggested fix: derive org context from function middleware (`context.organizationId`) and use `requireOrganizationAccess` to support delegated access.

3. Delegated analytics scope does not grant access to analytics UI.
   - Delegated scope `analytics` maps to role `viewer`, but the SIN analytics route requires `owner|admin|reporter`.
   - Impact: users granted analytics-only delegated access are blocked from analytics.
   - Evidence: `src/features/organizations/organizations.access.ts:29`, `src/routes/dashboard/sin/analytics.tsx:16`.
   - Suggested fix: map `analytics` scope to a role allowed by the analytics route (or expand allowed roles).

4. Tenant env resolution imports client env in server contexts.
   - `tenant-env.ts` imports `env.client.ts`, which reads `import.meta.env` directly. This can throw in Node scripts (e.g., `tsx` seed scripts) where `import.meta.env` is undefined.
   - Impact: seed scripts that now call `getTenantConfig()` may crash outside Vite/SSR.
   - Evidence: `src/tenant/tenant-env.ts:2`, `src/lib/env.client.ts:19`, `scripts/seed-global-admins.ts:12`.
   - Suggested fix: avoid importing `env.client` in server contexts or guard `import.meta.env` access.

5. Global admins cannot manage orgs unless they are members.
   - Org admin endpoints rely on `requireOrganizationMembership` instead of `requireOrganizationAccess`, so global admins (or delegated access) are blocked from listing members, updating orgs, or reviewing delegated access unless they are explicitly added to the org. Admin UIs also call `listOrganizations` (member-scoped), so org dropdowns can be empty for global admins.
   - Impact: SIN admin workflows break for global admins who are not members of every org.
   - Evidence: `src/features/organizations/organizations.mutations.ts:205`, `src/features/organizations/organizations.queries.ts:156`, `src/features/forms/components/form-builder-shell.tsx:618`, `src/features/reporting/components/reporting-dashboard-shell.tsx:72`.
   - Suggested fix: use `requireOrganizationAccess` for admin flows or explicitly allow global admins.

6. Organization lookup by ID lacks auth/membership checks.
   - `getOrganization` only checks `sin_portal` and returns org data by ID without verifying access.
   - Impact: org metadata can be fetched by any caller who can reach the server function.
   - Evidence: `src/features/organizations/organizations.queries.ts:31`.
   - Suggested fix: require session and `requireOrganizationAccess` (or limit to active org).

7. Notification admin mutations lack admin checks, and notification creation is unauthenticated.
   - `createNotificationTemplate` and `scheduleNotification` only check `sin_admin_notifications` + session; `createNotification` has no session guard at all.
   - Impact: any authenticated (or unauthenticated) caller could create templates, schedule notifications, or send notifications for arbitrary users/orgs.
   - Evidence: `src/features/notifications/notifications.mutations.ts:122`, `src/features/notifications/notifications.mutations.ts:159`, `src/features/notifications/notifications.mutations.ts:248`.
   - Suggested fix: require `requireAdmin` for admin templates/scheduling and enforce actor identity for direct notification creation.

### Low

1. Analytics feature flag coupling is stricter than the plan implies.
   - Admin routes gate with `sin_admin_analytics`, but report server functions only check `sin_analytics`. If tenant config ever disables portal analytics while keeping admin analytics, admin analytics would break.
   - Evidence: `src/features/reports/reports.queries.ts:13`, `src/features/reports/reports.mutations.ts:267`, `src/routes/dashboard/admin/sin/analytics.tsx:9`.
   - Suggested fix: align server gating with `sin_admin_analytics` (or explicitly document that `sin_admin_analytics` implies `sin_analytics`).

2. Admin section copy references SIN even when SIN admin is disabled.
   - The admin section description always mentions “SIN administration,” which is misleading for QC-only tenants.
   - Evidence: `src/features/layouts/admin-layout.tsx:21`.
   - Suggested fix: conditional copy based on `sin_admin` feature flag.

3. New migration includes `form_submissions.import_job_id` outside the route-tree plan.
   - The plan only called for the `organization_type` enum update; this migration also adds `import_job_id`.
   - Impact: extra schema change without documentation; may be fine but should be tracked in plan/docs.
   - Evidence: `src/db/migrations/0011_curly_iron_man.sql:1`.
   - Suggested fix: update plan or document why this schema change is bundled here.

## Review Status

- In progress. Findings will continue to be appended.
