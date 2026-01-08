# Performance, DR, and Validation Runbook - SIN (viaSport)

## Purpose

Stand up a dedicated performance testing environment and run repeatable load
and baseline performance tests against the SIN application with a 20M row
synthetic dataset. Additionally, execute disaster recovery drills and retention
policy validation to provide evidence for RFP compliance claims.

The goal is to produce consistent, comparable metrics and compliance evidence
without impacting production or shared dev.

This runbook aligns with:

- `docs/sin-rfp/review-plans/performance-testing-plan.md`
- `docs/sin-rfp/phase-0/architecture-reference.md`
- `docs/sin-rfp/phase-0/backup-dr-plan.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`

## Environment Decision

Use a dedicated perf stage in the dev AWS account:

- Stage: `sin-perf`
- AWS profile: `techdev`
- Rationale: isolate load, allow aggressive logging, reset data safely

Do not run performance tests in production. Even if prod is empty, it blocks
safe resets, may require approvals, and can skew compliance posture.

## Preflight Checklist

- [ ] AWS SSO login: `aws sso login --profile techdev`
- [ ] Confirm `sin-perf` stage exists or will be deployed
- [ ] Confirm database access method (SST tunnel or shell)
- [ ] Confirm perf test user(s) and auth flow for scripted access
- [ ] Confirm perf user is **no-MFA** to support automation
- [ ] Export perf credentials for tooling (`PERF_EMAIL`, `PERF_PASSWORD`)
- [ ] Confirm test windows with the team if shared infra
- [ ] Ensure no prod endpoints are targeted by test tools
- [ ] Confirm DB instrumentation plan (Performance Insights, pg_stat_statements)

### DR and Retention Preflight

- [ ] Confirm RDS automated backups are enabled (check `sst.config.ts`)
- [ ] Confirm at least one automated snapshot exists for sin-perf
- [ ] Confirm retention policies are seeded (`scripts/seed-retention-policies.ts`)
- [ ] Confirm S3 bucket for audit archives exists (`SinAuditArchives`)
- [ ] Document RPO/RTO targets: RPO = 1 hour (PITR), RTO = 4 hours

## High-Level Phases

1. Provision `sin-perf` infrastructure
2. Seed baseline SIN data
3. Generate 20M synthetic rows
4. Run baseline performance tests
5. Run load tests
6. **Run disaster recovery drill**
7. **Run retention policy validation**
8. Capture results and report
9. Clean up or scale down

## Phase 1 - Provision `sin-perf`

### 1.1 Deploy stage

Use the dev account for perf.

```bash
AWS_PROFILE=techdev npx sst deploy --stage sin-perf
```

### 1.2 Verify deployment

- Health check: `GET /api/health`
- Login flow works
- Required secrets are present (DatabaseUrl, BetterAuthSecret, BaseUrl)

### 1.3 Confirm resource sizing

Ensure perf matches production-class settings where possible:

- RDS instance class
- Lambda memory and timeout
- RDS Proxy enabled
- CloudFront enabled for static assets

Note: If perf uses smaller sizing, document the delta in the report.

## Phase 2 - Baseline Seed Data

Use the existing SIN seed script to create a realistic baseline.

```bash
# Use a safe, repeatable baseline for sin-perf
AWS_PROFILE=techdev npx sst shell --stage sin-perf -- \
  npx tsx scripts/seed-sin-data.ts --force
```

If `--force` is not appropriate for perf, update the run to a reset option
or a dedicated perf seeding script.

## Phase 3 - Generate 20M Synthetic Rows

### 3.1 Principles

- No PII, use synthetic names and emails
- Distribute rows across the largest tables that drive query load
- Spread timestamps over multiple years to simulate historical load
- Prefer bulk SQL insertions for speed and predictability

### 3.2 Target tables

Decide on the top 3-5 tables to carry most rows. Examples:

- Form submissions and responses
- Reporting task logs
- Audit logs
- Event participation

Document the chosen tables in the run report.

### 3.3 Data distribution template

Example distribution (adjust to schema reality):

- 12M rows: submissions
- 5M rows: submission line items
- 2M rows: audit logs
- 1M rows: reporting tasks

### 3.4 Generate data using SQL

Use `generate_series` for bulk inserts. Run inside `psql` or an
SST shell session that connects to the perf database.

Example pattern (safe deterministic ID selection, avoids join explosion):

