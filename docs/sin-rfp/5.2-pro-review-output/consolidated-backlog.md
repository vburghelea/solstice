# SIN RFP 5.2 Consolidated Implementation Backlog

Sources:

- docs/sin-rfp/5.2-pro-review-output/1-implementation.md
- docs/sin-rfp/5.2-pro-review-output/2-implementation.md
- docs/sin-rfp/5.2-pro-review-output/3-implementation.md
- docs/sin-rfp/5.2-pro-review-output/4-implementation.md
- docs/sin-rfp/5.2-pro-review-output/4b-implementation.md
- docs/sin-rfp/5.2-pro-review-output/5-implementation.md
- docs/sin-rfp/5.2-pro-review-output/6-implementation.md

## Sequencing and parallelization

- D0 decisions block Streams D, E, F, H, I, L, and M.
- Stream A should land before step-up dependent work in Streams C and H.
- Stream B can run in parallel with Stream A.
- Streams C and G can run in parallel after Stream A.
- Streams D, E, and F can run in parallel after D0 decisions and Stream C auth
  helpers are in place.
- Stream H depends on Streams A and G.
- Stream I depends on Streams C and G.
- Stream K can start immediately but should be finalized after Streams C, G, H,
  and L to attach evidence links.
- Stream L can run in parallel with Streams C and G once D0.17 is decided.
- Stream M depends on Streams C and D0.15/D0.16.
- Stream J follows each stream but can be parallelized per stream.

## Decision backlog (blocking)

- [x] D0.1 Decide visibility for saved reports with organizationId = null.
      (Decision: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-1-saved-reports-null-org-scope.md`)
- [x] D0.2 Decide visibility for reporting cycles/tasks when organizationId is
      absent. (Decision: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-2-reporting-null-org-visibility.md`)
- [x] D0.3 Decide whether createNotification is internal-only or admin UI.
      (Decision: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-3-create-notification-exposure.md`)
- [x] D0.4 Decide multi-file upload support vs enforce maxFiles = 1.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-4-forms-multifile-support.md`)
- [x] D0.5 Decide whether to add "rejected" to reporting status enums or remove
      it from UI. (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-5-reporting-rejected-status.md`)
- [x] D0.6 Define PII model for form payload fields (per-field flags and
      redaction behavior). (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-6-form-pii-classification.md`)
- [x] D0.7 Define report filter/column allowlist contract per data source.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-7-report-filter-allowlist.md`)
- [x] D0.8 Decide import rollback error retention policy.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-8-import-error-retention.md`)
- [x] D0.9 Decide if self-service org creation exists and which org types are
      allowed. (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-9-org-creation-policy.md`)
- [x] D0.10 Decide if non-admin member directory is required and which fields
      are safe. (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-10-member-directory-exposure.md`)
- [x] D0.11 Decide anomaly detection thresholds (flag vs lock) for security
      events. (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-11-security-anomaly-thresholds.md`)
- [x] D0.12 Decide audit hash chain scope (global, per-org, per-tenant).
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-12-audit-hash-chain-scope.md`)
- [x] D0.13 Decide DSAR export retention window and user-accessibility.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-13-dsar-export-retention.md`)
- [x] D0.14 Use SES everywhere for email delivery.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-14-email-provider-policy.md`)
- [x] D0.15 Build once and deploy templates/help/support everywhere.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-15-templates-help-support-rollout.md`)
- [x] D0.16 Build full pivot builder + charts + export.
      (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md`)
- [x] D0.17 Decide import batch worker runtime (ECS vs Lambda vs queue-driven
      Lambda). (ADR: `docs/sin-rfp/decisions/ADR-2025-12-26-d0-17-import-batch-runtime.md`)

## Decision backlog decisions (accepted)

All D0 decisions are accepted. See `docs/sin-rfp/decision-register.md` for ADR
links and full statements.

- D0.1-0.3: Personal null-org reports; admin-only null-org reporting; server-only
  createNotification with a separate admin endpoint.
- D0.4-0.7: Clamp uploads to 1; add rejected with transitions; tiered PII
  classification; allowlisted report filters/columns.
- D0.8-0.10: Sanitize import errors; admin-only org creation; admin-only member
  lists.
- D0.11-0.13: Flag-first detection; per-tenant audit chain + advisory lock; 14
  day DSAR retention.
- D0.14-0.17: SES everywhere; build once deploy everywhere; full pivot builder
  - charts + export; ECS Fargate for batch imports.
- D0.4 (multi-file uploads): Clamp to maxFiles = 1 and reject arrays until full
  array payload support exists across UI, validation, and persistence.
- D0.5 (reporting status "rejected"): Add to DB enum if review workflow needs a
  terminal rejection; otherwise remove from UI. If added, enforce transitions
  and clear stale review/submission metadata on status changes.
