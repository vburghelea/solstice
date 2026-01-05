# Update Notes - User Interface (UI-AGG)

## Verified 2026-01-05

UI-AGG-006 support request enhancements verified in `sin-dev`:

- ✅ Support request submission with priority selection (Low/Normal/High/Urgent)
- ✅ Priority badge displayed in "Your requests" list
- ✅ Admin response form shows status/priority/SLA fields
- ✅ Response saved successfully with toast confirmation
- ✅ Notification created with type `support_request_update` and category `support`
- ✅ Notification links to `/dashboard/sin/support`

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:03 PST

- UI-AGG-006: Support requests now include priority, attachments, and SLA targets, and responses/status changes dispatch in-app/email notifications. Evidence: `src/features/support/support.mutations.ts`, `src/features/support/support.queries.ts`, `src/features/support/components/support-admin-panel.tsx`, `src/features/support/components/support-requests-panel.tsx`, `src/db/schema/support.schema.ts`.

## 2026-01-04 13:49 PST

- UI-AGG-001: Organization registration is not self-serve; users are invited or submit join requests, while org creation/invites live in admin-only tooling; evidence: `src/routes/dashboard/select-org.tsx`, `src/features/organizations/join-requests/components/join-request-browser.tsx`, `src/features/organizations/components/organization-admin-panel.tsx`, `src/routes/dashboard/admin/sin/organizations.tsx`.
- UI-AGG-002: Role-aware dashboards are implemented for the SIN portal, but the default dashboard and admin home are static (no role-specific widgets), so coverage is partial outside SIN; evidence: `src/routes/dashboard/sin/index.tsx`, `src/routes/dashboard/index.tsx`, `src/routes/dashboard/admin/index.tsx`.
- UI-AGG-003: The UI supports light/dark themes via CSS variables, but there is no explicit color-contrast tool, and Lighthouse report artifacts are not present in-repo (config only); evidence: `src/components/ThemeToggle.tsx`, `src/shared/hooks/useTheme.ts`, `src/styles.css`, `performance/lighthouse.config.cjs`.
- UI-AGG-004: Notification preferences are per-user categories/frequency (not role-based), templates are gated to SIN admin, and reporting reminders default to 14/7/3/1 days unless overridden; evidence: `src/features/notifications/components/notification-preferences-card.tsx`, `src/features/notifications/notifications.schemas.ts`, `src/features/notifications/notifications.queries.ts`, `src/features/notifications/components/notification-template-panel.tsx`, `src/features/reporting/reporting.mutations.ts`.
- UI-AGG-006: Support requests have status tracking and admin response UI, but responses do not trigger email or in-app notifications; evidence: `src/features/support/support.mutations.ts`, `src/features/support/components/support-admin-panel.tsx`, `src/features/support/components/support-requests-panel.tsx`.
- UI-AGG-007: Branding is configured via tenant code and CSS variables rather than admin settings; evidence: `src/tenant/tenants/viasport.ts`, `src/tenant/tenants/qc.ts`, `src/styles.css`, `src/components/ui/logo.tsx`.
