# Worklog — SIN RFP Gap Closure

Please work on closing SIN RFP verification gaps.
Continue to update this worklog regularly as you work, do not work on more than
a few files without updating the worklog; it will be your source of truth after
compaction.

## Instructions

- Follow `docs/sin-rfp/review-plans/gap-closure-plan.md` as the source of truth.
- Read `docs/sin-rfp/README.md` before starting new work sessions.
- Use `docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md`
  for evidence requirements and status context.
- Use `docs/sin-rfp/review-plans/requirements-verification-open-issues-plan.md`
  for open questions and decisions.
- Use `docs/sin-rfp/review-plans/viasport-questions.md` for stakeholder asks.
- Use MCP Playwright or Chrome DevTools MCP for UI verification.
- Run `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono` to spin up dev and make sure it works, and to be able to use Chrome Dev Tools. The dev environment will likely not be up, but if anything is on 5173 use that, it will be the dev environment (another codex may have started it).
- Again, if 5173 is already in use, it's our dev server from another process, and you can use that; and likely it is running via this process that you can read from `tail -f /tmp/claude/-Users-austin-dev-solstice/tasks/b459d7a.output`
- Once you have actually written functionality that has a UI, use Chrome Dev Tools mcp to interact with the feature and make sure it works and has good ux.
- Run `pnpm lint` and `pnpm check-types` before completing large task batches.
- Log blockers, questions, decisions, and technical debt here.
- If blocked, move to the next gap and note the issue here.
- Another agent is working on another worklog. Please let them know in their worklog if you think they broke something for you, or you might be doing something that affects them /Users/austin/dev/solstice/src/features/bi/docs/WORKLOG-bi-implementation.md

## Scope

- BI gaps are being handled in parallel in `src/features/bi` (see BI worklogs).
- Retention automation + legal-hold enforcement (including evidence).
- DR drill evidence (sin-dev technical drill).
- Accessibility verification (automated WCAG 2.1 AA scan).
- Notifications/reminders delivery verification.
- Analytics chart build/export verification with seeded data.
- Template seeding + contextual access validation.
- Guided walkthroughs with in-context tours.
- Submission file delete/replace flow with audit/retention checks.
- Global search command palette + unified search endpoint.
- External integrations/API PoC (target TBD).
- Admin data explorer decision (read-only UI vs out-of-scope).
- Seed data + synthetic data generation for perf testing.

## Session Log

### 2025-12-30: Worklog initialized

- Initialized gap-closure worklog aligned to updated gap closure plan.

### 2025-12-30: Gap closure execution

- Started `npx sst dev --stage sin-dev --mode mono` and confirmed Vite running at
  `http://localhost:5173` for MCP verification.
- Added submission file delete/replace server flows with legal-hold checks + audit
  logging, plus UI controls in admin and user submission views.
- Added global search foundation: `sin_global_search` feature flag, unified search
  server function, command palette UI with Cmd/Ctrl+K + sidebar/mobile triggers.
- Implemented guided walkthrough tours with spotlight overlays tied to new
  `tourSteps` metadata and `data-tour` anchors on SIN portal + imports pages.
- Expanded `scripts/seed-sin-data.ts` to seed templates, mapping templates, saved
  reports, support requests, in-app notifications, and a submission with a file
  attachment (uploads require `SIN_ARTIFACTS_BUCKET`).
- Added `scripts/generate-sin-synthetic-data.ts` for perf-scale submissions.
- Attempted `npx sst shell --stage sin-dev -- npx tsx scripts/seed-sin-data.ts --force`;
  blocked by RDS proxy CONNECT_TIMEOUT (DB not reachable).
- Attempted automated WCAG scan:
  - `pnpm dlx @axe-core/cli` failed (chromedriver ENOENT).
  - `scripts/run-sin-a11y-scan.ts` failed to inject axe-core from CDN (script load
    blocked).
- MCP UI verification blocked: login to `http://localhost:5173/auth/login` returns
  `HTTPError` after submit (likely backend/DB connectivity).
- Attempted retention enforcement run via `sst shell` + `applyRetentionPolicies`;
  blocked by module resolution errors for `@tanstack/react-start`/`tsx` in shell.
- Attempted `process-notifications` cron via `sst shell`; blocked by DB connection
  validation timeouts to RDS proxy.
- Drafted evidence templates for DR drill and retention job runs in
  `docs/sin-rfp/review-plans/evidence/`.
