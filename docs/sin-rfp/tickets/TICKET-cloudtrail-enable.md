# TICKET: Enable CloudTrail Logging for SIN AWS Account

**Status**: Completed
**Priority**: P1
**Component**: Infrastructure / Security
**Date**: 2026-01-06
**Author**: Codex (AI Assistant)
**Updated**: 2026-01-06 (scope clarification)

---

## Summary

The RFP response lists CloudTrail as an in-use service, but no CloudTrail trail
exists in the AWS account. Add CloudTrail with appropriate alarms to satisfy
both the RFP claim and SEC-AGG-002 (threat detection) requirements.

---

## Background

**RFP Claims:**

- `docs/sin-rfp/response/03-service-approach/platform-design/final.md` (line 19):
  Lists "CloudTrail - API audit logging" as a Cloud Provider Service
- `docs/sin-rfp/response/08-appendices/final.md` (line 73): Lists CloudTrail
  under Monitoring in the Technology Stack

**Current State:**

- `aws cloudtrail describe-trails` returns empty `trailList`
- No CloudTrail resources in `sst.config.ts`
- Application-level audit logging EXISTS and is robust (SEC-AGG-004)

**Two Audit Layers (Important Distinction):**

| Layer                | Purpose                                        | Status                             |
| -------------------- | ---------------------------------------------- | ---------------------------------- |
| Application audit    | User actions in the app (logins, data changes) | ✅ Built (PostgreSQL + S3 archive) |
| Infrastructure audit | AWS API calls (IAM changes, resource creation) | ❌ Missing                         |

---

## Scope

### Part 1: CloudTrail Trail (satisfies RFP claim)

1. Create S3 bucket for CloudTrail logs with:
   - Versioning enabled
   - Server-side encryption (SSE-S3)
   - Lifecycle policy (90 days → Glacier, 7 years retention for prod)
   - Block public access

2. Create CloudTrail trail with:
   - Management events (write-only to reduce noise/cost)
   - S3 data events for PII-sensitive buckets only (`SinArtifacts`, `SinAuditArchives`)
   - CloudWatch Logs integration for alerting
   - Multi-region: false (single region ca-central-1)

### Part 2: Security Alarms (satisfies SEC-AGG-002)

CloudWatch alarms for infrastructure-level threats:

| Alarm                     | Metric Filter Pattern                                                          | Threshold  |
| ------------------------- | ------------------------------------------------------------------------------ | ---------- |
| Root account usage        | `{ $.userIdentity.type = "Root" }`                                             | ≥1         |
| IAM policy changes        | `{ ($.eventName = DeleteGroupPolicy) \|\| ... }`                               | ≥1         |
| CloudTrail config changes | `{ ($.eventName = StopLogging) \|\| ... }`                                     | ≥1         |
| Security group changes    | `{ ($.eventName = AuthorizeSecurityGroupIngress) \|\| ... }`                   | ≥1         |
| Unauthorized API calls    | `{ ($.errorCode = "*UnauthorizedAccess*") \|\| ... }`                          | ≥5 in 5min |
| Console login without MFA | `{ ($.eventName = ConsoleLogin) && ($.additionalEventData.MFAUsed != "Yes") }` | ≥1         |

### Part 3: Documentation

- Update RFP sections to accurately describe what CloudTrail covers
- Mark ticket as complete in COMPREHENSIVE-UPDATE-GUIDE.md

---

## Implementation Notes

- Use existing alarm SNS topic (`alarmTopic`) for notifications
- Enabled for prod/perf/uat stages (dev uses AWS default event history to control costs)
- CloudTrail pricing: ~$2/100k management events, data events are more expensive
- S3 data events limited to specific buckets to control costs
- Log retention: 7 years for prod, 1 year for perf/uat

---

## Testing

```bash
# Verify trail exists
aws cloudtrail describe-trails --region ca-central-1

# Verify trail is logging
aws cloudtrail get-trail-status --name solstice-<stage>-audit-trail

# Verify log group exists
aws logs describe-log-groups --log-group-name-prefix /aws/cloudtrail/solstice

# Verify alarms exist
aws cloudwatch describe-alarms --alarm-name-prefix solstice-<stage>-cloudtrail
```

---

## References

- `sst.config.ts`
- `docs/sin-rfp/response/03-service-approach/platform-design/final.md`
- `docs/sin-rfp/response/08-appendices/final.md`
- `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`
- AWS CIS Benchmark for CloudTrail alarms
