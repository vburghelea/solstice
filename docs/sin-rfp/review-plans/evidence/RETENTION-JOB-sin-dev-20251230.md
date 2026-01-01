# Retention Enforcement Evidence — sin-dev (Template)

## Overview

- Date: 2025-12-30
- Environment: sin-dev
- Operator: Codex
- Job trigger: Manual CLI

## Run Details

- Command executed: `AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx tsx -e "import { handler } from './src/cron/enforce-retention'; handler().then((res) => { console.log(JSON.stringify(res, null, 2)); }).catch((err) => { console.error(err); process.exit(1); });"`
- Job start time: 2025-12-30T23:51:44Z
- Job end time: 2025-12-30T23:51:45Z
- Result summary: Job completed; policies evaluated but no purge policy configured.

## Results

- Policies evaluated: audit_logs, form_submissions, user_sessions, notifications
- Records purged: 0
- Archives created: 0
- Legal-hold skips: 0
- Errors: None reported (skipped due to no purge policy / no eligible rows).

## Notes

- Follow-up actions: Configure purgeAfterDays on at least one policy to exercise deletion.

## Follow-up Run (Legal Hold + Purge)

- Date: 2025-12-31
- Environment: sin-dev
- Operator: Codex
- Job trigger: Manual CLI

### Setup

- Retention policy: `notifications` with `purgeAfterDays=0`, `retentionDays=30`.
- Legal hold applied to notification record `03acce02-38e4-44ee-8bad-ebf2c57b548f`
  (`scope_type=record`, `data_type=notifications`).

### Run Details

- Command executed: `AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx tsx -e "import { handler } from './src/cron/enforce-retention'; handler().then((res) => { console.log(JSON.stringify(res, null, 2)); })"`
- Job start time: 2025-12-31T03:06:19Z
- Job end time: 2025-12-31T03:06:20Z
- Result summary: `notifications` purged (deleted 2); held record retained.

### Results

- Policies evaluated: audit_logs, form_submissions, user_sessions, notifications
- Records purged: 2 notifications
- Legal-hold skips: 1 notification (held record retained)
- Errors: None reported
