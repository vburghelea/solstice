# Context Notes - Vendor Fit to viaSport's Needs

## RFP prompts (source)

- Provide incorporation date, company size (number of staff), location, and
  organization structure relevant to this RFP.
  (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Provide a proposed solution statement summarizing key differentiators and
  benefits to viaSport.
  (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Template expects Company Information, Proposed Solution Statement, Sector
  Context and Alignment.
  (docs/sin-rfp/source/initial-template-rfp-response.md)

## Company information (current repo evidence)

- Solstice is described as a personal project exploring a modern information
  management platform for leagues and events. (README.md)
- Platform built for Quadball Canada, covering memberships, teams, events, and
  admin operations. (docs/PROJECT-AUDIT-SUMMARY.md)
- Multi-tenant configuration includes viaSport and Quadball Canada branding and
  feature flags. (src/tenant/tenants/viasport.ts, src/tenant/tenants/qc.ts)

## Proposed solution statement (candidate points)

- Unified data model for reporting and operations; multi-tenant isolation with
  RBAC; serverless autoscaling; audit-first design; modular features.
  (README.md)
- Core information management capabilities: dynamic forms, reporting cycles,
  review workflows, self-service analytics, bulk imports with mapping and
  rollback, data quality checks. (README.md)
- SIN architecture targets AWS ca-central-1 with Lambda app tier, RDS
  PostgreSQL, S3, SQS, EventBridge, SES, and CloudWatch/CloudTrail/GuardDuty.
  (docs/sin-rfp/phase-0/architecture-reference.md)
- Security controls: MFA, session policy, org-based access control, encryption
  in transit/at rest, audit logs with tamper-evident hashing.
  (docs/sin-rfp/phase-0/security-controls.md,
  docs/sin-rfp/phase-0/audit-retention-policy.md)
- Data residency: production data stored/processed in Canada (ca-central-1),
  sub-processor inventory documented. (docs/sin-rfp/phase-0/data-residency.md)
- Legacy migration approach for BCAR/BCSI data volumes (20M+ rows) with mapping
  templates, validation, and rollback.
  (docs/sin-rfp/phase-0/migration-strategy.md,
  docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- viaSport tenant enables SIN-specific modules (reporting, forms, imports,
  analytics, templates, help center, support, data quality).
  (src/tenant/tenants/viasport.ts)

## Sector context and alignment (BC amateur sport)

- viaSport context: BC not-for-profit, 15+ years of sector data, replacing
  BCAR/BCSI to improve reporting, analytics, compliance, and sector evaluation.
  (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Data scale: 20M+ historical rows, +1M/year, hundreds of documents per year.
  (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md,
  docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Personas: viaSport admin oversees PSOs and reporting cycles; PSO admins collect
  club submissions; club admins are volunteer/low-tech context.
  (docs/sin-rfp/requirements/user-stories-and-flows.md)
- Org hierarchy matches sector structure (governing body -> PSO -> league/club/
  affiliate). (src/tenant/tenants/viasport.ts,
  docs/sin-rfp/phase-0/migration-strategy.md)
- Training and support expectations align with help center, templates,
  walkthroughs, and support modules in the viaSport tenant.
  (src/tenant/tenants/viasport.ts,
  docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Dual-portal considerations note optional operations modules as a Phase 2 to
  avoid scope creep while improving data completeness for PSOs.
  (docs/sin-rfp/requirements/sin-dual-portal-considerations.md)
