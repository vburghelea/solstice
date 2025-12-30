# Stream Instructions for Parallel Agents

## Shared Context

- **Completed Streams**: A (Auth/MFA), B (Org context), C (Access control), G (Audit/Security), D (Forms), E (Imports), F (Reporting), H (Privacy/DSAR), I (Notifications), J (Tests), K (Documentation) - use these as foundation
- **Dev Server**: Running on port 5173 (sin-dev stage) - DO NOT close the server unless absolutely necessary, but do start with sst dev if it's not there
- **Communication**: Use `docs/sin-rfp/archive/streams/communication-parallel.md` for cross-stream coordination
- **UUIDs**: Seed data uses RFC 4122 compliant UUIDs (e.g., `a0000000-0000-4000-8001-000000000001`)
- **MFA Testing**: Use backup codes `backup-testcode3` through `backup-testcode9` (track usage in master.md)

---

## Stream D - Forms Integrity and File Security

Please work on **Stream D** and record your progress in `docs/sin-rfp/archive/streams/stream-d.md`.

**Scope**: Forms integrity and file security - input validation, file upload security, form submission integrity.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream D tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Stream C (access control) is complete - use `requireOrganizationAccess` and auth helpers.

**Instructions**:

1. Create `stream-d-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream D, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream E - Imports Hardening

Please work on **Stream E** and record your progress in `docs/sin-rfp/archive/streams/stream-e.md`.

**Scope**: Imports hardening - batch import validation, data sanitization, error handling, rollback support.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream E tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Stream C (access control) is complete - use `requireOrganizationAccess` and auth helpers.

**Instructions**:

1. Create `stream-e-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream E, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream F - Reporting and Report Correctness

Please work on **Stream F** and record your progress in `docs/sin-rfp/archive/streams/stream-f.md`.

**Scope**: Reporting and report correctness - data aggregation integrity, export validation, report generation.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream F tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Stream C (access control) is complete - reports already have auth guards from C1-C3.

**Instructions**:

1. Create `stream-f-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream F, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream H - Privacy, DSAR, and Retention

Please work on **Stream H** and record your progress in `docs/sin-rfp/archive/streams/stream-h.md`.

**Scope**: Privacy workflows, DSAR (Data Subject Access Request) processing, data retention enforcement.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream H tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Streams A (auth/MFA) and G (audit) are complete - use step-up auth and audit logging.

**Instructions**:

1. Create `stream-h-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream H, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream I - Notifications and Email Integrity

Please work on **Stream I** and record your progress in `docs/sin-rfp/archive/streams/stream-i.md`.

**Scope**: Notification delivery, email integrity, template security, scheduling reliability.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream I tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Streams C (access control) and G (audit) are complete - C11 added admin guards to notifications.

**Instructions**:

1. Create `stream-i-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream I, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream J - Tests, Verification, and E2E Coverage

Please work on **Stream J** and record your progress in `docs/sin-rfp/archive/streams/stream-j.md`.

**Scope**: Test coverage, E2E tests, verification scripts, integration testing for completed streams.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream J tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Can test completed Streams A, B, C, G. Coordinate with other streams for new tests.

**Instructions**:

1. Create `stream-j-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream J, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. Use the existing dev server on port 5173 - avoid restarting it
7. Run `pnpm test` frequently to verify tests pass

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream K - Documentation, Requirements, and Evidence Alignment

Please work on **Stream K** and record your progress in `docs/sin-rfp/archive/streams/stream-k.md`.

**Scope**: Documentation updates, requirements traceability, evidence collection for compliance.

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream K tasks)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (decisions)
- `docs/sin-rfp/worklogs/master.md` (context and completed work)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/6-implementation.md` (implementation guidance)

**Dependencies**: Can start now but will need updates after other streams complete.

**Instructions**:

1. Create `stream-k-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream K, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream L - Production Readiness and Infrastructure

Please work on **Stream L** and record your progress in `docs/sin-rfp/archive/streams/stream-l.md`.

**Scope**: Production readiness - ECS batch import infrastructure, notifications queue verification, SES deliverability, backup/restore drills, audit archival to Glacier/Object Lock.

**Tasks** (from consolidated-backlog.md):

- L1: Add batch import infra in sst.config.ts (ECS task definition + trigger) and document required outputs/secrets
- L2: Verify notifications queue outputs, DLQ, and alarms; document in technical debt doc
- L3: Verify SES deliverability (SPF/DKIM/DMARC) and update technical debt doc with evidence
- L4: Run backup/restore drill and add `docs/sin-rfp/review-plans/backup-restore-test-results.md`
- L5: Implement audit archival to Glacier/Object Lock or update Phase 0 docs with delivery timeline (coordinate with Stream H9)

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream L tasks)
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md` (ECS Fargate decision)
- `docs/sin-rfp/phase-0/import-batch-worker.md` (import batch worker spec)
- `docs/sin-rfp/phase-0/backup-dr-plan.md` (backup/DR requirements)
- `docs/sin-rfp/phase-0/audit-retention-policy.md` (audit archival requirements)
- `sst.config.ts` (infrastructure definitions)

**Dependencies**: D0.17 decision is complete (ECS Fargate). Stream H (privacy/audit archival) is complete.

**Instructions**:

1. Create `stream-l-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream L, even if you encounter errors
3. Update your worklog frequently with progress, decisions, and technical debt
4. Update `master.md` after completing major aspects
5. Use `communication-parallel.md` if you need to coordinate with other streams
6. For L1 (ECS), focus on task definition and trigger - actual deployment can be verified in staging
7. For L4 (backup drill), document the process and results thoroughly

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.

---

## Stream M - Missing Requirement Features

Please work on **Stream M** and record your progress in `docs/sin-rfp/archive/streams/stream-m.md`.

**Scope**: Missing RFP requirement features - template hub, guided walkthroughs, help center, support requests, data catalog, data quality monitoring, analytics charts/pivots.

**Tasks** (from consolidated-backlog.md):

- M1: Template hub (TO-AGG-001): add templates feature, schema, routes, and contextual links
- M2: Guided walkthroughs (TO-AGG-002): add tutorial framework with per-user completion tracking
- M3: Reference materials (TO-AGG-003): add Help Center with guides/FAQ
- M4: Support/feedback (UI-AGG-006): add support_requests table, server fns, and admin response UI
- M5: Data catalog/index (DM-AGG-003): add catalog schema and search UI
- M6: Data quality monitoring (DM-AGG-004): add cron checks and dashboard
- M7: Analytics charts/pivots (RP-AGG-005): extend report builder to support pivots and charts

**Key files**:

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/consolidated-backlog.md` (Stream M tasks)
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-15-templates-help-support-rollout.md` (templates/help decision)
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md` (analytics decision)
- `docs/sin-rfp/requirements/requirements-coverage-matrix.md` (requirement mappings)
- `src/features/reports/` (existing report builder for M7)

**Dependencies**: D0.15/D0.16 decisions are complete. Stream C (access control) is complete.

**Instructions**:

1. Create `stream-m-context.md` with all needed context from the implementation docs
2. Work through ALL items in Stream M, even if you encounter errors
3. For M7 (charts/pivots), build on existing report builder in `src/features/reports/`
4. Update your worklog frequently with progress, decisions, and technical debt
5. Update `master.md` after completing major aspects
6. Use `communication-parallel.md` if you need to coordinate with other streams
7. Update `docs/sin-rfp/requirements/requirements-coverage-matrix.md` as you implement features

AWS SSO for techdev is logged in. Do not return control until you have attempted everything in the stream.
