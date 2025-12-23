# SIN Security Controls Overview

## Document Control

| Item     | Value                       |
| -------- | --------------------------- |
| Document | Security Controls Overview  |
| Audience | viaSport BC Evaluation Team |
| Version  | 1.0                         |
| Scope    | Production SIN platform     |

## 1.0 Overview

The SIN platform will implement layered security controls covering identity,
authorization, data protection, monitoring, and incident response. Controls are
aligned to SEC-AGG-001 through SEC-AGG-004 and are designed for PIPEDA and
SOC 2/ISO 27001-aligned practices.

## 2.0 Identity and Access Management

Authentication:

- Email/password authentication with strong password policy
- Optional OAuth (Google) with consent-based enablement
- MFA (TOTP + backup codes) required for admins and optional for all users
- Secure account recovery with verified email and step-up controls

Session management:

- Max session age: 8 hours (admin: 4 hours)
- Idle timeout: 30 minutes
- Step-up authentication for sensitive actions (exports, role changes, DSAR)

## 3.0 Authorization and Tenancy

- Organization-based tenancy with scoped roles and delegated access
- Least-privilege enforcement at API and data layers
- Default deny posture for cross-organization access
- Field-level access policies for sensitive data

## 4.0 Data Protection

- TLS 1.2+ in transit, TLS 1.3 where supported
- KMS-backed encryption at rest for RDS and S3
- Secrets stored in AWS Secrets Manager
- PII redaction and hashing for audit trails

## 5.0 Logging and Monitoring

- Append-only audit log with tamper-evident hashing
- Security event logging for authentication and admin actions
- Centralized logs and metrics in CloudWatch
- AWS CloudTrail for platform-level auditability

## 6.0 Threat Detection and Response

- Rate limiting and anomaly detection rules
- Account lockout thresholds for repeated failures
- GuardDuty alerts for suspicious infrastructure events
- Admin alerting for security incidents and lockouts

## 7.0 Secure SDLC and Operational Controls

- Infrastructure-as-code with SST for traceable deployments
- Dependency and vulnerability monitoring
- Segregated environments with controlled promotion
- Access restricted via IAM least-privilege roles

## 8.0 Incident Response (Outline)

1. Detection and triage (monitoring alerts, audit review)
2. Containment (account lock, access revocation)
3. Eradication (patch, credential rotation)
4. Recovery (restore services, validate integrity)
5. Communication (notify viaSport per policy)
6. Post-incident review and corrective actions

## 9.0 Requirements Mapping

| SIN Requirement | Control Alignment                   | Evidence/Deliverable           |
| --------------- | ----------------------------------- | ------------------------------ |
| SEC-AGG-001     | MFA, session policy, org-based RBAC | MFA workflows, RBAC guardrails |
| SEC-AGG-002     | Security events, lockouts, alerts   | Security event log + rules     |
| SEC-AGG-003     | Encryption, consent, retention      | KMS, TLS, privacy workflows    |
| SEC-AGG-004     | Immutable audit log, export         | Audit log UI + CSV export      |

## 10.0 References

- `docs/sin-rfp/SIN-REQUIREMENTS.md`
- `docs/sin-rfp/hosting-compliance.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`
