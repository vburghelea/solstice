# SIN-RFP Review Repomix Bundles

These overlapping bundles provide context for reviewing the SIN-RFP implementation.

## Summary

| Bundle | Focus                                   | Tokens | Has V2 Backlog | Has Requirements |
| ------ | --------------------------------------- | ------ | -------------- | ---------------- |
| 1      | Security & Access Control               | 43.8k  | via refs       | via refs         |
| 2      | Tenant & Routes                         | 44.5k  | via refs       | via refs         |
| 3      | Core Features (Forms/Imports/Reporting) | 54.9k  | No             | No               |
| 4      | Foundation (Orgs/Security)              | 43.0k  | Yes            | Yes              |
| 4b     | Notifications/Privacy/Audit             | 49.3k  | Yes            | No               |
| 5      | Documentation                           | 32.8k  | Yes            | Yes              |
| 6      | Tests & Auth                            | 46.2k  | Yes            | Yes              |

## Bundle 1: Security & Access Control (43.8k)

Covers the access control issues identified in `route-tree-implementation-review.md`.

```bash
npx repomix@latest --token-count-tree 50 --include "src/features/reports/reports.queries.ts,src/features/reports/reports.mutations.ts,src/features/reports/components/report-builder-shell.tsx,src/features/organizations/organizations.queries.ts,src/features/organizations/organizations.mutations.ts,src/features/organizations/organizations.access.ts,src/features/privacy/privacy.mutations.ts,src/features/privacy/privacy.queries.ts,src/features/reporting/reporting.queries.ts,src/features/reporting/reporting.mutations.ts,src/features/notifications/notifications.mutations.ts,src/features/notifications/notifications.queries.ts,src/lib/auth/guards/org-guard.ts,src/lib/auth/guards/org-context.ts,src/lib/auth/middleware/auth-guard.ts,src/lib/auth/utils/admin-check.ts,src/lib/server/errors.ts,src/features/roles/permission.service.ts,src/features/roles/permission.server.ts,docs/sin-rfp/route-tree-implementation-review.md,docs/sin-rfp/route-tree-implementation-plan.md" -o repomix-sin-bundle1-access-control.xml
```

## Bundle 2: Tenant & Routes (44.5k)

Covers tenant configuration, routing, layouts, and org context.

```bash
npx repomix@latest --token-count-tree 50 --include "src/tenant/**/*.ts,src/routes/__root.tsx,src/routes/dashboard/route.tsx,src/routes/dashboard/index.tsx,src/routes/dashboard/sin.tsx,src/routes/dashboard/sin/**/*.tsx,src/routes/dashboard/select-org.tsx,src/routes/dashboard/admin/route.tsx,src/routes/dashboard/admin/index.tsx,src/routes/dashboard/admin/sin.tsx,src/routes/dashboard/admin/sin/**/*.tsx,src/routes/dashboard/forbidden.tsx,src/routes/dashboard/membership.tsx,src/routes/dashboard/members.tsx,src/routes/dashboard/events.tsx,src/routes/dashboard/teams.tsx,src/routes/dashboard/reports.tsx,src/features/layouts/*.ts,src/features/layouts/*.tsx,src/features/organizations/org-context.tsx,src/features/organizations/components/org-switcher.tsx,src/components/ui/app-sidebar.tsx,src/components/ui/admin-sidebar.tsx,src/components/ui/mobile-app-header.tsx,src/components/ui/mobile-admin-header.tsx,src/components/ui/breadcrumbs.tsx,src/components/ui/logo.tsx,src/lib/env.client.ts,src/lib/env.server.ts,sst.config.ts,docs/sin-rfp/tenant-stage-mapping-plan.md,docs/sin-rfp/route-tree-implementation-plan.md" -o repomix-sin-bundle2-tenant-routes.xml
```

## Bundle 3: Core Features (54.9k)

Covers forms, imports, reporting, and reports feature implementations.

```bash
npx repomix@latest --token-count-tree 50 --include "src/features/forms/**/*.ts,src/features/forms/**/*.tsx,src/features/imports/**/*.ts,src/features/imports/**/*.tsx,src/features/reporting/**/*.ts,src/features/reporting/**/*.tsx,src/features/reports/**/*.ts,src/features/reports/**/*.tsx,src/db/schema/forms.schema.ts,src/db/schema/imports.schema.ts,src/db/schema/reporting.schema.ts,src/db/schema/reports.schema.ts,docs/sin-rfp/phase-0/import-batch-worker.md" -o repomix-sin-bundle3-core-features.xml
```

## Bundle 4: Foundation - Orgs & Security (43.0k)

Covers organizations and security infrastructure with backlog context.

```bash
npx repomix@latest --token-count-tree 50 --include "src/features/organizations/**/*.ts,src/features/organizations/**/*.tsx,src/features/security/**/*.ts,src/features/security/**/*.tsx,src/db/schema/organizations.schema.ts,src/db/schema/security.schema.ts,src/lib/security/**/*.ts,docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md,docs/sin-rfp/system-requirements-addendum.md" -o repomix-sin-bundle4-foundation.xml
```

## Bundle 4b: Notifications, Privacy & Audit (49.3k)