- D0.6 (PII model for form payloads): Add per-field PII flags in form
  definitions, enforce server-side redaction in reports/exports, and require an
  explicit pii.read permission. DSAR exports include full subject data while
  audit logs use redaction/hashes.
- D0.7 (report filter/column allowlist): Define an explicit, server-side
  allowlist per data source (field types + operators) and validate all filters,
  columns, and sorts against it. Ensure audit filtersUsed reflects applied
  filters.
- D0.8 (import rollback error retention): Retain import_job_errors for a short
  window (e.g., 30-90 days) with sanitized values; mark jobs rolled_back and
  purge errors via retention policy. If strict minimization is required, keep
  only row numbers + error codes in audit logs.
- D0.9 (self-service org creation): Default to global-admin-only. If
  self-service is required, restrict to low-risk org types, set status pending,
  and require approval + rate limiting.
- D0.10 (non-admin member directory): If required, create a separate endpoint
  with a safe projection (name/role only) and opt-in fields. Keep email and full
  details behind org-admin roles.
- D0.11 (anomaly thresholds): Lock on repeated auth failures; flag anomalies
  (new geo/device/IP) with step-up + admin notification. Make thresholds
  tenant-configurable and bias toward flagging over locking.
- D0.12 (audit hash chain scope): Prefer per-tenant chain with advisory locks to
  reduce contention and keep isolation; optionally per-org if volume demands.
  Avoid a single global chain unless required for evidence.
- D0.13 (DSAR export retention): Short-lived exports (7-30 days) with explicit
  tags/metadata and automatic deletion. Allow subject download in-window; require
  step-up for admins accessing others.
- D0.14 (SendGrid usage): SES-only in SIN production. Allow SendGrid in non-SIN
  tenants only with explicit opt-in and environment guards; prefer SES
  everywhere if possible.
- D0.15 (templates/help/support rollout): Pilot in QC/internal first, then a
  limited SIN pilot behind feature flags; pair rollout with training content and
  admin guidance.
- D0.16 (charts/pivots scope): MVP with a small chart set + simple pivot (1 row,
  1 column, 1 measure) using aggregated datasets. Full pivot builder deferred.
- D0.17 (import batch runtime): ECS/Fargate is the safer default for large
  files/long runs. Lambda only if chunked, idempotent, and within time limits.

### Exploration: "Solstice system org id" (admin-only, no null org ids)

- Goal: eliminate null organizationId while keeping clear admin-only/system
  scope.
- Approach: add a reserved organization row (fixed UUID, slug like
  "solstice-system", metadata.isSystem = true), hide it from org lists/switcher,
  and gate all access to global admins.
- Migration: update nullable organizationId columns to use the system org id,
  then add NOT NULL + defaults where appropriate; adjust queries to exclude the
  system org for non-admins.
- Risks: personal or user-visible records previously using null could become
  hidden or admin-only. Mitigation: add an explicit scope field (personal/org/
  system) or preserve owner-only visibility rules that bypass org scoping.
- Impacted decisions: D0.1 and D0.2 become explicit about visibility, and
  Streams C/F (reporting/reports) must treat system org as admin-only.

## Stream A - Auth, session, and MFA foundations

- [ ] A1 Add shared session helper (auth.api.getSession with
      disableCookieCache); update auth middleware, org-context guard, auth queries,
      and step-up to use it.
- [ ] A2 Harden requireRecentAuth: extract nested timestamps, fail closed when
      missing, treat MFA timestamps consistently; add unit tests.
- [ ] A3 Update requireAdmin to throw typed unauthorized/forbidden errors and
      enforce MFA-required admin checks in route guards.
- [ ] A4 Add structured step-up error signaling and update StepUpDialog to use
      it; add backup code verification path.
- [ ] A5 Enforce session policies: admin max-age 4h, idle timeout 30m; add
      lastActivityAt tracking and middleware enforcement.
- [ ] A6 Backfill mfaRequired for existing global admins and update seed scripts
      to set MFA state.
- [ ] A7 Harden scripts/seed-sin-data.ts: require E2E_DATABASE_URL or --force,
      refuse production, remove process.exit(0), and align seeded sessions with auth
      policy or remove them.

## Stream B - Org context and client routing safety

- [ ] B1 Guard import.meta.env access in src/lib/env.client.ts; optionally split
      tenant env into client/server modules.
- [ ] B2 Add server fn to validate candidate org id via
      resolveOrganizationAccess.
- [ ] B3 Update src/routes/\_\_root.tsx to validate active_org_id on server and
      client; clear invalid cookie/localStorage values.
- [ ] B4 Update /dashboard/sin guard to rely on validated
      context.activeOrganizationId.
- [ ] B5 Sync OrgContextProvider with route context changes; remove org switcher
      race by writing localStorage synchronously.
