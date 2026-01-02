# Context Notes - Capabilities and Experience

## RFP Prompts (source: docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)

- Demonstrated success and experience with information management systems.
- Identify partners or subcontractors, their responsibilities, oversight, and continuity.
- List services provided to non-profit, charity, amateur sport, or public clients.
- Provide case studies of comparable projects (prefer Canadian NPO/public).
- Describe how automation and/or AI improves data quality, analytics, and UX.
- If AI is used, describe responsible AI approach.
- Describe use of open standards, APIs, and open-source components.

## Evidence to pull into the draft

- Product capabilities overview: README.md (core capabilities + architecture).
- Implemented modules and automation: CODE_GUIDE.md (forms, imports, reporting, analytics, audit, notifications, retention, security, jobs).
- Verification evidence: docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md
  (UI evidence paths under docs/sin-rfp/review-plans/evidence/).
- SIN platform architecture/tenancy: docs/sin-rfp/phase-0/architecture-reference.md.
- Security/audit/retention automation: docs/sin-rfp/phase-0/security-controls.md,
  docs/sin-rfp/phase-0/audit-retention-policy.md.
- Quadball Canada platform context: docs/quadball-plan/index.md.
- Automation/analytics delivery notes: docs/sin-rfp/worklogs/master.md.
- AI considered but not selected (analytics): docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md.

## Draft bullets for final.md (outline only)

### Demonstrated Success Delivering Similar Systems

- Solstice is a full-stack information management + sport operations platform
  with forms, reporting, analytics, imports, audit, notifications, membership,
  teams, events, payments, and privacy workflows. Evidence: README.md,
  CODE_GUIDE.md.
- Multi-tenant deployment model supports separate QC and viaSport distribution
  paths with tenant-aware routing and feature gating. Evidence:
  docs/sin-rfp/phase-0/architecture-reference.md, src/tenant/tenants/qc.ts,
  src/tenant/tenants/viasport.ts.
- SIN modules (forms, imports, reporting, analytics, audit, privacy, security)
  were verified in sin-dev with captured evidence. Evidence:
  docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md.

### Partners or Subcontractors (if any)

- No partners/subcontractors named in repo; assume none unless provided.

### Relevant Non-Profit, Public Sector, or Sport Clients

- Quadball Canada platform built on the same stack and feature set. Evidence:
  docs/quadball-plan/index.md.
- viaSport SIN implementation underway (current platform environment). Evidence:
  docs/sin-rfp/phase-0/architecture-reference.md,
  docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md.

### Case Studies

- Case Study 1 (Quadball Canada): league management platform with membership,
  teams, events, payments, and reporting modules. Evidence:
  docs/quadball-plan/index.md, README.md.
- Case Study 2 (viaSport SIN build): information management modules (forms,
  reporting workflows, imports, analytics, audit, privacy) with verified UI
  evidence. Evidence: docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md.

### Automation and AI

- Automation already supports bulk imports, mapping templates, validation,
  rollback, scheduled notifications, audit logging, and retention enforcement.
  Evidence: README.md, CODE_GUIDE.md, docs/sin-rfp/worklogs/master.md.
- Analytics automation includes exports (CSV/XLSX) and pivot/chart builder
  delivery. Evidence: docs/sin-rfp/worklogs/master.md.
- AI features are not implemented; AI-to-SQL was considered but not pursued.
  Evidence: docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md.

### Responsible AI (if applicable)

- If no AI features are used, state N/A and commit to governance if introduced.
- If AI is proposed later, align with privacy, bias mitigation, transparency,
  and human-in-the-loop controls (no current policy on file).

### Open Standards, APIs, and Open Source

- Data import/export uses CSV/XLSX and JSON-based payloads with validation.
  Evidence: README.md, CODE_GUIDE.md, src/shared/lib/xlsx.ts,
  src/lib/utils/csv-export.ts.
- Platform uses open-source components (React, TanStack, Better Auth, Drizzle,
  Postgres) and standard web APIs. Evidence: README.md.
- External partner APIs are not implemented yet; confirm scope for public APIs
  and authentication model. Evidence: docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md,
  docs/sin-rfp/review-plans/viasport-questions.md.
