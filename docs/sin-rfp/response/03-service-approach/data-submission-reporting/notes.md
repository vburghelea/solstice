# Context Notes - Service Approach - Data Submission and Reporting Web Portal

## RFP Prompts

- Describe UX strategy and approach.
- Describe technology stack (front end, middleware, auth) and benefits.

## Evidence Targets

- Role-based flow screenshots.
- Accessibility or responsive design notes.
- Stack diagram or component list.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/requirements/SIN-REQUIREMENTS.md
- docs/sin-rfp/requirements/user-stories-and-flows.md
- docs/sin-rfp/requirements/requirements-coverage-matrix.md
- docs/sin-rfp/review-plans/ux-review-plan.md
- docs/sin-rfp/ux-review-findings.md
- docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md
- docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md
- docs/sin-rfp/phase-0/architecture-reference.md
- README.md
- src/tenant/tenants/viasport.ts

## Context Highlights (source-backed)

- RFP expects a secure, UX-driven reporting and data submission portal with clear
  UX strategy plus a defined web stack. (docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md)
- Portal requirements emphasize validation, reporting flows, dashboards, and
  self-service analytics/export with role-based access. (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Persona flows for viaSport admins, PSO admins, reporters, and data stewards are
  documented and align to reporting, forms, imports, and analytics tasks.
  (docs/sin-rfp/requirements/user-stories-and-flows.md)
- The viaSport tenant enables SIN portal modules: reporting, forms, imports,
  analytics, templates, help center, support, data catalog/quality, walkthroughs,
  and global search. (src/tenant/tenants/viasport.ts)
- UX review plan + findings document responsive navigation, consistent layout,
  and role-based portal screens with evidence screenshots. (docs/sin-rfp/review-plans/ux-review-plan.md,
  docs/sin-rfp/ux-review-findings.md)
- Reporting + analytics evidence exists for portal views and admin console
  screens (reporting tasks, analytics builder, exports). (docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md)
- Analytics stack is native: pivot builder + charts with ECharts, TanStack
  table/virtualization, and drag/drop. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md)
- Architecture supports serverless web portal on AWS (CloudFront + Lambda) with
  Postgres + S3 storage, queues, and email. (docs/sin-rfp/phase-0/architecture-reference.md)
- Tech stack: TanStack Start + React + TypeScript, Tailwind + shadcn/ui, Drizzle
  - Postgres, Better Auth, SST on AWS. (README.md)

## Draft Bullets for final.md (notes only)

### UX Strategy and Approach

- Role-based portal tailored to viaSport admins, PSO reporters, and data stewards
  with clear flows for reporting, forms, imports, and analytics.
  (docs/sin-rfp/requirements/user-stories-and-flows.md)
- Dashboard-led navigation with quick access cards, reporting task lists, and
  submission workflows; evidence captured in UX review findings.
  (docs/sin-rfp/ux-review-findings.md)
- Responsive layout validated across desktop and mobile views; UX review notes
  remaining accessibility items for follow-up. (docs/sin-rfp/ux-review-findings.md)
- In-product guidance includes templates hub, help center, support requests, and
  guided walkthroughs to reduce onboarding friction. (src/tenant/tenants/viasport.ts)

### Technology Stack and Benefits

- Front end: TanStack Start + React + TypeScript with Tailwind + shadcn/ui for
  consistent, accessible UI. (README.md)
- Middleware/API: TanStack Start server functions + Drizzle ORM on PostgreSQL,
  optimized for type-safe, audited data workflows. (README.md)
- Auth: Better Auth with MFA and role-based access controls; optional OAuth where
  enabled. (README.md)
- Hosting: AWS ca-central-1 with CloudFront, Lambda, RDS, S3, SQS, SES for
  scalable and secure delivery. (docs/sin-rfp/phase-0/architecture-reference.md)
- Analytics: native pivot/charts builder using ECharts + TanStack table/virtual,
  keeping tenancy and governance in-app. (docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md)
