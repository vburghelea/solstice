# Data Classification Guide

This guide defines how viaSport SIN data is classified, handled, and protected.
It aligns with PIPEDA requirements and the SIN RFP expectations.

## Classification Levels

### 1) Sensitive PII

Data that could cause harm or identity theft if exposed.

Examples:

- Date of birth
- Emergency contact details
- Government identifiers (if collected in future)
- Auth secrets, MFA secrets, backup codes

Handling:

- Encrypt at rest (KMS) and in transit (TLS 1.3)
- Redact or hash in audit logs
- Restrict exports to approved roles only
- Store in Canada (AWS ca-central-1)

### 2) PII

Personally identifying data that is not as high risk as Sensitive PII.

Examples:

- Name
- Email address
- Phone number
- Mailing address

Handling:

- Encrypt at rest and in transit
- Mask/redact in exports for non-admin roles
- Audit all access and export events
- Store in Canada (AWS ca-central-1)

### 3) Operational Data

Non-PII data required to operate the system.

Examples:

- Organization metadata
- Reporting cycle metadata
- Audit event metadata without PII
- App configuration

Handling:

- Standard encryption at rest and in transit
- Lower sensitivity in exports, still audit logged

### 4) Public Data

Data intended for public display.

Examples:

- Public organization names (if explicitly published)
- Public reporting summaries (if approved)

Handling:

- Allowed in public views with explicit approval
- Still tracked in audit logs for publishing actions

## Data Handling Rules

- **Audit logs**: store diffs, hash sensitive fields, redact secrets.
- **Exports**: apply field-level access rules for PII/Sensitive PII.
- **Email**: avoid sending PII beyond first name + org name + summary.
- **Storage**: all data stored in AWS ca-central-1.

## Ownership and Access

- Data owners: viaSport governing body and delegated PSO admins.
- Access is scoped by organization membership and role.
- Admin actions require MFA when configured.

## Review Cadence

- Review classification annually or after major data model changes.
- Update this guide when new data types are introduced.
