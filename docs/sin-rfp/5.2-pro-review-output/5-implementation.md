# SIN RFP Section 5 Implementation Review and Plan

## Scope and inputs

- Primary review source: `docs/sin-rfp/5.2-pro-review-output/5.md`.
- Related docs reviewed: `docs/sin-rfp/SIN-REQUIREMENTS.md`,
  `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`,
  `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`,
  `docs/sin-rfp/route-tree-implementation-review.md`,
  `docs/sin-rfp/phase-0/backup-dr-plan.md`,
  `docs/sin-rfp/phase-0/audit-retention-policy.md`,
  `docs/sin-rfp/phase-0/import-batch-worker.md`.
- Code areas reviewed: `src/features/reports`, `src/features/reporting`,
  `src/features/organizations`, `src/features/privacy`, `src/features/notifications`,
  `src/features/security`, `src/lib/imports`, `src/workers/import-batch.ts`,
  `src/tenant/tenant-env.ts`, `src/routes/__root.tsx`, `sst.config.ts`.

## Review of 5.md vs codebase

### Progress summary claims

5.md's summary is directionally consistent with the codebase:

- Core SIN features exist in code (forms, imports, reporting, audit, notifications,
  privacy, reports). Evidence: `src/features/forms`, `src/features/imports`,
  `src/features/reporting`, `src/features/audit`, `src/features/notifications`,
  `src/features/privacy`, `src/features/reports`.
- Security hardening remains incomplete. Multiple "High" findings from
  `docs/sin-rfp/route-tree-implementation-review.md` are still present in code
  (see Security Findings Alignment below).
- Production readiness is still pending. Infra wiring and evidence tasks listed
  in `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md` remain unresolved in
  code and deployment (queue/env/SES/restore tests).

### Requirement gaps (confirmed against code)

The following RFP requirements in `docs/sin-rfp/SIN-REQUIREMENTS.md` are not
implemented or are only partially addressed in code:

| Requirement                                                           | Code evidence                                                                                                                       | Gap summary                                                      |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| TO-AGG-001 Template Support                                           | No templates hub feature in `src/features` or routes. Existing templates are limited to imports mapping and notification templates. | Missing centralized templates tab and contextual template links. |
| TO-AGG-002 Guided Walkthroughs                                        | `src/routes/onboarding/index.tsx` handles policy + profile only.                                                                    | No onboarding or data upload tutorials.                          |
| TO-AGG-003 Reference Materials                                        | No help/FAQ feature or schema.                                                                                                      | Missing guides/FAQ system.                                       |
| UI-AGG-006 Support/Feedback                                           | No support/feedback schema or UI in `src/db/schema` or routes.                                                                      | Missing inquiry submission and admin responses.                  |
| DM-AGG-003 Data Catalog/Index                                         | RBAC exists, but no catalog or indexing feature in code.                                                                            | Missing discoverability layer.                                   |
| DM-AGG-004 Data Quality Monitoring                                    | Validation occurs on submit; no continuous monitoring cron or dashboard.                                                            | Missing automated checks and monitoring.                         |
| DM-AGG-005 Backup/DR Evidence                                         | Docs exist; no executed restore test evidence or archival job in code.                                                              | Missing runbook evidence and archival implementation.            |
| DM-AGG-006 Lane 2 Bulk Import                                         | Batch runner exists (`src/lib/imports/batch-runner.ts`,                                                                             |
| `src/workers/import-batch.ts`), but no ECS wiring in `sst.config.ts`. | Infra missing for batch execution.                                                                                                  |
| RP-AGG-005 Charts/Pivots                                              | Analytics UI is report builder only (`src/routes/dashboard/sin/analytics.tsx`).                                                     | No chart or pivot table tooling.                                 |

### Documentation inconsistencies (confirmed)

- Backlog "Security Controls Mapped to SIN Requirements" table still reads
  "To Build" even though the codebase includes MFA, audit, lockout, and privacy
  features. Evidence: `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`.
- Technical debt checklist shows pending infra/tests while the progress tracker
  marks items as "Complete". Evidence: `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`.
- Route-tree review remains "In Progress" with unresolved high-severity findings.
  Evidence: `docs/sin-rfp/route-tree-implementation-review.md`.
- Phase 0 docs promise Glacier/Object Lock archival but code only keeps audit logs
  in RDS and skips deletion. Evidence: `docs/sin-rfp/phase-0/audit-retention-policy.md`,
  `src/lib/privacy/retention.ts`.

### Security findings alignment (still open in code)

Key findings referenced in 5.md are still observable in current code:

- Saved reports scoping and auth gaps:
  `src/features/reports/reports.queries.ts` (no auth, org-wide cross-org list),
  `src/features/reports/reports.mutations.ts` (no org access validation).
- Org admin endpoints missing admin enforcement:
  `src/features/organizations/organizations.mutations.ts` (create),
  `src/features/organizations/organizations.queries.ts` (search/list-all/get).
- Privacy admin mutations missing `requireAdmin`:
  `src/features/privacy/privacy.mutations.ts` (create policy, update request,
  retention upsert).
- Reporting queries allow unauth access:
  `src/features/reporting/reporting.queries.ts` (list cycles/tasks/submissions).
- Notification creation and scheduling gaps:
  `src/features/notifications/notifications.mutations.ts` (createNotification
  unauth, schedule/create template lacks admin enforcement).
- Security events accept unauthenticated writes:
  `src/features/security/security.mutations.ts` (recordSecurityEvent).

### Adjustments needed to 5.md

5.md assumes some security patches were applied; the current code still reflects
the earlier findings. Any implementation plan should treat those issues as open
and add verification evidence after fixes.

