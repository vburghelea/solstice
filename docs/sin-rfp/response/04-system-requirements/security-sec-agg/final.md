# System Requirements: Security (SEC-AGG)

## Compliance Summary

| Req ID      | Title                             | Status | Built Today                                         | Remaining Scope                       |
| ----------- | --------------------------------- | ------ | --------------------------------------------------- | ------------------------------------- |
| SEC-AGG-001 | Authentication and Access Control | Built  | MFA, RBAC, org scoping, user admission              | None                                  |
| SEC-AGG-002 | Monitoring and Threat Detection   | Built  | Redis rate limiting, pre-auth lockout, admin alerts | None                                  |
| SEC-AGG-003 | Privacy and Regulatory Compliance | Built  | Encryption, residency, retention controls           | Compliance package and pen test (TBD) |
| SEC-AGG-004 | Audit Trail and Data Lineage      | Built  | Immutable audit log with hash chain                 | None                                  |

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
Continue to validate flows during UAT. See Section 03 Testing and QA.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-login-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-mfa-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SEC-AGG-001-roles-20251228-1953.png`

## SEC-AGG-002: Monitoring and Threat Detection

**Requirement:**

> The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:**

> Security anomalies are flagged, logged, and result in appropriate account safeguards.

**How We Meet It:**

- Security events are recorded with risk scores and thresholds.
- Failed logins trigger account flagging and lockouts.
- Admins receive security alerts for anomalous behavior.
- Rate limiting protects authentication and API endpoints.

**Built Today:**

- Pre-auth lockout gating blocks sign-in for locked users before authentication.
- Rate limiting with Redis-backed sliding window algorithm (5 requests/15 min for auth, in-memory fallback).
- Login failure thresholds: 5 failures in 15 minutes triggers 30-minute account lockout.
- Security event logging to `security_events` table with CloudWatch metrics.
- Admin notifications for login anomalies and account lockouts.

**Remaining Scope:**

- None. Fully implemented.

**Approach:**
Security rules are tuned with viaSport and validated in UAT.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-002-security-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/SECURITY-LOCKOUT-sin-dev-20251231.md`

## SEC-AGG-003: Privacy and Regulatory Compliance

**Requirement:**

> The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:**

> All sensitive data is encrypted and stored securely.

**How We Meet It:**

- Data is hosted in Canada with encryption in transit and at rest.
- Role-based and field-level access controls protect PII.
- Retention policies and legal holds support data minimization.

**Built Today:**

- Canadian data residency (ca-central-1).
- AES-256 encryption via KMS for RDS and S3.
- Retention enforcement and legal hold tooling.

**Remaining Scope:**

- Final compliance package and penetration test prior to submission (TBD).

**Approach:**
Provide compliance artifacts and independent test results in Appendix D prior to submission.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-003-privacy-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md`
- `docs/sin-rfp/review-plans/evidence/2025-12-29-privacy-retention-legal-hold.png`

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
Continue to validate audit integrity during UAT and provide evidence in Appendix D.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/SEC-AGG-004-audit-20251228-1953.png`
- `src/lib/audit/__tests__/audit-hash-chain.pbt.test.ts`
