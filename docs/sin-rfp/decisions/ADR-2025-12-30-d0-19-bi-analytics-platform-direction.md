# ADR-2025-12-30-d0-19-bi-analytics-platform-direction: BI analytics platform direction

Status: **Withdrawn**
Date: 2025-12-30
Updated: 2025-12-30

> **Decision Updated**: Evidence POC has been withdrawn. We are building native BI
> capabilities from scratch to maintain full control over governance, tenancy, and
> audit requirements.
>
> See consolidated BI documentation at: [docs/sin-rfp/decisions/bi/](./bi/)

## Decision (Updated)

~~Run a time-boxed POC of self-hosted Evidence on AWS (ca-central-1)...~~

**Final Decision**: Build native BI within Solstice. The Evidence POC is not pursued.

**Rationale**:

- Full control over governance, tenancy enforcement, and audit logging
- No dependency on external tool's security model
- Simpler operational footprint
- Canada residency (ca-central-1) easier to guarantee

## Original Proposal (For Reference)

Run a time-boxed POC of self-hosted Evidence on AWS (ca-central-1) to validate
feasibility for analyst-facing BI while preserving Solstice as the default
end-user reporting/analytics surface. Select an Evidence integration option only
if it satisfies tenancy, field-level ACL, audit logging, and export controls.
Default outcome is analyst-only Evidence (Option B) unless the POC proves
identity-aware runtime queries and auditability for end users (Option C).

## Context

- RP-AGG-005 requires self-service analytics and exports with field-level access.
- RP-AGG-003 requires dashboards.
- The current analytics plan assumes a native ECharts-based pivot/chart builder
  with server-side aggregation and XLSX export (see D0.16).
- Evidence is under consideration for analyst productivity and potential
  AI-to-SQL workflows.
- SIN security posture requires AWS ca-central-1 residency, strict access
  controls, and auditability.

## Constraints (SIN governance)

- Tenancy and org scoping enforced by default.
- Field-level access rules for analytics and exports (RP-AGG-005).
- Auditability of actions, queries, and exports with tamper evidence
  (SEC-AGG-004).
- Canada-only data residency (AWS ca-central-1).

## Evidence execution model considerations

- Evidence defaults to static-site generation with prebuilt query results, which
  cannot enforce per-user tenancy or field-level ACL at view time.
- SPA/runtime queries may be feasible, but must be proven to be identity-aware
  and auditable during the POC.

## Options considered

### Option A: Continue native ECharts pivot builder (status quo)

Pros:

- Full control over tenancy, ACL, audit logging, and UI consistency.
- Single portal and reduced operational surface area.

Cons:

- Higher engineering effort to reach analyst-grade authoring UX.
- Longer time to deliver advanced pivot/chart features.

### Option B: Evidence as analyst-only BI portal (internal)

Pros:

- Fastest path to credible dashboards for analysts.
- Minimal Solstice UI changes; keep end-user reporting in-app.

Cons:

- Does not satisfy end-user self-service without additional UI work.
- Requires SSO + audit logging integration to meet SEC-AGG-004.
- Exports must be disabled or routed through audited controls.

### Option C: Evidence with SSO + tenant-aware enforcement

Pros:

- Can serve end users if tenancy + field-level ACL are enforced.
- Centralizes BI in a specialized tool.

Cons:

- Requires custom work: RLS/views, SSO integration, audit trail, export controls.
- Adds operational overhead and governance review.
- High risk unless runtime queries can be identity-aware and audited.

### Option D: Evidence as authoring layer, Solstice as runtime

Pros:

- Analysts author SQL/charts; Solstice executes queries with existing ACL/audit.
- Keeps a single portal and consistent UI while leveraging Evidence workflows.

Cons:

- Requires translation layer for chart definitions and query execution.
- Adds maintenance overhead and integration complexity.

## Rationale

Evidence may improve analyst productivity, but SIN requirements prioritize
governance, tenancy, and auditability. A short POC validates Evidence against
these constraints without abandoning the existing ECharts plan.

## Consequences

- POC scope includes: AWS self-host deployment in ca-central-1, read-only replica
  or curated views, SSO feasibility, RLS/ACL enforcement, and audit logging of
  queries/exports.
- POC success criteria (kill criteria):
  - Residency: all query execution in ca-central-1 (including build pipelines).
  - Tenancy: end-user mode must enforce org scoping without per-tenant builds;
    otherwise restrict Evidence to analyst-only.
  - Field-level controls: Evidence must query curated views or roles that
    exclude restricted fields; no direct PII tables.
  - Auditability: log who ran what, when, tenant scope, and export actions; must
    integrate into the immutable audit chain.
  - Export controls: require step-up auth or disable exports.
- If the POC fails any kill criteria, continue with the native ECharts plan
  (D0.16) for end-user analytics.
- If the POC succeeds, select Option B, C, or D based on stakeholder needs and
  compliance readiness.

## Links

- `docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`
- `docs/sin-rfp/requirements/tickets/SIN-IMPLEMENTATION-BACKLOG-V2.md`
- `docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md`
- https://docs.evidence.dev/deployment/overview/#self-host
- https://preset.io/blog/2021-4-1-why-echarts/

## Appendix A: Metabase (self-hosted) notes

- Row and column security applies to the query builder only; SQL questions can
  bypass row and column security unless isolated by collection permissions.
  https://www.metabase.com/docs/latest/permissions/row-and-column-security
- Static embedding cannot use row and column security and does not create user
  sessions for per-user analytics.
  https://www.metabase.com/docs/latest/embedding/static-embedding
- SQL editor access with enforced row-level security relies on database role
  impersonation (paid feature). PostgreSQL RLS on views requires Postgres 15+.
  https://www.metabase.com/docs/latest/permissions/impersonation
- Multi-tenant assignment relies on JWT tenant claims (paid feature).
  https://www.metabase.com/docs/latest/people-and-groups/assigning-users-to-tenants
- Audit tools are deprecated in favor of Usage Analytics; activity/view data is
  paid-tier only, with retention controlled by MB_AUDIT_MAX_RETENTION_DAYS.
  https://www.metabase.com/docs/latest/usage-and-performance-tools/usage-analytics

## Appendix B: Superset (self-hosted) notes

- RBAC and dataset permissions are core; row-level security filters are assigned
  to datasets and roles, and injected into query SQL.
  https://superset.apache.org/docs/security/security
- Superset is not a database firewall; enforce least-privilege and auditing at
  the database layer.
  https://superset.apache.org/docs/security/securing_superset
- Public dashboard links bypass authentication; embedded SDK requires explicit
  feature flag and CSP configuration.
  https://superset.apache.org/docs/configuration/networking-settings
- SQL templating can access current user roles and RLS rules for query scoping.
  https://superset.apache.org/docs/configuration/sql-templating
- Alerts and reports require Celery, Redis, and a headless browser, increasing
  operational complexity.
  https://superset.apache.org/docs/configuration/alerts-reports

## Appendix C: ECharts notes (Preset blog)

- Superset selected ECharts to replace NVD3 due to breadth of chart types, active
  community, Apache governance, and a strong declarative API.
- ECharts emphasizes performance (Canvas/SVG rendering, streaming/incremental
  rendering) and theming via JSON, aligning with no-code exploration workflows.
- Internationalization support is listed as a selection criterion.
  https://preset.io/blog/2021-4-1-why-echarts/