- [ ] B6 Scope accessible-org query by user.id and gate by authenticated user.
- [ ] B7 Clear org context on logout (cookie, localStorage, query cache) in
      app-sidebar and admin-sidebar; consider shared helper.
- [ ] B8 Lock down redirect param in /dashboard/select-org (allowlist internal
      paths).
- [ ] B9 Feature-gate SIN portal and admin overview cards using existing nav
      definitions.

## Stream C - Access control and org gating

- [ ] C1 Reports: require auth for listSavedReports; scope by owner/shared/
      org-wide within accessible orgs; JSONB sharedWith filter.
- [ ] C2 Reports: enforce org access and roles on create/update; restrict
      isOrgWide to org admins; validate or block sharedWith for non-admins.
- [ ] C3 Reports: export authorization uses context.organizationId for
      non-admins; allow optional org id only for global admins; ignore or validate
      spoofed filters.
- [ ] C4 Organizations: require global admin for createOrganization,
      searchOrganizations, listAllOrganizations; audit enumerations.
- [ ] C5 Organizations: secure getOrganization with session + access (or force
      current org id for non-admins).
- [ ] C6 Organizations: listOrganizationMembers and listDelegatedAccess require
      org admin roles; add redacted directory endpoint if needed.
- [ ] C7 Organizations: restrict updateOrganization parent/type changes to
      global admin; fix parentOrgId clearing when omitted; add audit diff.
- [ ] C8 Organizations: listOrganizations filters to active memberships; decide
      delegated access inclusion.
- [ ] C9 Reporting queries: require auth and requireOrganizationAccess; avoid
      conditional auth paths.
- [ ] C10 Privacy admin mutations: add requireAdmin and optional
      requireRecentAuth (see Stream H for workflow).
- [ ] C11 Notifications admin endpoints: add requireAdmin, and ensure
      createNotification requires session or is server-only; set audit actor from
      session.

## Stream D - Forms integrity and file security

- [ ] D1 Reject status="submitted" when missingFields or validationErrors exist.
- [ ] D2 Add field-type-aware required checks (checkbox, multiselect, file) and
      reject NaN.
- [ ] D3 Guard regex validation with schema validation and try/catch on both
      client and server.
- [ ] D4 Fix completeness score to use active fields only.
- [ ] D5 Preserve description on partial update.
- [ ] D6 Enforce form settings: requireApproval -> under_review,
      notifyOnSubmit -> notifications.
- [ ] D7 Validate storageKey with isValidStorageKeyPrefix; optional form_uploads
      table for uploads.
- [ ] D8 Enforce fieldKey correctness in createFormUpload.
- [ ] D9 Implement multi-file support or clamp to maxFiles = 1 and reject
      arrays.
- [ ] D10 Tighten submission access controls and add audit logs for file
      downloads.

## Stream E - Imports hardening

- [ ] E1 Validate job/form/org alignment in runInteractiveImport.
- [ ] E2 Verify source file hash server-side; parse file server-side and ignore
      client rows for persistence.
- [ ] E3 Normalize row parsing (reject NaN, trim multiselect values) in
      interactive and batch imports.
- [ ] E4 Block file-field imports until an ingestion pipeline exists; add
      UI/server guard.
- [ ] E5 Track failedRows separately from errorCount.
- [ ] E6 Add audit logging for mapping template CRUD and updateImportJobStatus.
- [ ] E7 Run rollback in a transaction and align error retention with D0.8.

## Stream F - Reporting and report correctness

- [ ] F1 Resolve reporting status enum mismatch (add or remove "rejected").
- [ ] F2 Validate formSubmissionId and formSubmissionVersionId belong to
      task/form/org.
- [ ] F3 Clear stale review/submission metadata when status changes.
- [ ] F4 Sanitize reminder schedule (unique positive integers, bounded).
- [ ] F5 Apply filters, columns, and sort server-side using an allowlist;
      ensure audit filtersUsed matches applied filters.
- [ ] F6 Implement real export formats: XLSX via xlsx, PDF only if supported;
      update UI to match.
- [ ] F7 Redact nested form payload fields using per-field PII flags; update
      schemas and UI.
- [ ] F8 Tighten PII policy to require explicit pii.read permission (remove
      implicit admin access).

## Stream G - Audit log integrity and security events

- [ ] G1 Enforce audit log immutability at DB role level; add migration test or
      verification script.
- [ ] G2 Use DB time for occurredAt and deterministic ordering (createdAt, id)
      for hash chain.
- [ ] G3 Prevent chain forks with transaction + advisory lock (scope per D0.12).
- [ ] G4 Include occurredAt and id in hash payload; generate id before hashing.
- [ ] G5 Normalize actorIp parsing (x-forwarded-for, net.isIP) for audit and
      security logs.
- [ ] G6 Replace shallow diff with deep diff (dotted paths) and sanitize nested
      PII; add tests.
