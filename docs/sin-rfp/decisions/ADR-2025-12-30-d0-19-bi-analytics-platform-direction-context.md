# Context memo: BI analytics platform direction (D0.19)

## Why this memo

Capture current Solstice reporting capability, and the effort to build a Solstice-native BI
solution using Superset and Evidence for inspiration. This memo supports decision work in
D0.19 and the existing scope in D0.16.

## Related ADRs and scope anchors

- D0.16 (pivot builder + charts + export scope):
  [`docs/sin-rfp/decisions/ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md`](ADR-2025-12-26-d0-16-analytics-charts-pivots-scope.md)
- D0.19 (Evidence POC direction):
  [`docs/sin-rfp/decisions/ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md`](ADR-2025-12-30-d0-19-bi-analytics-platform-direction.md)

## Current Solstice reporting baseline

### UI + authoring surface

- Pivot builder (DnD fields, measures, chart types, JSON filters, export):
  [`src/features/reports/components/report-pivot-builder.tsx`](../../../src/features/reports/components/report-pivot-builder.tsx)
- Saved report management UI (create/update/delete + export):
  [`src/features/reports/components/report-builder-shell.tsx`](../../../src/features/reports/components/report-builder-shell.tsx)

### Server-side enforcement

- Pivot execution + export, org scoping, PII masking, step-up for exports:
  [`src/features/reports/reports.mutations.ts`](../../../src/features/reports/reports.mutations.ts)
- Allowed columns/filters/sorts per data source:
  [`src/features/reports/reports.config.ts`](../../../src/features/reports/reports.config.ts)
- Validation/normalization for filters/sorts:
  [`src/features/reports/reports.validation.ts`](../../../src/features/reports/reports.validation.ts)

### What this means

Solstice already has:

- A working pivot authoring experience (basic, but functional).
- Server-side aggregation with a strict allowlist for columns/filters/sorts.
- Organization scope enforcement and PII masking.
- Export paths guarded by step-up authentication.

Remaining gaps are not about baseline correctness, but about analyst-grade UX and
performance/scale features.

## Superset investigation (Apache 2.0)

### Relevant components

- Pivot chart plugin rendering (React + react-pivottable):
  [`/Users/austin/dev/superset/superset-frontend/plugins/plugin-chart-pivot-table/src/PivotTableChart.tsx`](/Users/austin/dev/superset/superset-frontend/plugins/plugin-chart-pivot-table/src/PivotTableChart.tsx)
- Pivot chart controls (aggregators, totals/subtotals, formatting):
  [`/Users/austin/dev/superset/superset-frontend/plugins/plugin-chart-pivot-table/src/plugin/controlPanel.tsx`](/Users/austin/dev/superset/superset-frontend/plugins/plugin-chart-pivot-table/src/plugin/controlPanel.tsx)
- Pivot post-processing operator (query pipeline):
  [`/Users/austin/dev/superset/superset-frontend/packages/superset-ui-chart-controls/src/operators/pivotOperator.ts`](/Users/austin/dev/superset/superset-frontend/packages/superset-ui-chart-controls/src/operators/pivotOperator.ts)
- Server-side pivot processing (Pandas, totals/subtotals, aggregates):
  [`/Users/austin/dev/superset/superset/charts/client_processing.py`](/Users/austin/dev/superset/superset/charts/client_processing.py)

### Reuse assessment

- Superset offers a robust pivot table implementation, but it is deeply tied to its
  chart/plugin model (formData + queryContext + post-processing pipeline).
- The most reusable part is conceptual: pivot aggregators/totals/subtotals behavior and the
  general UX patterns for configuring pivots.
- Direct reuse of `@superset-ui/*` would require replicating Superset's chart registry,
  query context, and control panel framework.

### Licensing

- Superset is Apache 2.0. This permits reuse with attribution and license preservation.

## Evidence investigation (MIT)

### Relevant components

- Core ECharts Svelte components and chart defaults:
  [`/Users/austin/dev/evidence/packages/ui/core-components/src/lib/unsorted/viz/core/_Chart.svelte`](/Users/austin/dev/evidence/packages/ui/core-components/src/lib/unsorted/viz/core/_Chart.svelte)
- Core components dependency stack (ECharts + formatting utilities):
  [`/Users/austin/dev/evidence/packages/ui/core-components/package.json`](/Users/austin/dev/evidence/packages/ui/core-components/package.json)
- Evidence SDK runtime model (query store, SSR hooks):
  [`/Users/austin/dev/evidence/packages/lib/sdk/README.md`](/Users/austin/dev/evidence/packages/lib/sdk/README.md)
- DuckDB/Universal SQL support (browser-side query runtime):
  [`/Users/austin/dev/evidence/packages/lib/universal-sql/package.json`](/Users/austin/dev/evidence/packages/lib/universal-sql/package.json)

### Reuse assessment

- Evidence is Svelte/SvelteKit-first and geared to static-site publishing, which does not
  align with Solstice's TanStack Start + React architecture.
- Direct component reuse is limited because of framework mismatch.
- Most reusable are design and chart configuration ideas, not code. The SDK + DuckDB query
  model is a different runtime than Solstice's Postgres-backed server queries.

### Licensing

- Evidence is MIT. This permits reuse with attribution and license preservation.

## Effort bands (rough order-of-magnitude)

Assuming Postgres-only and existing data sources.

- Strengthen the existing D0.16 pivot + chart builder:
  - Typed filter builder, totals/subtotals, richer chart formatting, better exports.
  - Roughly 6-10 weeks for a small team.
- Solstice-native BI (datasets, metrics, dashboards, sharing, audit enhancements):
  - Roughly 3-6 months.
- Superset-class platform (SQL lab, semantic layer parity, plugin system, alerts, caching):
  - Roughly 9-18 months.

## Gaps to close for a Solstice-native BI solution

- Semantic layer (datasets, calculated fields, metric definitions, formatting).
- Typed filter builder (date grain logic, operator enforcement, UI for allowlists).
- Dashboard authoring (layout, cross-filters, drill-downs, saved state).
- SQL-side pivots for scale; current pivot builds on in-memory rows.
- Governance hooks: audit logging for queries/exports, field-level ACLs in all paths.

## Recommendation direction (if moving away from Evidence)

- Keep Solstice-native analytics as the default end-user surface (aligned with D0.16),
  and borrow Superset pivot UX concepts rather than adopting its chart/plugin framework.
- Use Superset/Evidence as inspiration for pivot behavior, chart defaults, and formatting
  rather than direct component reuse.
- If Evidence remains in scope, keep it analyst-only unless it can meet tenancy,
  field-level ACL, and auditability requirements.

## Open questions

- Target personas: end-user self-service vs analyst-only authoring.
- Desired dashboard authoring experience and governance requirements for exports.
- Required dataset breadth and performance targets for pivoting at scale.
