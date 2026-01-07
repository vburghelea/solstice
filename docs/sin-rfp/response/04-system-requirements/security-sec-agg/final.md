# System Requirements: Security (SEC-AGG)

## Shared Responsibility Model

See Section 1.2 for the shared responsibility summary and AWS Artifact
references.

## Compliance Summary

| Req ID      | Title                             | Status | Built Today                                                               | Remaining Scope                       |
| ----------- | --------------------------------- | ------ | ------------------------------------------------------------------------- | ------------------------------------- |
| SEC-AGG-001 | Authentication and Access Control | Built  | MFA, RBAC, org scoping, user admission                                    | None                                  |
| SEC-AGG-002 | Monitoring and Threat Detection   | Built  | Rate limiting, pre-auth lockout, CloudTrail CIS alarms, CloudWatch alerts | None                                  |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Built  | Encryption, Canadian hosting, retention controls                          | Compliance package and pen test (TBD) |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Built  | Immutable audit log with hash chain                                       | None                                  |

## SEC-AGG-001: Authentication and Access Control

**Requirement:**

> The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Acceptance Criteria:**

> Users log in securely; only authorized individuals gain access based on role and affiliation.

**How We Meet It:**

- MFA with TOTP and backup codes is supported.
- Password reset uses time-limited email tokens.
- Password complexity enforced on signup and reset (uppercase, lowercase, number, symbol).
- RBAC and organization scoping are enforced in the API layer.
- Organization owners and admins manage invites and join requests.

**Built Today:**

- MFA enrollment and recovery flows.
- Server-side password policy enforcement (validated: weak passwords blocked with inline errors).
- Role-based permissions and org membership enforcement.
- User invitation and join request workflows.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to validate flows during UAT. See **Service Approach: Testing and Quality Assurance**.

**Evidence:**
Evidence is summarized in Section 1.2.

## SEC-AGG-002: Monitoring and Threat Detection

**Requirement:**

> The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:**

> Security anomalies are flagged, logged, and result in appropriate account safeguards.

**How We Meet It:**

- Heuristic threat detection uses configurable thresholds to flag suspicious patterns.
- CloudFront edge security provides DDoS protection, security headers, and
  AWS WAF managed rules with rate limiting.
- Failed logins trigger account flagging and lockouts.
- Rate limiting protects authentication and API endpoints.
- CloudTrail with CIS Benchmark alarms detects infrastructure-level anomalies.
- Admins receive security alerts for flagged activity.

**Built Today:**

- Pre-auth lockout gating blocks sign-in for locked users before authentication.
- Rate limiting with Redis-backed sliding window algorithm (5 requests/15 min for auth, in-memory fallback).
- Login failure thresholds: 5 failures in 15 minutes triggers 30-minute account lockout.
- AWS WAF WebACL deployed on CloudFront with managed rules (CRS, SQLi, Known Bad
  Inputs) and edge rate limiting.
- Security event logging to `security_events` table with CloudWatch metrics.
- CloudTrail audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes, VPC changes, unauthorized API calls).
- CloudWatch alarms for anomalous request patterns and error rate spikes.
- Admin notifications for login anomalies and account lockouts.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Security rules are tuned with viaSport and validated in UAT.

**Evidence:**
Evidence is summarized in Section 1.2.

## SEC-AGG-003: Privacy and Regulatory Compliance

**Requirement:**

> The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:**

> All sensitive data is encrypted and stored securely.

**How We Meet It:**

- Data residency and privacy assumptions follow Section 1.1.
- Role-based and field-level access controls protect PII.
- Retention policies and legal holds support data minimization.

**Built Today:**

- Canadian hosting region (ca-central-1) for all primary data stores (see
  Section 1.1).
- AES-256 encryption via KMS for RDS and S3.
- Retention enforcement and legal hold tooling.
- CloudTrail API audit logging with CIS Benchmark alarms (root usage, IAM changes, security group changes).

**Remaining Scope:**

- Final compliance package and penetration test prior to submission (TBD).

**Approach:**
Provide compliance artifacts and independent test results as noted in Section
1.4 prior to submission.

**Evidence:**
Evidence is summarized in Section 1.2.

## SEC-AGG-004: Audit Trail and Data Lineage

**Requirement:**

> The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Acceptance Criteria:**

> Auditors can filter logs by user or record ID and export results; tamper-evident hashing verifies integrity of log entries.

**How We Meet It:**

- Audit log records user actions, auth events, and admin changes.
- Hash chain verification detects tampering.
- Admins can filter and export logs.

**Built Today:**

- Append-only audit log with hash chain verification.
- Export and filter UI for audit logs.
- Audit log archives stored in S3 Deep Archive.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Continue to validate audit integrity during UAT and provide evidence as noted
in Section 1.2.

**Evidence:**
Evidence is summarized in Section 1.2.