- [ ] G7 Sanitize audit metadata (redact token/secret/password/mfaSecret keys);
      remove double-sanitization.
- [ ] G8 Fix audit date filtering (accept date-only or convert in UI).
- [ ] G9 Move auth security events to server hooks; replace recordSecurityEvent
      with trusted-only handler and optional untrusted allowlist.
- [ ] G10 Expand detection rules with risk scoring and anomaly events; decide
      lock vs flag (D0.11).
- [ ] G11 listAccountLocks defaults to active only; add includeHistory flag and
      update UI.
- [ ] G12 Add security table indexes for security_events and active
      account_locks.
- [ ] G13 Align securityConfig.session with enforced policy or remove unused
      config; add X-Organization-Id to CORS allowlist if/when used.

## Stream H - Privacy, DSAR, and retention

- [ ] H1 Enforce admin + step-up for privacy admin mutations and DSAR actions.
- [ ] H2 Gate getLatestPolicyDocument to published and effective policies only.
- [ ] H3 Enforce DSAR request type/status transitions for export and erasure.
- [ ] H4 Redact secrets from DSAR exports; use explicit DTOs for auth tables.
- [ ] H5 Harden DSAR export storage: SSE-KMS, tags/metadata for retention;
      consider object lock policy.
- [ ] H6 Gate DSAR download to completed status; audit download events; step-up
      for admins accessing others.
- [ ] H7 Erasure cleanup: delete DSAR export objects and notification
      preferences; handle partial deletes.
- [ ] H8 Implement correction workflow (details capture, admin apply, audit
      diffs).
- [ ] H9 Expand retention to DSAR exports and audit log archival
      (Glacier/Object Lock); add observability.
- [ ] H10 Add legal holds model and enforcement.

## Stream I - Notifications and email integrity

- [ ] I1 Lock down createNotification (session or server-only); set audit actor
      from session or system.
- [ ] I2 Require admin for template creation and scheduling; force isSystem=false
      for non-admins.
- [ ] I3 Fix audit actor for dispatch/digest; keep recipient in metadata/target.
- [ ] I4 Add email idempotency tracking when in-app notifications are disabled.
- [ ] I5 Support scheduled org/role broadcasts by resolving recipients when
      userId is null.
- [ ] I6 Enforce SES-only in SIN production; document SendGrid policy.

## Stream J - Tests, verification, and E2E coverage

- [ ] J1 Unit tests for form validation, import parsing, audit diff/metadata
      sanitization, and step-up guards.
- [ ] J2 Integration tests for report scoping/export redaction, reporting
      submission linking, and privacy request gating.
- [ ] J3 E2E tests for MFA/step-up, admin gating, org selection flow, and
      critical exports.
- [ ] J4 Run pnpm lint, pnpm check-types, and relevant pnpm test suites per
      stream.

## Stream K - Documentation, requirements, and evidence alignment

- [ ] K1 Update docs/sin-rfp/route-tree-implementation-review.md with per-item
      status and evidence links.
- [ ] K2 Update docs/sin-rfp/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md security
      controls table to reflect current implementation and evidence.
- [ ] K3 Add docs/sin-rfp/requirements-coverage-matrix.md mapping requirements
      to modules, tests, and evidence.
- [ ] K4 Add implementation-status callouts in Phase 0 docs to distinguish
      planned vs implemented items.

## Stream L - Production readiness and infra

- [ ] L1 Add batch import infra in sst.config.ts (ECS task definition + trigger)
      and document required outputs/secrets.
- [ ] L2 Verify notifications queue outputs, DLQ, and alarms; document in
      docs/sin-rfp/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md.
- [ ] L3 Verify SES deliverability (SPF/DKIM/DMARC) and update technical debt
      doc with evidence.
- [ ] L4 Run backup/restore drill and add
      docs/sin-rfp/backup-restore-test-results.md.
- [ ] L5 Implement audit archival to Glacier/Object Lock or update Phase 0 docs
      with a delivery timeline (coordinate with Stream H9).

## Stream M - Missing requirement features

- [ ] M1 Template hub (TO-AGG-001): add templates feature, schema, routes, and
      contextual links.
- [ ] M2 Guided walkthroughs (TO-AGG-002): add tutorial framework with per-user
      completion tracking.
- [ ] M3 Reference materials (TO-AGG-003): add Help Center with guides/FAQ.
- [ ] M4 Support/feedback (UI-AGG-006): add support_requests table, server fns,
      and admin response UI.
- [ ] M5 Data catalog/index (DM-AGG-003): add catalog schema and search UI.
- [ ] M6 Data quality monitoring (DM-AGG-004): add cron checks and dashboard.
- [ ] M7 Analytics charts/pivots (RP-AGG-005): extend report builder to support
      pivots and charts.