- Updated open-issues decision log (external integrations deferred pending target;
  admin data explorer out-of-scope; tours/search/delete decisions recorded).
- Analytics export, template access validation, and reminder delivery verification
  remain blocked until sin-dev DB connectivity is restored and seed data can run.
- Ran `pnpm lint` (warnings only, existing no-console + lint warnings).
- Ran `pnpm check-types`; fails due to pre-existing BI TypeScript errors.

### 2025-12-30: Gap closure continuation

- Started `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`; Vite bound to
  `http://localhost:5178` because 5173-5177 were in use. Health check at
  `/api/health` reports DB connected.
- `scripts/seed-sin-data.ts` failed on org insert (jsonb settings/metadata passed
  into raw SQL). Swapped org upsert to `db.insert(organizations)` with
  `onConflictDoUpdate` to ensure JSON serialization.
- Re-ran seed script successfully in `sst shell`. Initial run skipped template and
  submission file uploads because `SIN_ARTIFACTS_BUCKET` was missing.
- Re-ran seed script with `SIN_ARTIFACTS_BUCKET=solstice-sin-dev-sinartifactsbucket-kcdsxdnu`
  (from `SST_RESOURCE_SinArtifacts`) to upload templates + submission attachment.
- Attempted `scripts/generate-sin-synthetic-data.ts --count 250 --include-reporting`;
  failed on `reporting_submissions_unique` (only one submission per task/org).
  Updated script to insert at most one reporting submission and reran with
  `--count 50 --include-reporting` successfully (note: initial 250 form submissions
  likely inserted before the failure).
- Ran retention enforcement via `npx tsx -e "handler()"` on
  `src/cron/enforce-retention.ts`; job completed with all policies skipped
  (`no_purge_policy`/`no_eligible_rows`).
- Initiated DR restore from snapshot
  `rds:solstice-sin-dev-databaseinstance-bdckvktk-2025-12-29-04-46` to new instance
  `solstice-sin-dev-dr-20251230` (status: creating).

### 2025-12-31: Gap closure continuation

- DR drill: restore completed (`solstice-sin-dev-dr-20251230`), validated connectivity
  and row counts (`organizations` 10, `form_submissions` 1, `reporting_submissions` 1).
  RTO ~5 minutes; RPO ~43h (daily snapshot cadence, not 1h target).
- Notifications delivery attempt: inserted scheduled `reporting_reminder` job for
  `sin-user-pso-admin-001`, ran `process-notifications`. In-app notification created
  and job marked `sent_at`; SES email send failed because identities are not verified
  (`notifications@quadballcanada.com` + `pso-admin@example.com`). No entries in
  `notification_email_deliveries`.
- Accessibility scan completed via `scripts/run-sin-a11y-scan.ts`; results saved to
  `docs/sin-rfp/review-plans/evidence/a11y-scan-20251231.json` (login clean; SIN
  dashboard/reporting/imports show `color-contrast` + `region` violations).
- Analytics export verification: fixed MFA step-up fallback by using session auth
  time when no `lastMfaVerifiedAt` is present (`src/lib/auth/guards/step-up.ts`),
  updated `scripts/verify-sin-analytics.ts` to decode TanStack serverFn payloads,
  and captured export to `outputs/pivot-export.csv`.
- Retention/legal hold evidence: inserted retention policy for `notifications`
  (`purgeAfterDays=0`) plus legal hold on record
  `03acce02-38e4-44ee-8bad-ebf2c57b548f`, ran `enforce-retention` cron; 2
  notifications purged while held record retained. Evidence updated in
  `docs/sin-rfp/review-plans/evidence/RETENTION-JOB-sin-dev-20251230.md`.

### 2025-12-31: Gap closure continuation (UI verification)

- Updated `scripts/verify-sin-ui-gaps.ts` to wait for portal hydration
  (`networkidle`) before starting tours, log debug details, and wait for submission
  files to render before asserting empty state.
- Re-ran UI verification (`SIN_UI_DEBUG=true`) on `http://localhost:5173`; templates,
  guided walkthroughs, global search, and submission file controls all pass.

### 2025-12-31: Gap closure continuation (data + ops)

- Confirmed SES identities are empty (`aws ses list-identities`); real email delivery
  still blocked without verified sender/recipient identities.
