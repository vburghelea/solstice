# System Requirements: Security (SEC-AGG)

## Compliance Summary

| Req ID      | Title                           | Status | Implementation                                        |
| ----------- | ------------------------------- | ------ | ----------------------------------------------------- |
| SEC-AGG-001 | Authentication & Access Control | Comply | MFA, RBAC, step-up auth, org-scoped permissions       |
| SEC-AGG-002 | Monitoring & Threat Detection   | Comply | Anomaly detection, automatic account lock, alerting   |
| SEC-AGG-003 | Privacy & Regulatory Compliance | Comply | Canadian data residency, encryption, PIPEDA alignment |
| SEC-AGG-004 | Audit Trail & Data Lineage      | Comply | Immutable audit log with tamper-evident hash chain    |

## SEC-AGG-001: Authentication & Access Control

**Requirement:** The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Implementation:**

| Capability                  | Description                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Multi-Factor Authentication | TOTP-based MFA with authenticator app support; backup codes for recovery                   |
| Password Requirements       | Minimum 8 characters; complexity requirements enforced                                     |
| Password Recovery           | Secure email-based reset flow with time-limited tokens                                     |
| Role-Based Access           | Predefined roles (owner, admin, reporter, viewer) with granular permissions                |
| Organization Scoping        | Users are affiliated with organizations; access automatically scoped to their organization |
| User Admission              | Organization owners and admins can invite users, approve join requests, and revoke access  |
| Step-Up Authentication      | Sensitive operations (admin actions, bulk exports) require re-authentication               |

**Evidence:** MFA flow tested in E2E tests; role-based access verified via property-based tests.

## SEC-AGG-002: Monitoring & Threat Detection

**Requirement:** The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Implementation:**

| Capability              | Description                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Login Anomaly Detection | Failed login attempts tracked; patterns analyzed for brute force attempts                 |
| Account Lockout         | Automatic temporary lock after configurable failed attempt threshold                      |
| Behavioral Monitoring   | Unusual access patterns (time of day, location changes, rapid actions) flagged for review |
| Security Alerts         | Administrators notified of security events via email and in-app notifications             |
| AWS GuardDuty           | Infrastructure-level threat detection for network and API anomalies                       |

**Evidence:** Anomaly detection implemented in `src/lib/security/detection.ts`; account lock triggers tested.

## SEC-AGG-003: Privacy & Regulatory Compliance

**Requirement:** The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Implementation:**

| Capability              | Description                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Canadian Data Residency | All data hosted exclusively in AWS ca-central-1 (Montreal); no data leaves Canadian jurisdiction |
| Encryption at Rest      | AES-256 encryption via AWS KMS for database and S3 storage                                       |
| Encryption in Transit   | TLS 1.2+ for all client-server and inter-service communication                                   |
| Access Controls         | Role-based and field-level access controls restrict PII visibility                               |
| Data Minimization       | Configurable retention policies; automated purging of data past retention period                 |
| Right to Access         | User data export functionality available for data subject requests                               |
| Secrets Management      | Application secrets stored in AWS Secrets Manager with rotation capability                       |

**Sub-Processors:**

| Service              | Provider | Purpose                   | Data Residency        |
| -------------------- | -------- | ------------------------- | --------------------- |
| Cloud Infrastructure | AWS      | Hosting, compute, storage | Canada (ca-central-1) |
| Email Delivery       | AWS SES  | Transactional emails      | Canada (ca-central-1) |

AWS maintains a Data Processing Addendum (DPA) covering all services including SES for email delivery: https://d1.awsstatic.com/legal/aws-dpa/aws-dpa.pdf

**Evidence:** Data residency documented; encryption verified via AWS console.

## SEC-AGG-004: Audit Trail & Data Lineage

**Requirement:** The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Implementation:**

| Capability                | Description                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Comprehensive Logging     | All user actions, data changes, authentication events, and admin configurations logged       |
| Immutability              | Audit logs stored in append-only fashion; no modification or deletion permitted              |
| Tamper-Evident Hash Chain | Each log entry includes a hash of the previous entry; tampering is detectable                |
| User Attribution          | Every log entry includes user ID, timestamp, IP address, and action details                  |
| Data Lineage              | Changes to records include before/after values; full history traceable                       |
| Filtering and Export      | Administrators can filter logs by user, record ID, action type, or date range; export to CSV |
| Retention                 | Logs retained for 7 years; archived to S3 Glacier Deep Archive after 90 days                 |

**Evidence:** Hash chain verification implemented in `src/lib/audit/__tests__/audit-utils.test.ts`; audit UI functional in prototype.
