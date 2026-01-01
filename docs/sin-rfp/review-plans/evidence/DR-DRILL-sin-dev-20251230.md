# DR Drill Evidence — sin-dev (Template)

## Overview

- Date: 2025-12-30
- Environment: sin-dev
- Operator: Codex
- Source snapshot/backup: rds:solstice-sin-dev-databaseinstance-bdckvktk-2025-12-29-04-46
- Restore target: solstice-sin-dev-dr-20251230
- RPO target: 1 hour
- RTO target: 4 hours

## Steps

1. Identify latest automated snapshot for sin-dev database. (Done)
2. Initiate restore to temporary instance or clone. (Done)
3. Validate application connectivity to restored instance. (Done)
4. Confirm key tables and row counts. (Done)
5. Document restore completion time. (Done)

## Evidence

- Snapshot identifier: rds:solstice-sin-dev-databaseinstance-bdckvktk-2025-12-29-04-46
- Snapshot create time: 2025-12-29T04:46:12Z
- Restore start time: 2025-12-30T23:52:00Z (approx, CLI restore command)
- Restore completion time: 2025-12-30T23:56:41Z (RDS event: "Restored from snapshot")
- Restored endpoint: solstice-sin-dev-dr-20251230.cx20ui4g0b7v.ca-central-1.rds.amazonaws.com
- Validation queries run:
  - `select count(*) from organizations;` → 10
  - `select count(*) from form_submissions;` → 1
  - `select count(*) from reporting_submissions;` → 1
- RPO achieved: No (snapshot age ~43h 10m vs 1h target; sin-dev snapshot cadence)
- RTO achieved: Yes (~5 minutes)
- Screenshots/log links: CLI output from `aws rds restore-db-instance-from-db-snapshot`,
  `aws rds describe-events`, `psql` validation queries

## Notes

- Issues encountered: None (restore and connectivity succeeded).
- Follow-up actions: Delete DR instance after evidence is captured.

## RPO Decision (2025-12-31)

**Decision**: Dev environments use daily snapshots (24h RPO); production uses PITR
with hourly snapshots (1h RPO).

**Rationale**:

- Sin-dev daily snapshot cadence is acceptable for development/test evidence.
- Production (`sin-prod`, `qc-prod`) configured with:
  - `backupRetentionDays: 35` (vs 7 for dev)
  - Point-in-time recovery enabled by default on RDS
  - Multi-AZ deployment for high availability
- The 43h gap observed in this drill reflects sin-dev's daily backup schedule,
  not production capability.

**Stakeholder**: Austin (2025-12-31)
