# SIN Audit and Retention Policy

## Document Control

| Item     | Value                       |
| -------- | --------------------------- |
| Document | Audit and Retention Policy  |
| Audience | viaSport BC Evaluation Team |
| Version  | 1.0                         |
| Scope    | Production SIN platform     |

## 1.0 Purpose

This policy defines what is logged in the SIN platform, how audit data is
protected, and how long records are retained. It supports SEC-AGG-004 and
PIPEDA-aligned accountability requirements.

## 2.0 Audit Log Scope

| Action Type | Examples                 | Data Captured          | PII Handling    |
| ----------- | ------------------------ | ---------------------- | --------------- |
| AUTH.\*     | login, logout, MFA       | metadata only          | no secrets      |
| ADMIN.\*    | role changes, org config | before/after diff      | redacted/hashes |
| DATA.\*     | create/update/delete     | field-level diff       | redacted/hashes |
| EXPORT.\*   | report exports           | parameters + row count | no PII payload  |
| SECURITY.\* | lockouts, anomalies      | context metadata       | no secrets      |

Audit logs are append-only and protected with tamper-evident hashing.

## 3.0 PII Redaction and Hashing Rules

- Sensitive fields are hashed (DOB, phone, emergency contact)
- Secrets and tokens are fully redacted
- Only diffs are stored for data changes, not full snapshots

## 4.0 Retention Schedule

| Data Type        | Retention | Storage       | Notes             |
| ---------------- | --------- | ------------- | ----------------- |
| Audit logs       | 7 years   | RDS + Glacier | Immutable archive |
| Security events  | 2 years   | RDS           | Configurable      |
| Export history   | 7 years   | RDS           | Links to audit    |
| Application logs | 1 year    | CloudWatch    | PII minimized     |
| Backups          | 35 days   | RDS snapshots | PITR enabled      |

Retention periods can be adjusted with viaSport approval.

## 5.0 Archive and Purge Procedures

- Audit logs older than active retention window are archived to S3 Glacier
  with Object Lock enabled.
- Purges are executed only after retention expires and are recorded in the
  audit log.

## 6.0 Legal Hold

- Legal holds can be applied at the record, user, or organization level.
- Held records are exempt from purge until the hold is released.

## 7.0 Access Control and Export

- Audit access is limited to authorized viaSport administrators.
- Audit exports are logged and require step-up authentication.

## 8.0 References

- `docs/sin-rfp/phase-0/security-controls.md`
- `docs/sin-rfp/SIN-REQUIREMENTS.md`