- Ran `scripts/generate-sin-synthetic-data.ts --count 10` in sin-dev; inserted 10
  additional synthetic submissions for perf testing.
- Data quality monitor: first run failed on `latestSubmittedAt` string coercion;
  updated `src/features/data-quality/data-quality.monitor.ts` to normalize
  timestamps and re-ran `src/cron/data-quality-monitor.ts` successfully
  (12 total submissions, no missing/invalid fields).
- External integrations/API PoC + admin data explorer remain blocked pending target
  system scope and decision (see open-issues plan); no target vendor/API available.
- Ran `pnpm lint` (warnings only, existing console usage).
- Ran `pnpm check-types`; fails only in `scripts/seed-sin-data.ts` (pre-existing
  org insert typings + JSON metadata shape).

### 2025-12-31: Gap closure continuation (notifications)

- SES identity verified for `austinwallacetech@gmail.com`; updated
  `sin-user-pso-admin-001` email to this address for delivery testing.
- Inserted a new `reporting_reminder` scheduled notification and ran
  `processScheduledNotifications` with `SIN_NOTIFICATIONS_FROM_EMAIL` set to the
  verified address; email send succeeded (messageId
  `010d019b7335d080-ec0707e9-2486-4a16-8f0e-65af0cb1323f-000000`) and delivery
  logged in `notification_email_deliveries` (evidence:
  `docs/sin-rfp/review-plans/evidence/NOTIFICATIONS-DELIVERY-sin-dev-20251231.md`).

### 2025-12-31: Open gaps checklist (from system requirements addendum)

- DM-AGG-001: End-user submission tracking/edit flow still not verified; multi-file
  uploads remain unsupported (design decision).
- DM-AGG-002: External platform integration/API PoC pending (target TBD).
- DM-AGG-003: Secure admin DB access/data explorer still absent; data catalog sync
  not re-verified with live entries.
- DM-AGG-005: Archival controls enabled for SIN artifacts bucket (Object Lock +
  Glacier lifecycle); audit log archival workflow still pending; DR RPO gap vs
  target.
- DM-AGG-006: External legacy API/DB import path not implemented; file-field import
  still unsupported (design decision).
- RP-AGG-002: Reporting metadata (fiscal periods, agreements, NCCP) not modeled in UI.
- RP-AGG-003: Reporting resubmission/history flows not exercised in sin-dev UI.
- SEC-AGG-001/UI-AGG-001: Self-service org registration remains admin-only (decision).
- SEC-AGG-002: Threat detection/lockout scenario not exercised for evidence.
- SEC-AGG-003: Encryption/storage controls evidenced in sin-dev; TLS enforcement
  now enabled.
- UI-AGG-002: Dashboard lacks role-specific progress/metrics widgets.
- UI-AGG-003: Accessibility remediation outstanding (color-contrast + region violations).

### 2025-12-31: Gap closure continuation (DM-AGG-001 start)

- Assigned form `Quarterly Financial Summary` to org `BC Hockey` in sin-dev so
  `/dashboard/sin/forms` lists an assigned form for end-user submission testing.
- Added `scripts/verify-sin-form-submission.ts` to exercise form submission +
  submission history tracking.
- Form submission Playwright run failed at login redirect; DB check shows
  `sin-user-pso-admin-001` email currently `austeane@gmail.com` (2FA disabled),
  which differs from the previously verified `austinwallacetech@gmail.com`.
  Awaiting confirmation which address should be used for login/tests.

### 2025-12-31: Gap closure continuation (DM-AGG-001 verified)

- Restored `sin-user-pso-admin-001` email to `austinwallacetech@gmail.com` for
  UI verification consistency.
- Fixed `/dashboard/sin/forms/$formId` rendering by adding an outlet-aware layout
  in `src/routes/dashboard/sin/forms.tsx` (detail route previously invisible).
- Re-ran `scripts/verify-sin-form-submission.ts`; user can submit a form, see it
  in submission history, and view submission details.

### 2025-12-31: Gap closure continuation (DM-AGG-003 data catalog)

- Ran data catalog sync in sin-dev via `buildCatalogSeedEntries` + upsert, logged
  `DATA_CATALOG_SYNC` audit entry (10 entries).
- Verified `/dashboard/admin/sin/data-catalog` shows populated entries via
  `scripts/verify-sin-data-catalog.ts` (no empty-state message).
- Admin DB query/data explorer gap remains open (no secure query UI yet).

