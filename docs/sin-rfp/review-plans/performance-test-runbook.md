# Performance Test Runbook - SIN (viaSport)

## Purpose

Stand up a dedicated performance testing environment and run repeatable load
and baseline performance tests against the SIN application with a 20M row
synthetic dataset. The goal is to produce consistent, comparable metrics
without impacting production or shared dev.

This runbook aligns with:

- `docs/sin-rfp/review-plans/performance-testing-plan.md`
- `docs/sin-rfp/phase-0/architecture-reference.md`

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

## High-Level Phases

1. Provision `sin-perf` infrastructure
2. Seed baseline SIN data
3. Generate 20M synthetic rows
4. Run baseline performance tests
5. Run load tests
6. Capture results and report
7. Clean up or scale down

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

## Phase 6 - Reporting

Create a dated report summary with:

- Environment details
- Data scale and distribution
- Test parameters
- Metrics table
- Findings and bottlenecks
- Recommendations

Suggested location:
`performance/reports/YYYYMMDD-summary.md`

## Phase 7 - Teardown / Scale Down

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

- Perf environment is isolated and documented
- 20M rows loaded successfully with no PII
- Baseline tests complete with recorded metrics
- Load test completed at 10-25 concurrent users
- Findings and recommendations captured in report
