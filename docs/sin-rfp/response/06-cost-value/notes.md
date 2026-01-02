# Context Notes - Cost and Value of Services

## RFP Prompts (viaSport SIN RFP)

- Provide an estimated project budget and pricing model with a breakdown of core elements.
- Include factors that affect timeline and pricing.
- Offer opportunity for in-kind services or value-add contributions.
- Cost and Value section must include:
  - Transparent pricing model.
  - Detailed estimation of cost breakdown (labor, software/licensing, hardware).
  - Factors that trigger cost adjustments and change management approach.
  - In-kind services, value-add contributions, and optional add-ons.
- Emphasize sustainable and scalable cost/maintenance model for the sector.

Sources: `docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md`

## Draft Notes for final.md (bullet points only)

### Pricing Model Overview

- Use template structure: implementation (one-time), subscription/managed service (recurring), usage-based components, optional add-ons.
- Frame pricing around phased delivery (Phase 0-4) and recurring operations/support.
- Note serverless + managed cloud stack enables usage-aligned costs (autoscaling).

Sources: `docs/sin-rfp/source/initial-template-rfp-response.md`, `docs/sin-rfp/phase-0/architecture-reference.md`, `docs/sin-rfp/phase-0/phased-delivery-plan.md`

### Cost Breakdown

- Table format: cost element, description/inclusions, one-time, recurring (monthly/annual).
- Labor buckets can align to phases and workstreams (architecture/docs, foundation, security, core SIN, analytics/export).
- Infrastructure/hosting line items tie to AWS services in architecture (RDS, S3, Lambda, SQS, EventBridge, SES, CloudWatch, CloudFront, GuardDuty).
- Known infra estimate for RDS: production ~$200-250/month (component estimate) and total RDS production ~$285/month in comparison table; dev/perf lower. Confirm whether these are client-facing.

Sources: `docs/sin-rfp/source/initial-template-rfp-response.md`, `docs/sin-rfp/phase-0/architecture-reference.md`, `docs/sin-rfp/requirements/tickets/INFRA-001-neon-to-rds-migration.md`, `docs/sin-rfp/phase-0/phased-delivery-plan.md`

### Factors Affecting Timeline and Price (Change Management)

- Data migration scope drivers: 20M+ row imports, data quality remediation, and document migration (synthetic estimates pending real exports).
- Schedule range (17-24 weeks) depends on phase scope and readiness of migration inputs.
- Scope expansion risks called out for optional operations portal features (membership/events/teams) and analytics add-ons.
- Include change management approach and change-order triggers (scope changes, data volume/quality, new integrations, additional environments).

Sources: `docs/sin-rfp/phase-0/migration-strategy.md`, `docs/sin-rfp/phase-0/phased-delivery-plan.md`, `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`, `docs/sin-rfp/source/initial-template-rfp-response.md`

### In-Kind or Value-Add Contributions (Optional Add-Ons)

- Optional add-ons candidates: scheduled alerts/reports, PDF/PNG dashboard exports, real-time streaming analytics (explicitly out of MVP scope in BI spec).
- Optional scope add-on: enable operations portal (membership/teams/events/payments) for viaSport tenant, framed as Phase 2 add-on.
- Capture any in-kind services once defined (training, data quality cleanup, migration rehearsal, etc.).

Sources: `docs/sin-rfp/decisions/SPEC-solstice-bi-platform-v2-addendum.md`, `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`

## Evidence Gaps to Fill (for final.md)

- Pricing worksheet/table and rate card.
- Confirmed hosting/infra cost model and what is included in base price.
- Defined in-kind contributions or discounting policy.
