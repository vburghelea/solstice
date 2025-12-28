# SIN Backup and Restore Test Results

## Document Control

| Item     | Value                       |
| -------- | --------------------------- |
| Document | Backup/Restore Test Results |
| Audience | viaSport BC Evaluation Team |
| Version  | 1.0                         |
| Scope    | SIN dev (sin-dev)           |

## Test Summary

- **Test date (UTC):** 2025-12-27
- **Environment:** sin-dev (techdev account, ca-central-1)
- **Restore type:** RDS PostgreSQL point-in-time restore (latest restorable time)
- **Source instance:** `solstice-sin-dev-databaseinstance-bdckvktk`
- **Target instance:** `solstice-sin-dev-restore-20251227-2312`
- **Test status:** Completed (restored instance created, endpoint observed, and deleted)

## Procedure

1. Identified source RDS instance and latest restorable time.
2. Initiated PITR restore to a new instance in the same subnet group and VPC
   security group as the source.
3. Monitored the restored instance until the endpoint was available (status
   remained `backing-up` during initial checks).
4. Captured endpoint metadata and recorded timestamps.
5. Deleted the restored instance to avoid ongoing cost.

## Evidence (Commands)

```bash
# Source instance status and latest restorable time
AWS_PROFILE=techdev aws rds describe-db-instances \
  --region ca-central-1 \
  --db-instance-identifier solstice-sin-dev-databaseinstance-bdckvktk \
  --query "DBInstances[0].LatestRestorableTime"

# Start PITR restore
AWS_PROFILE=techdev aws rds restore-db-instance-to-point-in-time \
  --region ca-central-1 \
  --source-db-instance-identifier solstice-sin-dev-databaseinstance-bdckvktk \
  --target-db-instance-identifier solstice-sin-dev-restore-20251227-2312 \
  --use-latest-restorable-time \
  --db-instance-class db.t4g.micro \
  --db-subnet-group-name solstice-sin-dev-databasesubnetgroup-trvbuzww \
  --vpc-security-group-ids sg-0b95b9fc5a2956ab5 \
  --no-publicly-accessible \
  --tags Key=purpose,Value=backup-restore-drill Key=stream,Value=stream-l

# Wait for restored instance
AWS_PROFILE=techdev aws rds wait db-instance-available \
  --region ca-central-1 \
  --db-instance-identifier solstice-sin-dev-restore-20251227-2312

# Delete restored instance (cleanup)
AWS_PROFILE=techdev aws rds delete-db-instance \
  --region ca-central-1 \
  --db-instance-identifier solstice-sin-dev-restore-20251227-2312 \
  --skip-final-snapshot \
  --delete-automated-backups
```

## Results

| Metric | Target  | Observed | Notes                                                   |
| ------ | ------- | -------- | ------------------------------------------------------- |
| RPO    | 1 hour  | < 5 min  | Latest restorable time was 2025-12-27T23:14:34Z.        |
| RTO    | 4 hours | ~25 min  | Restore initiated ~23:12Z; endpoint observed 23:37:44Z. |

## Timeline (UTC)

- 23:12 Restore initiated (PITR, latest restorable time).
- 23:15:50 InstanceCreateTime reported by RDS.
- 23:37:44 Endpoint observed (status: `backing-up`).
- 23:38:20 Delete initiated (cleanup).

## Findings and Follow-ups

- Restored instance status remained `backing-up` during initial checks, but the
  endpoint was assigned and reachable metadata was present.
- Data-level validation requires VPC access (tunnel or SSM port forwarding).
  Plan a follow-up drill to run a simple `SELECT 1` and row-count spot checks.
- Cleanup executed immediately after verification to avoid ongoing cost.