```sql
-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH orgs AS (
  SELECT array_agg(id) AS ids
  FROM organizations
  WHERE tenant_id = 'viasport'
),
forms AS (
  SELECT array_agg(id) AS ids
  FROM forms
  WHERE tenant_id = 'viasport'
)
INSERT INTO submissions (
  id,
  organization_id,
  form_id,
  created_at,
  updated_at,
  status
)
SELECT
  gen_random_uuid(),
  orgs.ids[(g % array_length(orgs.ids, 1)) + 1],
  forms.ids[(g % array_length(forms.ids, 1)) + 1],
  NOW() - ((g % (365 * 5)) * interval '1 day'),
  NOW() - ((g % (365 * 5)) * interval '1 day'),
  'submitted'
FROM
  generate_series(1, 12000000) g,
  orgs,
  forms;
```

Notes:

- Avoid cross joins that explode too large. Use fixed ID arrays or sampled ids.
- Disable non-essential triggers during bulk loads if needed.
- For very large inserts, batch in 500k-1M row chunks.

### 3.5 Optional CSV bulk load

If SQL inserts are too slow, generate CSVs and use `COPY`:

```sql
COPY submissions (id, organization_id, form_id, created_at, updated_at, status)
FROM '/path/to/submissions.csv'
WITH (FORMAT csv, HEADER true);
```

### 3.6 Post-load maintenance

After bulk inserts:

- Rebuild or analyze indexes if needed
- Run `VACUUM (ANALYZE)` on all affected tables

```sql
VACUUM (ANALYZE) submissions;
VACUUM (ANALYZE) submission_items;
VACUUM (ANALYZE) audit_logs;
```

### 3.7 Verify row counts

Confirm scale and distribution before testing:

```sql
SELECT relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Phase 4 - Baseline Performance Tests

Follow `docs/sin-rfp/review-plans/performance-testing-plan.md`:

- Lighthouse CI on key routes
- Playwright performance tests
- Bundle size audit

### 4.1 Lighthouse

```bash
PERF_BASE_URL=https://<sin-perf-url> \
PERF_EMAIL="<perf-user-email>" \
PERF_PASSWORD="<perf-user-password>" \
pnpm exec lhci autorun
```

Notes:

- Use a no-MFA perf user.
- Configure `performance/lhci-auth.js` for login automation.

### 4.2 Playwright perf tests

```bash
BASE_URL=https://<sin-perf-url> pnpm test:e2e --grep="Performance" --workers=1
```

### 4.3 Bundle analysis (optional)

```bash
pnpm analyze:bundle
```

## Phase 5 - Load Testing (k6)

### 5.1 Install k6

```bash
brew install k6
```

### 5.2 Configure script

Use the sample in the performance plan or create a perf-specific script:
`performance/load-tests/api-load.js`

Ensure auth for requests:

- Use `SESSION_COOKIE` from an authenticated user
- Or create a dedicated API token flow

Ensure endpoints are real and stable:

- Prefer `/api/perf/*` endpoints in perf/dev
- Or capture TanStack Start server-function requests from the browser

### 5.3 Run test

```bash
BASE_URL=https://<sin-perf-url> SESSION_COOKIE="<cookie>" \
  k6 run --summary-export performance/reports/k6/<date>-summary.json \
  performance/load-tests/api-load.js
```

### 5.4 Record metrics

Capture:

- p50/p95/p99 latency
- error rate
- throughput
- database query timings (if enabled)

### 5.5 Database instrumentation (sin-perf)

- [ ] Enable RDS Performance Insights for the perf instance
- [ ] Enable `pg_stat_statements`
- [ ] Capture top queries by total time and mean time after each run
- [ ] Snapshot CPU, connections, and IOPS during the run window

## Repeatability Controls

- Run warm-up passes before recording metrics (reduce cold start noise)
- Run each scenario at least 3 times; report median and p95
- Keep Playwright at `--workers=1` for perf runs
- Record commit SHA, stage, RDS class/storage, Lambda memory/timeout, and
  CloudFront enabled/disabled in the report

## Phase 6 - Disaster Recovery Drill

Execute a full DR drill to validate backup/restore capabilities and document
RTO/RPO compliance.

### 6.1 Identify Latest Snapshot

```bash
# List available snapshots for sin-perf
AWS_PROFILE=techdev aws rds describe-db-snapshots \
  --db-instance-identifier solstice-sin-perf-databaseinstance-* \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table \
  --region ca-central-1
```

For automated snapshots:

```bash
AWS_PROFILE=techdev aws rds describe-db-snapshots \
  --snapshot-type automated \
  --query 'DBSnapshots[?contains(DBSnapshotIdentifier, `sin-perf`)].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table \
  --region ca-central-1
```

Record the snapshot identifier and creation time.

### 6.2 Restore to Temporary Instance

```bash
# Record start time
echo "Restore started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

AWS_PROFILE=techdev aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier solstice-sin-perf-dr-$(date +%Y%m%d) \
  --db-snapshot-identifier <snapshot-identifier> \
  --db-instance-class db.t4g.micro \
  --no-multi-az \
  --region ca-central-1

# Monitor restore progress
AWS_PROFILE=techdev aws rds describe-db-instances \
  --db-instance-identifier solstice-sin-perf-dr-$(date +%Y%m%d) \
  --query 'DBInstances[0].DBInstanceStatus' \
  --region ca-central-1
```

### 6.3 Wait for Availability

```bash
AWS_PROFILE=techdev aws rds wait db-instance-available \
  --db-instance-identifier solstice-sin-perf-dr-$(date +%Y%m%d) \
  --region ca-central-1

# Record completion time
echo "Restore completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

### 6.4 Validate Restored Data

Connect to the restored instance and verify data integrity:

```bash
# Get endpoint
AWS_PROFILE=techdev aws rds describe-db-instances \
  --db-instance-identifier solstice-sin-perf-dr-$(date +%Y%m%d) \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region ca-central-1
```

Run validation queries:

```sql
-- Core table counts
SELECT 'organizations' AS table_name, COUNT(*) FROM organizations
UNION ALL SELECT 'users', COUNT(*) FROM "user"
UNION ALL SELECT 'form_submissions', COUNT(*) FROM form_submissions
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- Verify recent data exists (within expected RPO window)
SELECT MAX(created_at) AS latest_record FROM audit_logs;

-- Verify hash chain integrity (sample)
SELECT id, previous_hash, content_hash
FROM audit_logs
ORDER BY occurred_at DESC
LIMIT 5;
```

### 6.5 Document Results

Create evidence file: `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-perf-YYYYMMDD.md`

Required fields:

- Date and operator
- Source snapshot identifier and creation time
- Restore start and completion times
- RTO achieved (target: 4 hours)
- RPO achieved (target: 1 hour for prod, 24h acceptable for perf)
- Validation query results
- Any issues encountered

### 6.6 Clean Up DR Instance

```bash
AWS_PROFILE=techdev aws rds delete-db-instance \
  --db-instance-identifier solstice-sin-perf-dr-$(date +%Y%m%d) \
  --skip-final-snapshot \
  --region ca-central-1
```

## Phase 7 - Retention Policy Validation

Validate that the retention policy engine correctly enforces configured
retention periods and respects legal holds.

### 7.1 Seed Retention Policies

Ensure retention policies are configured:

```bash
AWS_PROFILE=techdev npx sst shell --stage sin-perf -- \
  npx tsx scripts/seed-retention-policies.ts
```

Verify policies exist:

```sql
SELECT data_type, retention_days, archive_after_days, purge_after_days, legal_hold
FROM retention_policies
ORDER BY data_type;
```

### 7.2 Create Test Data for Purging

Insert aged test records that should be purged:

```sql
-- Insert old notifications (90+ days old, should be purged)
INSERT INTO notifications (id, user_id, type, title, message, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM "user" LIMIT 1),
  'system',
  'Test notification ' || g,
  'This is a test notification for retention validation',
  NOW() - INTERVAL '100 days'
FROM generate_series(1, 10) g;

-- Insert old import job errors (90+ days old, should be purged)
-- (Requires an import job to exist first)

-- Record counts before purge
SELECT 'notifications' AS table_name,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') AS eligible_for_purge
FROM notifications;
```

### 7.3 Create Legal Hold Test

Apply a legal hold to verify it blocks purging:

```sql
-- Create a legal hold on a specific user
INSERT INTO legal_holds (scope_type, scope_id, reason, applied_at)
VALUES ('user', (SELECT id FROM "user" LIMIT 1), 'Retention validation test', NOW());

-- Insert data for that user that would otherwise be purged
INSERT INTO notifications (id, user_id, type, title, message, created_at)
SELECT
  gen_random_uuid(),
  (SELECT scope_id FROM legal_holds WHERE reason = 'Retention validation test'),
  'system',
  'Legal hold test ' || g,
  'This notification should NOT be purged due to legal hold',
  NOW() - INTERVAL '100 days'
FROM generate_series(1, 5) g;
```

### 7.4 Run Retention Job

Trigger the retention enforcement manually:

```bash
# Option 1: Via SST shell
AWS_PROFILE=techdev npx sst shell --stage sin-perf -- \
  npx tsx -e "import { applyRetentionPolicies } from './src/lib/privacy/retention'; applyRetentionPolicies().then(console.log);"

# Option 2: Invoke the Lambda directly
AWS_PROFILE=techdev aws lambda invoke \
  --function-name solstice-sin-perf-RetentionEnforcement \
  --region ca-central-1 \
  /dev/stdout
```

### 7.5 Validate Purge Results

```sql
-- Verify eligible records were purged
SELECT 'notifications' AS table_name,
       COUNT(*) AS remaining,
       COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') AS old_remaining
FROM notifications;

-- Verify legal hold records were NOT purged
SELECT COUNT(*) AS legal_hold_records_remaining
FROM notifications
WHERE user_id = (SELECT scope_id FROM legal_holds WHERE reason = 'Retention validation test');
```

Expected results:

- Old notifications (not under legal hold) should be deleted
- Notifications under legal hold should remain
- Audit logs should NEVER be deleted (immutable)

### 7.6 Validate Audit Log Archival

Check that audit log archival works (archives to S3, does not delete):

```sql
-- Check archive records
SELECT * FROM audit_log_archives ORDER BY archived_at DESC LIMIT 5;
```

Verify S3 objects exist:

```bash
AWS_PROFILE=techdev aws s3 ls s3://solstice-sin-perf-sinauditarchives/ --recursive
```

### 7.7 Document Results

Create evidence file: `docs/sin-rfp/review-plans/evidence/RETENTION-VALIDATION-sin-perf-YYYYMMDD.md`

Required fields:

- Date and operator
- Retention policies in effect
- Test data created (counts)
- Purge job execution results
- Legal hold enforcement verified (yes/no)
- Audit log immutability verified (yes/no)
- S3 archive objects created (yes/no)
- Any issues encountered

### 7.8 Clean Up Test Data

```sql
-- Remove legal hold
DELETE FROM legal_holds WHERE reason = 'Retention validation test';

-- Any remaining test data will be cleaned up by normal retention runs
```

## Phase 8 - Reporting

Create a dated report summary with:

- Environment details
- Data scale and distribution
- Test parameters
- Metrics table (performance)
- DR drill results (RTO/RPO achieved)
- Retention validation results (purge/legal hold/archive)
- Findings and bottlenecks
- Recommendations

Suggested locations:

- Performance: `performance/reports/YYYYMMDD-summary.md`
- DR evidence: `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-perf-YYYYMMDD.md`
- Retention evidence: `docs/sin-rfp/review-plans/evidence/RETENTION-VALIDATION-sin-perf-YYYYMMDD.md`

## Phase 9 - Teardown / Scale Down

- If perf is idle, scale down or destroy to control cost
- Preserve reports in repo

```bash
AWS_PROFILE=techdev npx sst remove --stage sin-perf
```

## Safety and Cost Controls

- Never point load tests at prod
- Only use `techdev` for synthetic data
- Perf deploys are on-demand and ephemeral
- Schedule large loads during off-hours

## Troubleshooting

- Slow inserts: reduce batch size, disable non-essential triggers, use COPY
- High error rate: confirm auth cookie, rate limits, and database proxy limits
- Spiky latency: check cold starts, query plans, missing indexes

## Acceptance Criteria

### Performance

- [ ] Perf environment is isolated and documented
- [ ] 20M rows loaded successfully with no PII
- [ ] Baseline tests complete with recorded metrics
- [ ] Load test completed at 10-25 concurrent users
- [ ] Findings and recommendations captured in report

### Disaster Recovery

- [ ] DR drill executed successfully
- [ ] RTO achieved (< 4 hours)
- [ ] RPO documented (24h for perf, 1h capability for prod)
- [ ] Data integrity validated post-restore
- [ ] Evidence file created with all required fields

### Retention Policy

- [ ] Retention policies seeded and verified
- [ ] Purge job executed successfully
- [ ] Eligible records purged (notifications, import errors)
- [ ] Legal hold enforcement verified (held records NOT purged)
- [ ] Audit log immutability verified (never deleted)
- [ ] S3 archival verified (audit archives exist in Glacier)
- [ ] Evidence file created with all required fields
