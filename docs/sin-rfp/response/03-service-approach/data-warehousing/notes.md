# Context Notes - Service Approach - Data Warehousing

## RFP Prompts

- Hosting solution, tenancy model, data residency alignment.
- Backup, recovery, and encryption standards.

## Evidence Targets

- Data residency statement and region selection.
- Backup and DR procedures.
- Encryption and key management notes.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/phase-0/architecture-reference.md
- docs/sin-rfp/phase-0/data-residency.md
- docs/sin-rfp/phase-0/backup-dr-plan.md
- docs/sin-rfp/phase-0/security-controls.md
- docs/sin-rfp/phase-0/audit-retention-policy.md
- docs/sin-rfp/phase-0/data-classification-guide.md
- docs/sin-rfp/review-plans/backup-restore-test-results.md
- docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-dev-20251230.md
- docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md
- src/features/bi/docs/SPEC-bi-platform.md

## Context Highlights (source-backed)

- Architecture targets AWS ca-central-1 with CloudFront, Lambda, RDS Postgres,
  S3, SQS, SES, and centralized monitoring. (docs/sin-rfp/phase-0/architecture-reference.md)
- Data residency statement confirms all production data remains in Canada
  (ca-central-1) with explicit sub-processor inventory. (docs/sin-rfp/phase-0/data-residency.md)
- Security controls include TLS 1.2+, KMS-backed encryption at rest, Secrets
  Manager, audit logging, and GuardDuty monitoring. (docs/sin-rfp/phase-0/security-controls.md)
- Backup/DR targets: RPO 1 hour, RTO 4 hours, 35-day backups, 7-year audit log
  retention, quarterly restore tests. (docs/sin-rfp/phase-0/backup-dr-plan.md)
- Audit retention policy defines append-only audit log, tamper-evident hashing,
  and legal hold support with 7-year retention. (docs/sin-rfp/phase-0/audit-retention-policy.md)
- Data classification guide defines PII/Sensitive PII handling and storage rules
  aligned with PIPEDA. (docs/sin-rfp/phase-0/data-classification-guide.md)
- DR restore drill evidence and encryption status checks are documented for
  sin-dev. (docs/sin-rfp/review-plans/backup-restore-test-results.md,
  docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md)
- Analytics data layer uses curated views in Postgres with a native BI semantic
  layer for reporting and exports. (src/features/bi/docs/SPEC-bi-platform.md)

## Draft Bullets for final.md (notes only)

### Hosting, Tenancy, Data Residency, Regulatory Alignment

- AWS ca-central-1 hosting for all production data; single-region deployment to
  meet Canadian residency and PIPEDA expectations. (docs/sin-rfp/phase-0/data-residency.md)
- Multi-tenant architecture with tenant-aware configuration and org-scoped
  access controls; audit logging for data access. (docs/sin-rfp/phase-0/architecture-reference.md)
- Primary data store is RDS PostgreSQL with S3 for documents/import artifacts;
  analytics uses curated Postgres views within the same residency boundary.
  (docs/sin-rfp/phase-0/architecture-reference.md, src/features/bi/docs/SPEC-bi-platform.md)
- Data classification guidance defines handling for PII/Sensitive PII with
  residency and access restrictions. (docs/sin-rfp/phase-0/data-classification-guide.md)

### Backup, Recovery, and Encryption Standards

- RDS automated backups + PITR, 35-day retention, Multi-AZ failover for
  production; quarterly restore drills. (docs/sin-rfp/phase-0/backup-dr-plan.md)
- S3 versioning, lifecycle archiving to Glacier, and Object Lock for immutability
  where required. (docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md)
- Encryption in transit (TLS 1.2+) and at rest (KMS for RDS/S3); secrets stored
  in AWS Secrets Manager. (docs/sin-rfp/phase-0/security-controls.md)
- Audit logs retained for 7 years with tamper-evident hash chain; legal hold
  prevents premature purge. (docs/sin-rfp/phase-0/audit-retention-policy.md)
