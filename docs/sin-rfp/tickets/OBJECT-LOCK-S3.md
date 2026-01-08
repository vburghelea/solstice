# Ticket: Enable S3 Object Lock for Compliance

**Status**: ✅ Infrastructure Verified (2026-01-07)
**Priority**: Medium
**Component**: Infrastructure / Compliance

## Summary

Enable S3 Object Lock on production buckets to meet SEC-AGG-003 (Privacy & Regulatory Compliance) requirements for immutable data retention.

## Status Update

- Added a dedicated Object Lock audit archive bucket (`SinAuditArchives`) with
  default governance retention (7 years in perf/prod; 1 day in dev) and wired
  `SIN_AUDIT_ARCHIVE_BUCKET` into the web app + retention cron.
- Retention now archives audit logs to the Object Lock bucket and records
  bucket/key in `audit_log_archives`.
- Legal hold workflow now applies/releases S3 legal holds for audit archives and
  DSAR exports.
- Data residency documentation updated for audit archive Object Lock controls.

## Verification Results (2026-01-07)

**Test Environment:** sin-dev

### Object Lock Configuration ✅

```bash
$ aws s3api get-object-lock-configuration \
    --bucket solstice-sin-dev-sinauditarchivesbucket-banhfwsb \
    --region ca-central-1

{
    "ObjectLockConfiguration": {
        "ObjectLockEnabled": "Enabled",
        "Rule": {
            "DefaultRetention": {
                "Mode": "GOVERNANCE",
                "Days": 1
            }
        }
    }
}
```

### Bucket Versioning ✅

```bash
$ aws s3api get-bucket-versioning \
    --bucket solstice-sin-dev-sinauditarchivesbucket-banhfwsb

{
    "Status": "Enabled",
    "MFADelete": "Disabled"
}
```

### Remaining Tests

- [ ] Run retention job to create audit archive objects
- [ ] Verify retention prevents deletion
- [ ] Test legal hold workflow end-to-end

## Context

viaSport requires data retention policies that prevent tampering or deletion during retention periods. S3 Object Lock provides WORM (Write Once Read Many) protection that satisfies this requirement.

## Requirements

- SEC-AGG-003: "secure handling, storage, and access to personal information"
- Audit log retention: 7 years (immutable)
- Legal hold support: prevent deletion of held records

## Tasks

### 1. Enable Object Lock on audit archive bucket

- [x] Create new S3 bucket with Object Lock enabled (cannot be added to existing buckets)
- [x] Configure Governance mode (allows bypass with special permission) or Compliance mode (no bypass)
- [x] Set default retention period (7 years for audit logs)

### 2. Update archival workflow

- [x] Modify `src/lib/privacy/retention.ts` to write to Object Lock bucket
- [x] Ensure archived audit logs go to locked bucket
- [ ] Test retention period enforcement

### 3. Legal hold integration

- [x] Implement `applyLegalHold(objectKey)` function
- [x] Integrate with existing legal hold workflow in privacy features
- [ ] Test that held objects cannot be deleted

### 4. SST infrastructure

- [x] Add Object Lock bucket to `sst.config.ts` for sin-prod stage
- [x] Configure IAM policies for lock management
- [x] Document in `/docs/sin-rfp/phase-0/data-residency.md`

## Acceptance Criteria

- [ ] Audit archives written to Object Lock bucket in sin-prod
- [ ] Objects cannot be deleted during retention period (verify in console)
- [ ] Legal hold prevents deletion (test with held object)
- [ ] Evidence captured for SEC-AGG-003 compliance

## Testing Steps

1. Deploy the target stage (sin-dev or sin-prod).
2. Identify the audit archive bucket name (from deploy output or S3 console).
3. Verify Object Lock configuration:

```bash
aws s3api get-object-lock-configuration \
  --bucket <audit-archive-bucket> \
  --region ca-central-1
```

Expected: `ObjectLockEnabled=Enabled` and `defaultRetention` with
`mode=GOVERNANCE` and `years=7` (perf/prod) or `days=1` (dev).

4. Create an audit archive object by running the retention job (invoke the
   `RetentionEnforcement` Lambda or wait for the schedule), then fetch the latest
   archive record:

```sql
select id, bucket, object_key
from audit_log_archives
order by archived_at desc
limit 1;
```

5. Confirm retention is applied on the object (use `VersionId` if required):

```bash
aws s3api head-object \
  --bucket <audit-archive-bucket> \
  --key <object-key> \
  --region ca-central-1
```

Expected: `ObjectLockMode=GOVERNANCE` and a future `ObjectLockRetainUntilDate`.

6. Attempt deletion without bypass (should fail during retention):

```bash
aws s3api delete-object \
  --bucket <audit-archive-bucket> \
  --key <object-key> \
  --region ca-central-1
```

7. Legal hold test (audit archives):
   - In `/dashboard/admin/sin/privacy`, create a legal hold:
     - Scope type: `record`
     - Scope ID: `<audit_log_archives.id>`
     - Data type: `audit_log_archives`
   - Confirm hold status:

```bash
aws s3api get-object-legal-hold \
  --bucket <audit-archive-bucket> \
  --key <object-key> \
  --region ca-central-1
```

Expected: `Status=ON`. After releasing the hold in the UI, expect `Status=OFF`.

8. Legal hold test (DSAR exports):
   - Create a legal hold with scope type `user`, scope ID `<user.id>`, data type
     `dsar_exports` (or `privacy_exports`).
   - Generate a DSAR export for that user and confirm the export object has
     `LegalHold=ON` using `get-object-legal-hold` against the artifacts bucket.

Capture evidence screenshots or CLI output for steps 3, 6, and 7.

## Notes

- Object Lock must be enabled at bucket creation time
- Consider Governance mode for flexibility during initial deployment
- Cost impact: minimal (same S3 storage pricing)

## Priority

Medium - Required for production hardening, not blocking proposal submission

## References

- AWS S3 Object Lock: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- SEC-AGG-003 requirement in `/docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`