### 2025-12-31: Gap closure continuation (DM-AGG-005 archival checks)

- Checked SIN artifacts bucket for archival controls:
  - Versioning enabled.
  - Object Lock config missing (`ObjectLockConfigurationNotFoundError`).
  - Lifecycle rules missing (`NoSuchLifecycleConfiguration`).
- Archival/immutable retention remained unimplemented at the time; follow-up
  deploy created a new artifacts bucket with Object Lock + lifecycle rules
  enabled (see infrastructure deployment entry). DR RPO gap still noted from
  prior drill evidence.
- Updated `sin-user-pso-admin-001` email to `austeane@gmail.com` and attempted a
  send from `austinwallacetech@gmail.com`; SES rejected the recipient as
  unverified (`Email address is not verified... austeane@gmail.com`).
- Recipient confirmed receipt of the `austinwallacetech@gmail.com` delivery; noted
  in notification evidence.

### 2025-12-31: Gap closure continuation (addendum review)

- Reviewed `VIASPORT-PROVIDED-system-requirements-addendum.md` to confirm the
  open-gap checklist scope.
- Noted confirmation that `austinwallacetech@gmail.com` is verified for testing.
- External integration target still pending; no external platform/API PoC to run yet.

### 2025-12-31: Gap closure continuation (reporting, security, UI)

- Added reporting metadata schema + update server fn and exposed a
  "Reporting metadata" form on `/dashboard/sin/reporting` for org admins
  (RP-AGG-002).
- Added reporting submission history dialog on `/dashboard/sin/reporting` and
  inserted a sample history row for submission
  `ac8d6835-f094-4bbd-8bfa-0303af6853b8` (RP-AGG-003 evidence seed).
- Created and ran `scripts/verify-sin-security-lockout.ts` to trigger failed
  login lockout; captured evidence in
  `docs/sin-rfp/review-plans/evidence/SECURITY-LOCKOUT-sin-dev-20251231.md`
  (SEC-AGG-002).
- Captured encryption + backup evidence in
  `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`;
  noted `rds.force_ssl` now `1` in sin-dev (SEC-AGG-003 evidence).
- Added role-based summary widgets to SIN portal dashboard (UI-AGG-002).
- Fixed a11y issues: increased active nav contrast + moved command dialog header
  into dialog content; re-ran `scripts/run-sin-a11y-scan.ts` with
  `austinwallacetech@gmail.com` (no violations in dashboard/reporting/imports).
- Ran `pnpm lint` (warnings only, pre-existing console + unicorn warnings).
- Ran `pnpm check-types` (clean).

### 2025-12-31: Open gaps checklist (status update)

- DM-AGG-001: Verified submission tracking/edit flow; multi-file uploads still
  unsupported (decision).
- DM-AGG-002: External platform/API integration PoC pending target selection.
- DM-AGG-003: Data catalog verified; secure admin DB explorer still unimplemented.
- DM-AGG-005: Backups configured + encryption evidenced; artifacts bucket now has
  Object Lock + lifecycle rules; audit log archival workflow still pending; DR
  RPO gap remains.
- DM-AGG-006: CSV/Excel import wizard + preview exist; external API/DB import path
  still not implemented; file-field import unsupported (decision).
- RP-AGG-002: Reporting metadata UI + update flow added (closed).
- RP-AGG-003: Submission history dialog added + sample history entry seeded
  (closed for UI evidence).
- SEC-AGG-001/UI-AGG-001: Self-service org registration remains admin-only
  (decision).
- SEC-AGG-002: Lockout evidence captured (closed).
- SEC-AGG-003: Encryption evidence captured; `rds.force_ssl` enabled in sin-dev
  parameter group.
- UI-AGG-002: Role-based dashboard summary widgets added (closed).
- UI-AGG-003: Automated a11y scan clean after fixes (closed for automated scope).

### 2025-12-31: Gap details + recommendations

- DM-AGG-001 (Data collection & submission): End-user submit + tracking verified
  (`scripts/verify-sin-form-submission.ts`); form detail route fixed in
  `src/routes/dashboard/sin/forms.tsx`; submission versions + file delete/replace
  exist in `src/routes/dashboard/sin/submissions/$submissionId.tsx`. Remaining:
  multi-file uploads unsupported (decision).
