# Context Notes - Executive Summary

## RFP Prompts

- Executive summary, <= 3 pages.
- Summarize the solution and what it replaces (BCAR/BCSI).
- Highlight outcomes for reporting, analytics, governance, UX.
- State differentiators and why this approach is durable.
- Provide a high-level approach, timeline, and budget summary.

## Evidence Targets

- High-level architecture or platform diagram (appendix).
- Key metrics or outcomes from similar implementations.
- Summary of scope and delivery phases.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt

## Context Highlights (source-backed)

- viaSport needs a modern, secure, scalable managed platform to replace BCAR/BCSI
  and improve reporting, analytics, governance, and UX. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Data context: 20M+ historical rows, ~1M/year growth, plus documents in S3-scale
  volumes. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- SIN requirements emphasize customizable forms, reporting workflows, self-service
  analytics/export, MFA + audit trail, and training/support resources. (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Architecture targets AWS ca-central-1 with serverless app tier, RDS Postgres,
  S3, SQS, SES, and centralized logging/monitoring. (docs/sin-rfp/phase-0/architecture-reference.md)
- Data residency is Canada-only with explicit sub-processor list and approvals
  for optional processors. (docs/sin-rfp/phase-0/data-residency.md)
- Security posture includes MFA, session policy, audit logging, encryption, and
  anomaly detection/lockouts. (docs/sin-rfp/phase-0/security-controls.md)
- Backup/DR targets RPO 1h, RTO 4h, 35-day backups, 7-year audit retention, and
  quarterly DR tests. (docs/sin-rfp/phase-0/backup-dr-plan.md)
- Audit retention policy includes append-only audit log, tamper-evident hashing,
  and 7-year retention with legal hold support. (docs/sin-rfp/phase-0/audit-retention-policy.md)
- Migration strategy covers BCAR/BCSI mapping, batch imports with checkpoints,
  and rollback; placeholders are synthetic until real exports are available.
  (docs/sin-rfp/phase-0/migration-strategy.md)
- Requirements coverage status is tracked; several areas are implemented, many
  are partial or planned. (docs/sin-rfp/requirements/requirements-coverage-matrix.md)
- Requirements verification report shows 25/25 addressed, mostly partial due to
  missing seeded data and pending production evidence. (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Phased delivery plan estimates 17-24 weeks across phases 0-4. (docs/sin-rfp/phase-0/phased-delivery-plan.md)

## Draft Bullets for final.md (notes only)

### Proposed Solution Overview

- Cloud-hosted, modular SIN platform replacing BCAR/BCSI and supporting viaSport
  reporting + data governance goals. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Architecture: AWS ca-central-1, serverless app tier, RDS Postgres, S3 for
  documents/imports, SQS/SES for async notifications. (docs/sin-rfp/phase-0/architecture-reference.md)
- Designed for 20M+ historical rows with ongoing growth and large file
  attachments. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Core capability areas align to SIN requirements: forms + reporting workflows,
  imports, analytics/export, governance, security, training/support.
  (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)

### Outcomes and Value to viaSport and the Sector

- Reporting workflows: submission tracking, reminders, dashboards, and exportable
  outputs for compliance/reporting needs. (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Self-service analytics + export capability with field-level access controls.
  (docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md)
- Governance + compliance: role-based access, audit trail, retention and data
  residency controls aligned to PIPEDA expectations. (docs/sin-rfp/phase-0/security-controls.md)
- UX + onboarding: templates, tutorials, help center, and role-based portal
  design for PSOs and viaSport staff. (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)

### Key Differentiators

- Canada-only data residency with explicit sub-processor inventory and approval
  gates for optional processors. (docs/sin-rfp/phase-0/data-residency.md)
- Governance-first analytics strategy (native BI to preserve tenancy, ACL, audit
  controls). (docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md)
- Immutable audit logging with tamper-evident hash chain and 7-year retention.
  (docs/sin-rfp/phase-0/audit-retention-policy.md)
- Security depth: MFA, session policy, anomaly detection, and lockouts. (docs/sin-rfp/phase-0/security-controls.md)
- Documented migration strategy for BCAR/BCSI data with rollback + audit trails.
  (docs/sin-rfp/phase-0/migration-strategy.md)

### Proposed Approach and Timeline (high level)

- Phase 0: Architecture + compliance documentation (1-2 weeks).
- Phase 1: Foundation (org tenancy, audit logging, notifications) (4-6 weeks).
- Phase 2: Security (MFA, monitoring, privacy/DSAR) (3-4 weeks).
- Phase 3: Core SIN features (forms, imports, reporting workflows) (6-8 weeks).
- Phase 4: Analytics + export (3-4 weeks).
  Total estimate: 17-24 weeks. (docs/sin-rfp/phase-0/phased-delivery-plan.md)

### Budget Summary (high level)

- Pricing model, cost breakdown, and recurring support pricing not yet in repo.
