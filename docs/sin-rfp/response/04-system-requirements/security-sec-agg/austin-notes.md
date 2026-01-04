# Austin's Notes - Security Requirements (SEC-AGG)

## Status Summary

| Req ID      | Title                           | Status    | Notes                           |
| ----------- | ------------------------------- | --------- | ------------------------------- |
| SEC-AGG-001 | Authentication & Access Control | ✅ Comply | MFA, RBAC, step-up auth         |
| SEC-AGG-002 | Monitoring & Threat Detection   | ✅ Comply | Anomaly detection, account lock |
| SEC-AGG-003 | Privacy & Regulatory Compliance | Partial   | Object Lock + DPAs pending      |
| SEC-AGG-004 | Audit Trail & Data Lineage      | ✅ Comply | Hash chain, audit UI            |

## What's Strong

- Full MFA with TOTP + backup codes
- Step-up auth for sensitive operations (admin actions, exports)
- Org-scoped RBAC with field-level permissions
- Anomaly detection with automatic account lock
- Tamper-evident hash chain on audit logs
- Canada-only data residency (AWS ca-central-1)
- Encryption at rest (KMS) + in transit (TLS 1.2+)
- 7-year audit log retention policy

## Gaps to Address

### 1. S3 Object Lock (Production Hardening)

- Ticket created: `/docs/sin-rfp/tickets/OBJECT-LOCK-S3.md`
- Enables WORM protection for audit archives
- Priority: Medium - not blocking proposal, needed for prod

### 2. Data Processing Addendums (DPAs)

- AWS DPA: https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf (standard, covers all AWS services including SES)
- ✅ Addressed - reference in proposal

### 3. Security Expert Review

- Recruiting in progress, no update yet
- Would strengthen credibility if available before submission
- Not blocking proposal

## Framing for Proposal

SEC-AGG-003 is "Partial" because:

- Core privacy controls are implemented (encryption, access control, retention)
- Production hardening items (Object Lock, DPA documentation) in progress
- Frame as: "Core compliance implemented; production-grade immutability controls to be enabled at deployment"

## Evidence Available

- MFA flow: `e2e/tests/unauthenticated/auth-flow.unauth.spec.ts`
- Anomaly detection: `src/lib/security/detection.ts`
- Audit hash chain: `src/lib/audit/__tests__/audit-utils.test.ts`
- Data residency: `docs/sin-rfp/phase-0/data-residency.md`
- Retention policy: `docs/sin-rfp/phase-0/audit-retention-policy.md`