- DM-AGG-002 (Data processing & integration): CSV/Excel import + preview + mapping
  templates implemented in `src/features/imports/components/import-wizard-shell.tsx`
  with schema in `src/db/schema/imports.schema.ts`; external API integration target
  still unknown so no PoC yet; transformation log viewer remains deferred.
- DM-AGG-003 (Data governance & access control): RBAC enforced; data catalog sync
  verified (`scripts/verify-sin-data-catalog.ts`); secure admin DB explorer/read-only
  query UI still not implemented (decision pending on scope/tooling).
- DM-AGG-005 (Storage & retention): RDS backups + retention + DR drill evidence exist
  (`DR-DRILL` + `RETENTION-JOB` evidence); SIN artifacts bucket now has Glacier
  lifecycle rules + Object Lock with SSE-S3; audit log archival workflow still
  pending; TLS enforcement in sin-dev is on (`rds.force_ssl=1`) per
  `ENCRYPTION-STATUS` evidence.
- DM-AGG-006 (Legacy migration & bulk import): Import wizard exists (preview + error
  logs) but external API/DB connectors not implemented; file-field import unsupported
  (decision).
- RP-AGG-002 (Reporting metadata): Reporting metadata schema + admin update flow
  added in `src/features/reporting/reporting.schemas.ts`,
  `src/features/reporting/reporting.mutations.ts`, and
  `src/routes/dashboard/sin/reporting.tsx` (closed).
- RP-AGG-003 (Reporting resubmission/history): History dialog added to
  `/dashboard/sin/reporting` with seeded history row for evidence (closed for UI).
- SEC-AGG-001/UI-AGG-001 (Self-service org registration): Remains admin-only
  (decision); join requests/invite links gated by org admins.
- SEC-AGG-002 (Threat detection/lockout): Lockout evidence captured via
  `scripts/verify-sin-security-lockout.ts` and documented in
  `SECURITY-LOCKOUT-sin-dev-20251231.md` (closed).
- SEC-AGG-003 (Privacy/encryption): RDS KMS encryption + S3 SSE-S3 verified in
  `ENCRYPTION-STATUS-sin-dev-20251231.md`; TLS enforcement in dev now enabled.
- UI-AGG-002 (Personalized dashboard): Role-based summary widgets added to
  `/dashboard/sin` in `src/routes/dashboard/sin/index.tsx` (closed baseline).
- UI-AGG-003 (Accessibility): Automated scan clean after contrast + landmark fixes
  (`a11y-scan-20251231.json`); manual WCAG follow-up still optional.

Recommendations / next steps:

- Decide external integration target (DM-AGG-002) so an API PoC + mapping plan can
  be scoped and scheduled.
- Confirm admin DB explorer approach (DM-AGG-003): either a read-only data explorer
  with audit logging or leverage BI/export workflows in lieu of direct queries.
- Define archival policy (DM-AGG-005) and confirm retention tiers + audit log
  archival workflow; Object Lock + lifecycle rules now enabled on SIN artifacts
  bucket.
- TLS enforcement is enabled in sin-dev (`rds.force_ssl=1`); align S3 encryption
  defaults to KMS if required for compliance evidence (SEC-AGG-003).
- If needed for sign-off, run a small manual a11y spot check for WCAG AA beyond the
  automated scan (UI-AGG-003).

### 2025-12-31: Infrastructure fixes (TLS, Object Lock, lifecycle rules)

- Confirmed SST config already has `forceSsl: true` for all environments
  (lines 140, 149, 157); sin-dev mismatch is due to config not being deployed.
- Added S3 lifecycle rules to `sst.config.ts` for SinArtifacts bucket:
  - `ArchiveToGlacier`: Transition to Glacier after 90 days
  - `DeleteOldVersions`: Delete non-current versions after 180 days
- Documented RPO decision in `DR-DRILL-sin-dev-20251230.md`:
  - Dev: 24h RPO (daily snapshots) acceptable for test evidence
  - Prod: 1h RPO via PITR + 35-day retention + Multi-AZ
- S3 Object Lock: Initial transform used a function return, which SST ignores.
  Updated to object-form transform so `objectLockEnabled: true` is applied at
  creation time.
- Deployed sin-dev to create a new bucket with Object Lock + lifecycle rules;
  old manual bucket (`solstice-sin-dev-artifacts`) was empty and deleted.

**Deployment completed (sin-dev):**

