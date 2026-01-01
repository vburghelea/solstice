# Solstice

[![CI](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/soleilheaney/solstice/branch/main/graph/badge.svg)](https://codecov.io/gh/soleilheaney/solstice)
[![Deploy Preview](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml)

## Overview

Solstice is a multi-tenant sports governance and reporting platform. The
primary program is viaSport BC's Strength in Numbers (SIN) initiative,
replacing BCAR and BCSI with a modern, compliant, Canada-hosted system. The
same codebase also powers Quadball Canada operations in a separate tenant.

## Strength in Numbers (SIN)

The SIN program focuses on sector-wide data collection, reporting, and analytics
for BC amateur sport organizations.

- Cloud-hosted SaaS platform with modular features
- Designed for 20M+ historical rows and ~1M rows/year growth
- Emphasis on privacy, auditability, and governance (PIPEDA/SOC2-aligned)

## RFP docs and status

The SIN RFP materials live in `docs/sin-rfp/`. Start with
`docs/sin-rfp/README.md` and use these as the canonical references:

- `docs/sin-rfp/requirements/SIN-REQUIREMENTS.md`
- `docs/sin-rfp/requirements/requirements-coverage-matrix.md`
- `docs/sin-rfp/requirements/SIN-IMPLEMENTATION-TECHNICAL-DEBT.md`
- `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`

## Platform capabilities (RFP-aligned)

- Data collection: form builder, file uploads, validation, submission tracking
- Reporting and analytics: cycles, tasks, dashboards, exports, review workflows
- Migration and imports: mapping templates, batch imports, rollback + audit logs
- Security and compliance: MFA, RBAC, audit trail, retention + DSAR workflows
- Training and support: templates hub, tutorials, help center, support requests
- User experience: role-based dashboards, notifications, search + filtering

## Tech stack

- TanStack Start + React for full-stack app and routing
- Better Auth for auth and MFA workflows
- Drizzle ORM + PostgreSQL
- Tailwind CSS v4 + shadcn/ui
- Vite 7 for build tooling
- SST on AWS (Lambda + CloudFront + RDS + S3 + SQS + SES)

## Architecture and data residency

Solstice runs in AWS ca-central-1 with Canada-only data residency for SIN.
Reference architecture and compliance docs:

- `docs/sin-rfp/phase-0/architecture-reference.md`
- `docs/sin-rfp/phase-0/data-residency.md`
- `docs/sin-rfp/phase-0/security-controls.md`
- `docs/sin-rfp/phase-0/backup-dr-plan.md`
- `docs/sin-rfp/phase-0/audit-retention-policy.md`

Tenant selection is enforced via `TENANT_KEY` and `VITE_TENANT_KEY`. They must
match (`qc` or `viasport`) to prevent cross-tenant access.

## Repository map

- `src/features/` - domain modules (forms, reporting, imports, analytics, audit)
- `src/routes/` - thin route files and API endpoints
- `src/lib/` - auth, security, notifications, privacy, shared services
- `src/db/` - Drizzle schemas and migrations
- `docs/sin-rfp/` - SIN RFP sources, requirements, decisions, evidence

## Local development

Requirements:

- Node.js >= 24.12.0
- pnpm >= 10.26.1
- PostgreSQL (local or remote)

Setup:

1. `pnpm install`
2. `cp .env.example .env` and fill values
3. `pnpm auth:generate` (if auth schema is missing)
4. `pnpm db push` (local database only)
5. `pnpm dev`

Optional SIN env (uploads + notifications):

- `SIN_ARTIFACTS_BUCKET`
- `SIN_NOTIFICATIONS_QUEUE_URL`
- `SIN_NOTIFICATIONS_FROM_EMAIL`
- `SIN_NOTIFICATIONS_REPLY_TO_EMAIL`

## SIN dev against AWS (optional)

- `npx sst dev --stage sin-dev`
- `npx sst dev --stage qc-dev`

See `docs/database-connections.md` for tunnel and RDS access.

## Common commands

- `pnpm dev` - local dev server
- `pnpm build` - production build
- `pnpm start` - serve production output
- `pnpm lint` - oxlint
- `pnpm check-types` - TypeScript type check
- `pnpm test` - unit tests (Vitest)
- `pnpm test:e2e` - Playwright E2E suite
- `pnpm docs:all` - generate reference docs + ERDs

## Deployment (SST)

- `AWS_PROFILE=techprod npx sst deploy --stage sin-prod`
- `AWS_PROFILE=techprod npx sst deploy --stage qc-prod`

See `docs/sin-rfp/archive/completed/sst-migration-plan.md` for deployment
details and secrets configuration.

## More documentation

- `docs/README.md`
- `docs/TANSTACK-START-2025-UPDATES.md`
- `docs/E2E-BEST-PRACTICES.md`
- `docs/rate-limiting-with-pacer.md`
