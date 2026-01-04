# Ticket: Enable S3 Object Lock for Compliance

## Summary

Enable S3 Object Lock on production buckets to meet SEC-AGG-003 (Privacy & Regulatory Compliance) requirements for immutable data retention.

## Context

viaSport requires data retention policies that prevent tampering or deletion during retention periods. S3 Object Lock provides WORM (Write Once Read Many) protection that satisfies this requirement.

## Requirements

- SEC-AGG-003: "secure handling, storage, and access to personal information"
- Audit log retention: 7 years (immutable)
- Legal hold support: prevent deletion of held records

## Tasks

### 1. Enable Object Lock on audit archive bucket

- [ ] Create new S3 bucket with Object Lock enabled (cannot be added to existing buckets)
- [ ] Configure Governance mode (allows bypass with special permission) or Compliance mode (no bypass)
- [ ] Set default retention period (7 years for audit logs)

### 2. Update archival workflow

- [ ] Modify `src/lib/privacy/retention.ts` to write to Object Lock bucket
- [ ] Ensure archived audit logs go to locked bucket
- [ ] Test retention period enforcement

### 3. Legal hold integration

- [ ] Implement `applyLegalHold(objectKey)` function
- [ ] Integrate with existing legal hold workflow in privacy features
- [ ] Test that held objects cannot be deleted

### 4. SST infrastructure

- [ ] Add Object Lock bucket to `sst.config.ts` for sin-prod stage
- [ ] Configure IAM policies for lock management
- [ ] Document in `/docs/sin-rfp/phase-0/data-residency.md`

## Acceptance Criteria

- [ ] Audit archives written to Object Lock bucket in sin-prod
- [ ] Objects cannot be deleted during retention period (verify in console)
- [ ] Legal hold prevents deletion (test with held object)
- [ ] Evidence captured for SEC-AGG-003 compliance

## Notes

- Object Lock must be enabled at bucket creation time
- Consider Governance mode for flexibility during initial deployment
- Cost impact: minimal (same S3 storage pricing)

## Priority

Medium - Required for production hardening, not blocking proposal submission

## References

- AWS S3 Object Lock: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- SEC-AGG-003 requirement in `/docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`