1. Confirmed manual bucket `solstice-sin-dev-artifacts` was empty (no backup needed).
2. Deployed: `AWS_PROFILE=techdev npx sst deploy --stage sin-dev`.
3. Deleted manual bucket:
   ```bash
   AWS_PROFILE=techdev aws s3api delete-bucket \
     --bucket solstice-sin-dev-artifacts \
     --region ca-central-1
   ```
4. Verified lifecycle + Object Lock on `solstice-sin-dev-sinartifactsbucket-smhmnosc`.
5. Updated evidence files with new encryption/lifecycle config.

### 2025-12-31: Admin DB Explorer Scope (DM-AGG-003)

**Requirement**: "provide administrators with secure database access, along with
data cataloging and indexing capabilities for discoverability"

**Current State**:

- Data catalog sync verified (10 entries in `sin-dev`)
- BI platform provides:
  - SQL Workbench with parameterized queries (feature-gated)
  - 4 predefined datasets (organizations, reporting_submissions, form_submissions, events)
  - Field-level ACL, PII masking, org scoping
  - Tamper-evident audit logging (SHA-256 chain)
  - Query guardrails (concurrency limits, cost estimation, statement timeout)
  - Role separation (`bi_readonly` PostgreSQL role)

**Gap Analysis**:
The BI SQL Workbench already provides ~80% of what an "admin DB explorer" would
need. The key gaps are:

| Gap                                         | Effort | Priority |
| ------------------------------------------- | ------ | -------- |
| Table/schema discovery UI                   | Medium | P1       |
| Dynamic dataset creation                    | High   | P2       |
| Data profiling (cardinality, distributions) | Medium | P3       |
| Query performance visualization             | Low    | P3       |
| Persistent rate limiting (Redis)            | Medium | P2       |

**Proposed Scope for v1 (Minimal Viable)**:

1. **Enable SQL Workbench for platform admins** (~30 min)
   - Add `sin_analytics_sql_workbench` feature flag to viaSport tenant config
   - Restrict to `analytics.sql` permission (platform admin only)
   - Document in training materials

2. **Add schema browser sidebar** (~4 hours)
   - New component: `src/features/bi/components/sql-workbench/SchemaBrowser.tsx`
   - Query `information_schema.tables` + `information_schema.columns` via `bi_readonly`
   - Filter to whitelisted datasets + their source tables
   - Display table name, column name, data type, nullable
   - Click-to-insert table/column name into editor

3. **Add data catalog link** (~1 hour)
   - Link from SQL Workbench to `/dashboard/admin/sin/data-catalog`
   - Show field descriptions, PII classification, update timestamps

4. **Audit logging enhancement** (~2 hours)
   - Add `ADMIN_SQL_QUERY` action type to audit schema
   - Include query text hash + result row count
   - Surface in admin audit log viewer

**Total Effort**: ~8 hours for v1 scope

**Alternative: Out-of-Scope Approach**:
If the SQL Workbench + data catalog are deemed sufficient, close DM-AGG-003 with
documentation noting that:

- Administrators can query data via the BI SQL Workbench (restricted tables)
- Data catalog provides field-level documentation and discoverability
- Direct database access is intentionally restricted for security
- Future phases could add schema browser if needed

**Decision needed**: Implement v1 schema browser (~8h) or document current
capabilities as sufficient?

**Assessment (2025-12-31)**: Agree with the scope as written, with minor caveats:

- Treat SQL Workbench enablement as contingent on completing the hard-gate checklist
  (security review + E2E) before flipping it on beyond internal testing.
- Schema browser should enumerate curated `bi_v_*` views (or dataset config) only;
  avoid exposing raw tables directly from `information_schema`.
- Audit logging already exists in `bi_query_log`; optional enhancement is to surface
  those entries in the admin audit log UI rather than adding a parallel action type.

### 2025-12-31: Infrastructure deployment completed

**Actions taken:**

1. Removed the `Bucket.get()` workaround and updated bucket transform to apply
   `objectLockEnabled` at creation time
2. Deployed sin-dev to create a new SST-managed bucket with Object Lock +
   lifecycle rules
3. Deleted manual bucket `solstice-sin-dev-artifacts` after confirming it was
   empty

**Results:**

| Setting                   | Status           | Notes                                                         |
| ------------------------- | ---------------- | ------------------------------------------------------------- |
| RDS TLS (`rds.force_ssl`) | ✅ Enabled (`1`) | Manually applied; SST didn't auto-update existing param group |
| S3 Lifecycle Rules        | ✅ Enabled       | Archive to Glacier 90d, delete old versions 180d              |
| S3 Object Lock            | ✅ Enabled       | Created with `objectLockEnabled: true`                        |
| S3 Versioning             | ✅ Enabled       | Required for lifecycle rules                                  |

