# Context Notes - Service Approach - Platform Design and Customization

## RFP Prompts

- Cloud provider services and rationale.
- Development, testing, production process and controls.

## Evidence Targets

- Architecture diagram with services.
- CI/CD or release management notes.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/phase-0/architecture-reference.md
- docs/sin-rfp/phase-0/security-controls.md
- docs/sin-rfp/phase-0/data-residency.md
- docs/sin-rfp/phase-0/phased-delivery-plan.md
- README.md
- CLAUDE.md

## Context Highlights (source-backed)

- Reference architecture targets AWS ca-central-1 with CloudFront, Lambda,
  RDS Postgres, S3, SQS, EventBridge Scheduler, SES, CloudWatch, CloudTrail,
  and GuardDuty. (docs/sin-rfp/phase-0/architecture-reference.md)
- Tenant routing uses stage naming (`qc-dev`, `sin-dev`, `qc-perf`, `sin-perf`,
  `qc-prod`, `sin-prod`) and tenant feature flags to isolate environments.
  (docs/sin-rfp/phase-0/architecture-reference.md)
- Security controls include infrastructure-as-code with SST, least-privilege
  IAM, and segregated environments with controlled promotion. (docs/sin-rfp/phase-0/security-controls.md)
- AWS ca-central-1 is the mandated region for production residency. (docs/sin-rfp/phase-0/data-residency.md)
- Tech stack and deployment model: TanStack Start + React, Drizzle/Postgres,
  SST on AWS for Lambda/CloudFront/RDS/S3. (README.md)
- CI/CD and local workflows rely on pnpm scripts and staged environments
  (`sst dev`, `sst deploy`). (CLAUDE.md)

## Draft Bullets for final.md (notes only)

### Cloud Provider Services

- AWS ca-central-1 deployment with CloudFront CDN, Lambda app tier, RDS
  PostgreSQL, S3 object storage, SQS queues, EventBridge scheduling, SES email,
  and CloudWatch/CloudTrail/GuardDuty for ops + security. (docs/sin-rfp/phase-0/architecture-reference.md)
- Multi-tenant architecture with tenant-specific feature flags and scoped
  routing to prevent cross-tenant access. (docs/sin-rfp/phase-0/architecture-reference.md)
- Data residency and compliance aligned to PIPEDA with Canada-only storage.
  (docs/sin-rfp/phase-0/data-residency.md)

### Dev, Test, Prod Workflow

- Separate stages for dev/perf/prod per tenant (`sin-dev`, `sin-perf`, `sin-prod`,
  plus QC equivalents) to isolate testing and releases. (docs/sin-rfp/phase-0/architecture-reference.md)
- Infrastructure-as-code via SST with repeatable deploys; CI runs lint, type
  checks, and tests before promotion. (docs/sin-rfp/phase-0/security-controls.md,
  CLAUDE.md)
- Phased delivery plan sequences architecture, security, core features, and
  analytics to align with schedule expectations. (docs/sin-rfp/phase-0/phased-delivery-plan.md)