Covers notifications, privacy/DSAR, and audit logging with backlog context.

```bash
npx repomix@latest --token-count-tree 50 --include "src/features/notifications/**/*.ts,src/features/notifications/**/*.tsx,src/db/schema/notifications.schema.ts,src/lib/notifications/**/*.ts,src/lib/email/**/*.ts,src/features/privacy/**/*.ts,src/features/privacy/**/*.tsx,src/db/schema/privacy.schema.ts,src/features/audit/**/*.ts,src/features/audit/**/*.tsx,src/db/schema/audit.schema.ts,src/lib/audit/**/*.ts,docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md,docs/sin-rfp/phase-0/audit-retention-policy.md" -o repomix-sin-bundle4b-notifications-privacy.xml
```

## Bundle 5: Documentation (32.8k)

Covers SIN documentation, backlog, and implementation plans.

```bash
npx repomix@latest --token-count-tree 50 --include "docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md,docs/sin-rfp/catch-up-context.md,docs/sin-rfp/route-tree-implementation-plan.md,docs/sin-rfp/route-tree-implementation-review.md,docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md,docs/sin-rfp/SIN-REQUIREMENTS.md,docs/sin-rfp/phase-0/architecture-reference.md,docs/sin-rfp/phase-0/security-controls.md,docs/sin-rfp/phase-0/audit-retention-policy.md,docs/sin-rfp/phase-0/data-residency.md,docs/sin-rfp/phase-0/backup-dr-plan.md" -o repomix-sin-bundle5-docs.xml
```

## Bundle 6: Tests & Auth (46.2k)

Covers E2E tests and auth integration with backlog context.

```bash
npx repomix@latest --token-count-tree 50 --include "e2e/tests/authenticated/sin-*.ts,e2e/tests/authenticated/sin-*.spec.ts,src/features/auth/**/*.ts,src/features/auth/**/*.tsx,src/lib/auth/**/*.ts,src/routes/api/auth/**/*.ts,scripts/seed-global-admins.ts,scripts/seed-sin-data.ts,docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md,docs/sin-rfp/phase-0/security-controls.md" -o repomix-sin-bundle6-tests-auth.xml
```

## Cross-Cutting Files (Overlap)

### Key Context Docs

| Doc                                 | B1  | B2  | B3  | B4  | B4b | B5  | B6  |
| ----------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| SIN-IMPLEMENTATION-BACKLOG-V2.md    | ref | ref | -   | ✅  | ✅  | ✅  | ✅  |
| system-requirements-addendum.md     | ref | ref | -   | ✅  | -   | -   | -   |
| route-tree-implementation-plan.md   | ✅  | ✅  | -   | -   | -   | ✅  | -   |
| route-tree-implementation-review.md | ✅  | -   | -   | -   | -   | ✅  | -   |
| security-controls.md                | ref | ref | -   | -   | -   | ✅  | ✅  |
| audit-retention-policy.md           | ref | ref | -   | -   | ✅  | ✅  | -   |

### Code Overlap

| Feature             | B1  | B2      | B3  | B4  | B4b | B5  | B6  |
| ------------------- | --- | ------- | --- | --- | --- | --- | --- |
| organizations/\*    | ✅  | partial | -   | ✅  | -   | -   | -   |
| reports/\*          | ✅  | -       | ✅  | -   | -   | -   | -   |
| reporting/\*        | ✅  | -       | ✅  | -   | -   | -   | -   |
| privacy/\*          | ✅  | -       | -   | -   | ✅  | -   | -   |
| notifications/\*    | ✅  | -       | -   | -   | ✅  | -   | -   |
| security/\*         | -   | -       | -   | ✅  | -   | -   | -   |
| audit/\*            | -   | -       | -   | -   | ✅  | -   | -   |
| forms/\*            | -   | -       | ✅  | -   | -   | -   | -   |
| imports/\*          | -   | -       | ✅  | -   | -   | -   | -   |
| auth/\*             | ✅  | -       | -   | -   | -   | -   | ✅  |
| layouts/\*          | -   | ✅      | -   | -   | -   | -   | -   |
| tenant/\*           | -   | ✅      | -   | -   | -   | -   | -   |
| routes/dashboard/\* | -   | ✅      | -   | -   | -   | -   | -   |

## Recommended Review Order

### For route-tree-implementation-review.md (Security Audit)

1. **Bundle 1** (Access Control) - Direct focus on security findings
2. **Bundle 4** (Orgs/Security) - Foundation infrastructure
3. **Bundle 4b** (Notifications/Privacy/Audit) - Additional security surfaces

### For General SIN-RFP Progress Review

1. **Bundle 5** (Docs) - Understand requirements and current status
2. **Bundle 4 + 4b** (Foundation) - Review core infrastructure
3. **Bundle 3** (Core Features) - Review forms, imports, reporting
4. **Bundle 2** (Tenant/Routes) - Understand routing architecture
5. **Bundle 6** (Tests) - Verify E2E coverage

### For Tenant/Multi-Org Architecture Review

1. **Bundle 2** (Tenant/Routes) - Primary focus
2. **Bundle 4** (Orgs/Security) - Org infrastructure
3. **Bundle 1** (Access Control) - Org access patterns