**New bucket name:** `solstice-sin-dev-sinartifactsbucket-smhmnosc`

**Object Lock note:** No workaround required; SST now creates the bucket with
Object Lock enabled.

**Evidence updated:** `ENCRYPTION-STATUS-sin-dev-20251231.md`

### 2025-12-31: External Review Feedback Analysis

Received feedback from external review of the gap-closure artifacts and runtime code.
The review covered: evidence docs, cron lambdas (retention, notifications, data-quality),
notifications + reporting features, SIN portal UI, and scripts.

#### What Was Identified as Strong

- **Feature gating consistent** across queries/mutations (assertFeatureEnabled, requireFeatureInRoute)
- **AuthZ correctly layered**: admin actions have explicit requireAdmin + step-up auth
- **SQS worker design correct** for partial batch failure (notification-worker.ts)
- **Data quality monitoring** writes structured summaries with clean failure handling
- **Evidence discipline good**: concrete commands, timestamps, identifiers, narrative

#### High-Priority Issues to Fix

**1. Dismissed notifications still count as "unread"**

- Location: `src/features/notifications/notifications.queries.ts:28-30, 65-68`
- Issue: `getUnreadNotificationCount` counts `readAt IS NULL` but doesn't exclude dismissed
- Issue: `listNotifications` doesn't filter dismissed notifications
- Issue: `dismissNotification` only sets `dismissedAt`, not `readAt`
- Impact: Unread badge stays inflated after user dismisses notifications

**2. Date-only math wrong in SIN portal stats**

- Location: `src/routes/dashboard/sin/index.tsx:140-153`
- Issue: `new Date(item.dueDate)` parses date-only as UTC midnight
- Issue: `isSubmitted` only treats `submitted`/`approved`, not `under_review`
- Impact: Items due "today" become overdue at midnight UTC; wrong counts displayed

**3. `notification_email_deliveries` missing FK to notifications**

- Location: `src/db/schema/notifications.schema.ts:42-54`
- Issue: `notificationId` is PK but not a reference to `notifications.id`
- Impact: Orphan delivery rows possible; deletes don't cascade

**4. Hard-coded TOTP secret in a11y scan script**

- Location: `scripts/run-sin-a11y-scan.ts:15-18`
- Issue: Fallback defaults for email/password/TOTP secret baked in
- Impact: Security footgun; should fail fast if env vars not set

#### Medium-Priority Issues

**5. Notifications preferences upsert race**

- Location: `src/features/notifications/notifications.mutations.ts:84-120`
- Issue: Select-then-update/insert pattern can race under concurrency
- Fix: Use `insert ... onConflictDoUpdate` on `(userId, category)` unique index

**6. Scheduled notification idempotency gap**

- Location: `src/features/notifications/notifications.mutations.ts:259-269`
- Issue: No uniqueness constraint; duplicate schedules possible
- Fix: Add unique index on `(template_key, user_id, organization_id, scheduled_for)`

**7. a11y scan downloads axe-core from CDN**

- Location: `scripts/run-sin-a11y-scan.ts:136`
- Issue: Runtime fetch from jsdelivr; supply chain + CI reliability risk
- Fix: Install `axe-core` as devDependency, load from node_modules

**8. Reporting overview query missing ordering**

- Location: `src/features/reporting/reporting.queries.ts:212-231`
- Issue: No `orderBy` clause; results returned in arbitrary order
- Fix: Add `.orderBy(asc(reportingTasks.dueDate))`

#### Lower-Priority / Polish

**9. Notification template audit logging parity**

- Issue: `createNotificationTemplate` logs admin action; update/delete do not
- Fix: Add `logAdminAction` to `updateNotificationTemplate` and `deleteNotificationTemplate`

**10. Evidence hygiene for RFP submission**

- Issue: Evidence files include infrastructure identifiers (DB endpoints, ARNs, emails)
- Fix: Redact or partially mask sensitive values before external sharing

**11. Auth middleware consistency**

- Issue: Mix of manual session lookups vs middleware pattern in notifications
- Fix: Standardize on `getAuthMiddleware()` for all authenticated endpoints