## Implementation plan

### Phase 0 - Reconcile documentation and evidence (fast, high leverage)

1. Update `docs/sin-rfp/route-tree-implementation-review.md`:
   - Add a status column per finding (Open, Fixed, Verified).
   - Link to code changes and tests for each resolved item.
2. Update `docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`:
   - Fix the "Security Controls Mapped to SIN Requirements" table to reflect
     current implementation and link to evidence.
   - Align "Complete" status with infra/tests, not just code.
3. Add a requirements coverage matrix:
   - New doc: `docs/sin-rfp/requirements-coverage-matrix.md`.
   - Map each requirement to modules, tests, and evidence links.
4. Add "Implementation Status" callouts in Phase 0 docs:
   - Note what is implemented vs planned (audit archival, restore drills).

### Phase 1 - Access control and authZ sweep (critical)

1. Reports:
   - `src/features/reports/reports.queries.ts`: require session and org access;
     scope org-wide to same org; allow owner/shared/global-admin rules.
   - `src/features/reports/reports.mutations.ts`: validate org access and roles
     for create/update; restrict `isOrgWide` to org admins; use `context.organizationId`
     for exports and `requireOrganizationAccess` (not membership).
2. Organizations:
   - `src/features/organizations/organizations.mutations.ts`:
     require `requireAdmin` for create; restrict `type`/`parentOrgId` updates to
     global admin; fix `parentOrgId` update bug (do not null when omitted).
   - `src/features/organizations/organizations.queries.ts`:
     require session for `getOrganization`; require admin for search/list-all;
     restrict `listOrganizationMembers` to admin roles; filter membership status
     to active only.
3. Privacy:
   - `src/features/privacy/privacy.mutations.ts`: require `requireAdmin` and
     `requireRecentAuth` for policy creation, request updates, retention updates.
4. Notifications:
   - `src/features/notifications/notifications.mutations.ts`:
     require session for `createNotification` and set actor from session;
     require admin for template creation and scheduling; prevent `isSystem`
     from non-admin input.
5. Reporting:
   - `src/features/reporting/reporting.queries.ts`: require session for all
     queries; always enforce org access; restrict list cycles/tasks to admin
     or org roles as intended.
6. Security events:
   - `src/features/security/security.mutations.ts`: require session or allow
     only a narrow unauthenticated event allowlist; never accept userId from
     client input.

### Phase 2 - Org context hardening (reduce authZ regressions)

1. `src/routes/__root.tsx`: validate `active_org_id` server-side against
   `resolveOrganizationAccess` before adding to route context.
2. `src/features/organizations/org-context.tsx`:
   - Sync state with route context changes.
   - Scope query cache key by user id.
   - Gate query by authenticated user.
3. `src/components/ui/app-sidebar.tsx` and logout flow:
   - Clear localStorage and server cookie for `active_org_id`.
4. `src/routes/dashboard/select-org.tsx`:
   - Validate `redirect` param to `/dashboard/*` only.
5. `/dashboard/sin` guard:
   - Require org access, not just presence of org id.

### Phase 3 - Production readiness blockers

1. Lane 2 batch import infra:
   - Add ECS task definition + wiring in `sst.config.ts`.
   - Add EventBridge or SQS trigger to run `src/workers/import-batch.ts`.
   - Document outputs and secrets required by the task.
2. Notifications infra:
   - Ensure `SIN_NOTIFICATIONS_QUEUE_URL` set in SST outputs and secrets.
   - Verify DLQ and alarms are deployed and documented.
3. Email deliverability:
   - Verify SES domain, SPF/DKIM/DMARC; update
     `docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`.
4. Backup/DR evidence:
   - Run restore drill in dev or staging.
   - Add results doc (example: `docs/sin-rfp/backup-restore-test-results.md`).
5. Audit archival:
   - Either implement Glacier/Object Lock archival or update Phase 0 docs to
     reflect planned status with a delivery timeline.

### Phase 4 - Missing requirement features (Phase 5 backlog)

1. Template hub (TO-AGG-001):
   - New feature: `src/features/templates/*` with DB schema and S3 storage.
   - Add routes: `/dashboard/sin/templates` and contextual links from forms,
     imports, reporting screens.
2. Guided walkthroughs (TO-AGG-002):
   - Add tutorial framework (e.g., lightweight tour steps stored in config).
   - Track completion per user and surface on first visit.
3. Reference materials (TO-AGG-003):
   - Add Help Center page with guides/FAQ; store markdown in DB or `docs`.
4. Support/feedback (UI-AGG-006):
   - Add `support_requests` table + server functions + admin UI for responses.
   - Optional: notify via email or in-app notifications.
5. Data catalog/index (DM-AGG-003):
   - Create `data_catalog_entries` table with metadata from forms, imports,
     reports; add search UI and indexing.
6. Continuous data quality (DM-AGG-004):
   - Add cron job scanning for invalid submissions and summary dashboard.
7. Analytics charts/pivots (RP-AGG-005):
   - Extend report builder to support pivot definitions and charts (CSV/Excel
     export of the aggregated dataset).

### Phase 5 - Testing and evidence

1. Add E2E tests for:
   - Audit/security access control.
   - MFA enforcement and step-up flows.
   - Reporting and export authZ.
2. Add unit tests for new guards and data quality rules.
3. Update docs with evidence links and test runs.

## Open questions for implementation

- Which tenant(s) should receive the new templates/help/support features first?
- Should analytics charts/pivots be an MVP (limited chart types) or a full
  pivot builder?
- Is the import batch worker expected to run via ECS, Lambda, or a queue-driven
  Lambda with larger memory?