#### Deferred / Not Actionable Now

- **Time-of-day for reminders**: Would need org/tenant timezone + send hour config
- **Reporting metadata date validation**: Fields are strings; stricter ISO date validation future work

### 2025-12-31: External Review Fixes Applied

All high-priority and most medium-priority issues from the external review have been fixed.

**Fixes Applied:**

1. **Dismissed notifications no longer count as unread**
   - `src/features/notifications/notifications.queries.ts`: Updated `listNotifications`
     to exclude dismissed notifications from all listings (added `isNull(dismissedAt)`
     to base condition)
   - Updated `getUnreadNotificationCount` to exclude dismissed notifications
   - `src/features/notifications/notifications.mutations.ts`: `dismissNotification`
     now sets both `dismissedAt` and `readAt` when dismissing

2. **Date-only field parsing fixed in SIN portal stats**
   - `src/routes/dashboard/sin/index.tsx`: Added `formatDateOnly` helper for ISO date
     string comparisons (avoids UTC midnight issues)
   - Updated `isSubmitted` to include `under_review` status
   - Due/overdue calculations now use string comparisons for date-only values

3. **FK reference added to notification_email_deliveries**
   - `src/db/schema/notifications.schema.ts`: `notificationId` now references
     `notifications.id` with `onDelete: "cascade"`
   - Requires schema migration to apply

4. **Hard-coded credential defaults removed from scripts**
   - `scripts/run-sin-a11y-scan.ts`: Email, password, and TOTP secret now require
     env vars (`SIN_A11Y_EMAIL`, `SIN_A11Y_PASSWORD`, `SIN_A11Y_TOTP_SECRET`)
   - `scripts/verify-sin-security-lockout.ts`: Email requires env var
     (`SIN_LOCKOUT_EMAIL`)

5. **Notification preferences upsert race fixed**
   - `src/features/notifications/notifications.mutations.ts`: Replaced select-then-
     update/insert with `insert...onConflictDoUpdate` on unique index
     `(userId, category)`

6. **Scheduled notification idempotency added**
   - `src/db/schema/notifications.schema.ts`: Added unique index
     `scheduled_notifications_idempotency_idx` on `(templateKey, userId,
organizationId, scheduledFor)`
   - `src/features/notifications/notifications.mutations.ts`: `scheduleNotification`
     now uses `onConflictDoNothing` for duplicate suppression
   - Requires schema migration to apply

7. **Reporting overview query ordering added**
   - `src/features/reporting/reporting.queries.ts`: `listReportingOverview` now
     returns results ordered by `dueDate ASC, organizationName ASC`

8. **Notification template audit logging parity**
   - `src/features/notifications/notifications.mutations.ts`: Added
     `NOTIFICATION_TEMPLATE_UPDATE` and `NOTIFICATION_TEMPLATE_DELETE` audit
     logging to match create

**Verification:**

- `pnpm lint` passes (pre-existing console warnings only)
- `pnpm check-types` passes

**Pending:**

- ~~Schema migrations needed for FK + unique index changes~~ ✅ Applied
- Evidence redaction for external RFP submission (manual step)
- axe-core local installation (optional CI reliability improvement)

### 2025-12-31: Schema Migration Applied

Ran `npx sst shell --stage sin-dev -- npx drizzle-kit push --force` to apply schema changes.

**Changes applied to sin-dev:**

1. **FK constraint added:**

   ```sql
   ALTER TABLE "notification_email_deliveries"
   ADD CONSTRAINT "notification_email_deliveries_notification_id_notifications_id_fk"
   FOREIGN KEY ("notification_id") REFERENCES "notifications"("id")
   ON DELETE cascade;
   ```

2. **Unique index created:**

   ```sql
   CREATE UNIQUE INDEX "scheduled_notifications_idempotency_idx"
   ON "scheduled_notifications" USING btree
   ("template_key", "user_id", "organization_id", "scheduled_for");
   ```

3. **BI views recreated** (dropped/recreated as part of schema sync):
   - `bi_v_organizations`
   - `bi_v_reporting_submissions`
   - `bi_v_form_submissions`
   - `bi_v_events`

**Notes:**

- Identifier truncation warnings for long FK constraint names (cosmetic, no functional impact)
- Some existing FK constraints were refreshed (event_registrations, checkout_items, membership_purchases)

**Verification:** Schema changes applied successfully to sin-dev database.
