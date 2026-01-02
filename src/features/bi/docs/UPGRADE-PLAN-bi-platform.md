# BI Platform Upgrade Plan (Canonical)

**Status:** Approved
**Date:** 2026-01-02
**Supersedes:** Previous draft (same filename)

This document defines the upgrade path for the BI platform, synthesizing findings from:

- `ASSESSMENT-bi-ux-product-review.md` (UX gaps)
- `RESEARCH-open-source-bi-patterns.md` (Superset/Metabase patterns)
- Code review of `src/features/bi/`

---

## Positioning

**Position as:** "Governed Data Explorer + Reporting + Full BI Platform" — intended
to be competitive with Tableau/PowerBI.

This aligns with:

- SIN's compliance and org-scoping requirements
- Governance investments (audit, masking, export step-up)
- The persona registry
- The updated goal of full BI feature parity alongside governance

**North-star UX:**

- PSO_REPORTER can get to a correct chart export **fast** without knowing data modeling.
- VS_DATA_STEWARD can define metrics/dimensions once and have them appear consistently.
- VS_ADMIN can do cross-org oversight safely.

---

## Decision Log

These decisions shape the entire upgrade. **All resolved 2026-01-02.**

### Decision 1: SQL Pushdown for Pivots?

**Status:** ✅ RESOLVED — **Yes, implement SQL pushdown**

**Current state:** `executePivotQuery` loads all matching rows via `loadDatasetData`, then aggregates in TypeScript via `buildPivotResult`.

| Option                    | Implications                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Yes — SQL pushdown** ✅ | Performance scales to 20M+ rows. Dashboards with 8-12 widgets work. Requires writing a pivot-to-SQL compiler. |
| **No — Keep in-memory**   | Must aggressively cap row limits. Accept "small-data BI" positioning. Simpler short-term.                     |

**Rationale:** Without pushdown, dashboards are fragile at scale. Required for Workstream 1.

### Decision 2: Dashboard Filters Across Mixed Datasets?

**Status:** ✅ RESOLVED — **Per-dataset filters now, semantic mapping later**

**Current state:** Global filters dedupe fields across all datasets, but `FilterConfig` lacks `datasetId`. A filter on a field not in a widget's dataset can break queries.

| Option                     | Implications                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Semantic mapping**       | Filters define a semantic dimension (e.g., `organizationId`); each dataset maps it to a field. More flexible, more complex. |
| **Per-dataset filters** ✅ | Filters scoped to a dataset; only apply to widgets using that dataset. Simpler, less powerful.                              |

**Rationale:** Most dashboards are single-dataset. Per-dataset is sufficient for current personas. Schema allows adding semantic mapping later without breaking changes:

```typescript
interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: unknown;
  datasetId?: string;           // Now (Workstream 0)
  semanticDimension?: string;   // Future (if needed)
}
```

### Decision 3: Replace echarts-for-react with Direct ECharts?

**Status:** ✅ RESOLVED — **Keep echarts-for-react, abstract the interface**

**Current state:** Using `echarts-for-react` wrapper.

| Option                        | Implications                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| **Keep echarts-for-react** ✅ | Simpler. Sufficient for cross-filtering via click events.                                 |
| **Direct ECharts**            | Full control, better for brush selection and tooltip coordination. More code to maintain. |

**Rationale:** echarts-for-react is sufficient for Workstream 4-5 (click-to-filter). Abstract via `ChartWrapper` component to allow future swap if brush selection or advanced features needed:

```typescript
// ChartWrapper abstracts the implementation
interface ChartWrapperProps {
  options: EChartsOption;
  onElementClick?: (params: { dimension: string; value: unknown }) => void;
  onBrushSelect?: (params: { dimension: string; range: [unknown, unknown] }) => void;
}
```

---

## What Exists Today

### Core Capabilities

**Pivot Builder (Explore)**

- Dataset picker, field palette (DnD into Rows/Columns/Measures)
- Aggregations: count, sum, avg, min, max, count_distinct, median, stddev, variance
- Filters: eq, neq, gt, gte, lt, lte, in, not_in, between, contains, starts_with, ends_with, is_null, is_not_null
- Chart types: table, bar, line, area, pie, donut, heatmap, scatter
- Export: CSV, XLSX, JSON with step-up auth

**Dashboards**

- Grid canvas (react-grid-layout), add widget modal, edit layout
- Widget types: chart, pivot table, KPI card, text
- Share dialog, export dialog, global filters
- `WidgetType` schema includes `"filter"` but UI doesn't expose it yet

**Governance**

- Org scoping, field ACL, PII masking
- Export controls with step-up auth
- Audit logging with tamper-evident chaining
- SQL parsing/validation for workbench

### Known Issues (from code review)

| Issue                                  | Location                     | Impact                                     |
| -------------------------------------- | ---------------------------- | ------------------------------------------ |
| Global admins blocked from Explore     | `explore.tsx:10-15`          | VS personas without org role can't access  |
| `PivotQuery.limit` not enforced        | `bi.queries.ts:420-425`      | Queries can return unbounded rows          |
| Dashboard filters lack dataset scoping | `DashboardFilters.tsx`       | Filters can break mixed-dataset dashboards |
| Edit mode hides all data               | `DashboardWidget.tsx:95-100` | Layout editing is blind                    |
| No query caching                       | Throughout                   | Dashboard widgets fire duplicate queries   |

---

## Personas (Summary)

Source: `docs/sin-rfp/requirements/personas.md`

| Persona            | BI Goals                                  | Access Level                      |
| ------------------ | ----------------------------------------- | --------------------------------- |
| VS_ADMIN           | Cross-org analytics, compliance oversight | Author + export, org-wide sharing |
| PSO_ADMIN          | Org reporting, delegated access           | Author + export, org-wide sharing |
| PSO_REPORTER       | Build pivots, complete reporting tasks    | Author + export                   |
| ORG_MEMBER         | View shared dashboards/reports            | View-only                         |
| VS_DATA_STEWARD    | Data catalog, metric definitions          | Author + dataset admin            |
| VS_PRIVACY_OFFICER | DSAR, retention, audit evidence           | Audit-only                        |
| VS_SECURITY_ADMIN  | Security monitoring, audit review         | Audit-only                        |

---

## Principles

1. **Trust first:** Clear data definitions, freshness indicators, auditability, consistent metrics.
2. **Governance by default:** Org scoping, field-level ACLs, PII masking, step-up auth, tamper-evident logs.
3. **Fast feedback loops:** Immediate previews, smart defaults, helpful empty states.
4. **Guided analysis:** Templates, sample queries, progressive disclosure.
5. **Accessible and inclusive:** Keyboard navigation, screen reader support, contrast-safe palettes.
6. **Performance as UX:** Query limits, caching, pre-aggregation, predictable latency.
7. **Observable behavior:** Analytics on feature usage, errors, time-to-insight.

---

## Workstreams

### Workstream 0 — Correctness and Safety Foundation

**Goal:** Prevent broken experiences and lock in guardrails before adding polish.

**Priority:** MUST complete before other workstreams.

#### Deliverables

1. **Explore access gating fix**
   - Allow global admins and users with `analytics.author` or `analytics.sql` permission
   - Align UI gating with server behavior (server already handles global admin)

2. **PivotQuery.limit enforcement**
   - Add `limit?: number` to `loadDatasetData` params
   - Pass `data.limit` from `executePivotQuery`
   - Apply `QUERY_GUARDRAILS.maxRowsUi` as hard upper bound

3. **Dashboard global filters compatibility**
   - Add `datasetId?: string` to `FilterConfig`
   - Update `mergeDashboardFilters` to only apply compatible filters
   - Show warning when filter doesn't apply to a widget

4. **Aggregation correctness pass**
   - `sum([])` should return `null`, not `0` (misleading for "no values")
   - Ensure pivot totals and cells follow same null/zero rules

5. **Telemetry scaffolding**
   - Instrument: query run, query fail, export attempt/fail, dashboard view
   - Ensure events contain no PII

#### Code Hotspots

| File                                                      | Change                                                  |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `src/routes/dashboard/analytics/explore.tsx`              | Check global admin / permission sets, not just org role |
| `src/features/bi/bi.queries.ts` → `executePivotQuery`     | Pass and enforce `limit`, apply guardrails              |
| `src/features/bi/bi.data.ts` → `loadDatasetData`          | Add `limit` parameter, apply `.limit()` to queries      |
| `src/features/bi/components/dashboard/dashboard-utils.ts` | Make `mergeDashboardFilters` dataset-aware              |
| `src/features/bi/bi.schemas.ts`                           | Add `datasetId` to `FilterConfig`                       |

#### Acceptance Criteria

- [ ] Global admin can open Explore and run pivots without org role
- [ ] Dashboard with mixed datasets doesn't break when global filter added
- [ ] Pivot queries always respect limit and guardrails
- [ ] Telemetry events fire for key actions

---

### Workstream 1 — Query Execution and Performance

**Goal:** Make pivots and dashboards fast and predictable at scale.

**Depends on:** Workstream 0 (limit enforcement)

#### Deliverables

1. **Pivot pushdown to SQL** (if Decision 1 = Yes)
   - Compile `PivotQuery` into SQL:
     ```sql
     SELECT rowDims..., colDims..., agg(measures)
     FROM dataset_view
     WHERE filters + org_scope
     GROUP BY rowDims..., colDims...
     LIMIT grouped_result_cap
     ```
   - Transform grouped rows → `PivotResult` shape
   - Keep fallback to in-memory for edge cases

2. **Cardinality guardrails**
   - Hard cap on unique row keys (e.g., 500)
   - Hard cap on unique column keys (e.g., 50)
   - Return friendly error: "Too many categories; add a filter or choose fewer dimensions."

3. **Query caching**
   - Cache keyed by `(userId, orgId, datasetId, queryHash, filters)`
   - Short TTL (30-60s)
   - Invalidate on data writes

4. **Dashboard query batching** (optional, high ROI)
   - Backend endpoint to execute multiple widget queries in one call
   - Client renders from single payload

#### Code Hotspots

| File                                             | Change                            |
| ------------------------------------------------ | --------------------------------- |
| `src/features/bi/engine/`                        | New `pivot-sql-compiler.ts`       |
| `src/features/bi/bi.queries.ts`                  | Conditional SQL vs in-memory path |
| `src/features/bi/governance/query-guardrails.ts` | Add cardinality limits            |
| New: `src/features/bi/cache/`                    | Query result caching              |

#### Acceptance Criteria

- [ ] Dashboards with 8-12 widgets don't timeout or overload DB
- [ ] Pivot queries don't pull thousands of raw rows to app server
- [ ] System fails fast with actionable message on "too broad" queries

---

### Workstream 2 — Semantic Layer

**Goal:** Make definitions trustworthy and reusable so insights are consistent.

**Note:** Can run in parallel with Workstream 1.

#### Deliverables

1. **Dataset contract expansion**
   - Field descriptions, enum labels, formatting defaults
   - Sensitivity classification (already exists, ensure complete)
   - Freshness metadata (last updated, source system)

2. **Metrics as first-class objects**
   - Metric: id, name, description, expression, default aggregation, format
   - Expose metrics as selectable measures in pivot builder
   - Store in `src/features/bi/semantic/metrics.config.ts`

3. **Governance integration**
   - Metrics inherit sensitivity from underlying fields
   - Metrics can require permissions

4. **Data catalog UI** (steward-facing)
   - Read-only first (ship fast)
   - Show: field meaning, allowed operations, sensitivity, examples

#### Code Hotspots

| File                                              | Change                                  |
| ------------------------------------------------- | --------------------------------------- |
| `src/features/bi/semantic/datasets.config.ts`     | Add descriptions, enums, freshness      |
| `src/features/bi/semantic/metrics.config.ts`      | Define actual metrics (currently empty) |
| New: `src/routes/dashboard/analytics/catalog.tsx` | Data catalog UI                         |

#### Acceptance Criteria

- [ ] PSO_REPORTER can pick "Total Submissions" as a measure without building it manually
- [ ] VS_DATA_STEWARD can audit what a metric means and where it comes from

---

### Workstream 3 — Fast Feedback Loop + Smart Defaults

**Goal:** Make Explore feel like BI, not "build then run".

**Depends on:** Workstream 0 (correctness), Workstream 1 (performance)

#### Deliverables

1. **Auto-run with debounce**
   - Trigger query execution after field changes settle (500ms)
   - Heuristics:
     - Don't auto-run when query exceeds cost/cardinality threshold
     - Always auto-run for "small" queries (1 row dim + count)
   - Show loading indicator

2. **Inline preview while building**
   - Replace "Run a query to preview results" with:
     - "Drop a field into Rows to see breakdown"
     - "Add a measure (Count) to see totals"
     - One-click sample query per dataset

3. **Chart auto-suggestion**
   - 1 categorical dim + 1 measure → bar
   - Date/time dim → line
   - Many categories → table or bar with top-N
   - Show suggestion but don't force

4. **Default formatting**
   - Sort: descending for count/sum by default
   - Number formatting: thousands separators, decimals
   - Better axis labels and tooltips

#### Code Hotspots

| File                                                        | Change                             |
| ----------------------------------------------------------- | ---------------------------------- |
| `src/features/bi/components/pivot-builder/PivotBuilder.tsx` | Auto-run logic, sample queries     |
| `src/features/bi/components/pivot-builder/PivotPreview.tsx` | Guided empty states                |
| New: `src/features/bi/utils/query-cost.ts`                  | Heuristics for auto-run safety     |
| New: `src/features/bi/utils/chart-suggestion.ts`            | Suggest chart type from data shape |
| `src/features/bi/components/charts/pivot-chart.ts`          | Default formatting                 |

#### Acceptance Criteria

- [ ] Time-to-first-chart is < 30 seconds for PSO_REPORTER
- [ ] Explore UI has no "dead ends"
- [ ] Charts have sensible defaults without configuration

---

### Workstream 4 — Chart Configuration System

**Goal:** Make charts usable without code changes.

**Depends on:** Workstream 3 (defaults working)

#### Deliverables

1. **Transform layer abstraction**
   - Replace ad-hoc option creation in `pivot-chart.ts` with:
     ```typescript
     transformPivotToChart(pivot, chartType, measureKey, chartConfig)
     ```
   - Add `chartOptions` to `WidgetConfig`

2. **Declarative control panels** (Superset-inspired)
   - Per-chart control definitions
   - Control types: checkbox, slider, select, color-scheme
   - Controls to start:
     - Color scheme
     - Legend on/off + position
     - Show labels
     - Stacking (bar/area)
     - Smoothing (line)
     - Donut radius

3. **Color scheme system** (port from Superset, Apache 2.0)
   - Create `src/features/bi/utils/color-schemes.ts`
   - Schemes: ECharts default, viaSport brand, colorblind-safe

4. **Event hooks for interactivity**
   - Define internal interface for chart click events
   - Prepare for cross-filtering without rewiring

#### Code Hotspots

| File                                                            | Change                       |
| --------------------------------------------------------------- | ---------------------------- |
| `src/features/bi/components/charts/pivot-chart.ts`              | Replace with transform layer |
| New: `src/features/bi/components/chart-config/ControlPanel.tsx` | Declarative config UI        |
| New: `src/features/bi/components/chart-config/types.ts`         | Control panel types          |
| New: `src/features/bi/utils/color-schemes.ts`                   | Color scales (from Superset) |

#### Acceptance Criteria

- [ ] User can make a donut chart readable without code changes
- [ ] Charts look consistent across Explore and Dashboards
- [ ] Color schemes include a colorblind-safe option

---

### Workstream 5 — Dashboards as a Product

**Goal:** Dashboards become the primary consumption surface for ORG_MEMBER and admin personas.

**Depends on:** Workstreams 0-4

#### Deliverables

1. **Filter widgets**
   - Implement `WidgetType: "filter"` in UI
   - Types: date range picker (with presets), enum multi-select, text search
   - Wire filter widgets → dashboard global filters state

2. **Cross-filtering**
   - Click on chart element → emit filter event → update dashboard filters → re-run other widgets
   - "Active filters" UI and "clear all" button
   - Visual indicator of filtered widgets

3. **Keep data visible in edit mode**
   - Show widgets while editing layout
   - Freeze refetch, show "stale" badge
   - Resume refetch on edit complete

4. **Role-based templates**
   - "New dashboard from template" option
   - Templates:
     - PSO Reporting Overview
     - Submissions QA / Completeness
     - viaSport Cross-org Compliance (VS_ADMIN)

#### Code Hotspots

| File                                                         | Change                 |
| ------------------------------------------------------------ | ---------------------- |
| `src/features/bi/components/dashboard/DashboardWidget.tsx`   | Keep data in edit mode |
| New: `src/features/bi/components/dashboard/FilterWidget.tsx` | Filter widget type     |
| `src/features/bi/components/dashboard/DashboardCanvas.tsx`   | Cross-filter event bus |
| New: `src/features/bi/templates/`                            | Dashboard templates    |

#### Acceptance Criteria

- [ ] ORG_MEMBER can open dashboard and interact with filters without Explore
- [ ] PSO_ADMIN can share org-wide dashboard with minimal setup
- [ ] Edit mode doesn't hide all data

---

### Workstream 6 — Hardening and Release

**Goal:** Make it shippable and supportable.

**Depends on:** All workstreams complete

#### Deliverables

1. **Accessibility**
   - Keyboard sensor for DnD
   - Focus states
   - ARIA labels
   - WCAG AA pass on key flows

2. **Performance testing**
   - Dashboard with N widgets
   - Worst-case filters
   - Max allowed row/col cardinality

3. **Audit UX**
   - Basic UI for audit log review (VS_AUDITOR, VS_SECURITY_ADMIN)
   - Export events clearly flagged (step-up used, PII included/masked)

4. **Documentation**
   - Support playbooks
   - "How to build a report" guides
   - Training materials for Support Coordinator

#### Acceptance Criteria

- [ ] Support coordinator has templates + docs that reduce ticket load
- [ ] Privacy/security personas can review evidence without asking engineering
- [ ] WCAG AA compliance on key flows

---

## Assessment Gap Closure Mapping

| Gap (from Assessment)            | Workstream | Deliverable                           |
| -------------------------------- | ---------- | ------------------------------------- |
| No visual feedback loop          | WS3        | Auto-run + inline preview             |
| Drag-and-drop feels disconnected | WS3        | Live preview + chart suggestion       |
| Results are raw data             | WS3        | Default formatting                    |
| Empty states are dead ends       | WS3        | Guided empty states + samples         |
| No discoverability/onboarding    | WS2, WS3   | Data catalog, templates, samples      |
| Chart type discoverability       | WS3, WS4   | Chart suggestion + config UI          |
| No interactivity                 | WS4, WS5   | Event hooks, cross-filtering          |
| Dashboard builder unclear        | WS5        | Templates + filter widgets            |
| Filters underpowered             | WS0, WS5   | Fix compatibility, add filter widgets |
| Global admin access blocked      | WS0        | Fix access gating                     |

---

## Recommended Execution Sequence

If resources are limited, prioritize in this order:

### Milestone 1: Correctness + Guardrails

Workstream 0 complete.

- Global admin access fixed
- Dashboard filter compatibility
- Limit enforcement
- Cardinality caps

### Milestone 2: SQL Pushdown + Caching

Workstream 1 complete.

- Pivot queries compile to SQL
- Query caching for dashboards
- Everything else depends on this for scale

### Milestone 3: Auto-Run + Smart Defaults

Workstream 3 complete.

- Biggest perceived UX lift
- Makes the platform feel "real"

### Milestone 4: Chart Config + Dashboards

Workstreams 4 + 5.

- Configuration without code
- Cross-filtering
- Templates

### Milestone 5: Hardening

Workstream 6.

- A11y, perf testing, audit UX, docs

---

## Definition of Done

- [ ] BI personas can complete top tasks with < 5 minutes to first chart
- [ ] Shared dashboards are discoverable, responsive, and filterable
- [ ] Exports honor ACLs and are fully audited with step-up auth
- [ ] Data definitions are visible and consistent across reports and dashboards
- [ ] UX gaps from assessment are closed or explicitly deferred
- [ ] Global admins and VS personas can access analytics appropriately
- [ ] Dashboards with 8-12 widgets perform acceptably

---

## Appendix: Ready-to-Use Code Patterns

### Color Scheme System (from Superset, Apache 2.0)

```typescript
// src/features/bi/utils/color-schemes.ts

export interface ColorScheme {
  id: string;
  label: string;
  colors: string[];
  isColorblindSafe?: boolean;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'echarts',
    label: 'ECharts Default',
    colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
             '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  },
  {
    id: 'viasport',
    label: 'viaSport Brand',
    colors: ['#0066CC', '#00A651', '#F7941D', '#ED1C24', '#662D91',
             '#00B5E2', '#8DC63F', '#FFC20E', '#F15A29', '#93278F'],
  },
  {
    id: 'colorblind',
    label: 'Colorblind Safe',
    colors: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#F0E442',
             '#56B4E9', '#D55E00', '#000000'],
    isColorblindSafe: true,
  },
];

export function getColorScale(schemeId: string): (value: string, index?: number) => string {
  const scheme = COLOR_SCHEMES.find(s => s.id === schemeId) ?? COLOR_SCHEMES[0];
  const colorMap = new Map<string, string>();

  return (value: string, index?: number): string => {
    if (colorMap.has(value)) return colorMap.get(value)!;
    const colorIndex = index ?? colorMap.size;
    const color = scheme.colors[colorIndex % scheme.colors.length];
    colorMap.set(value, color);
    return color;
  };
}
```

### Control Panel Types

```typescript
// src/features/bi/components/chart-config/types.ts

export type ControlType = 'checkbox' | 'slider' | 'select' | 'color-scheme';

export interface ControlConfig {
  name: string;
  type: ControlType;
  label: string;
  description?: string;
  defaultValue: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  visibility?: (formData: Record<string, unknown>) => boolean;
}

export interface ControlSection {
  label: string;
  expanded?: boolean;
  controls: ControlConfig[];
}

export interface ChartControlPanel {
  chartType: string;
  sections: ControlSection[];
}
```

### Query Cost Heuristics

```typescript
// src/features/bi/utils/query-cost.ts

import type { PivotQuery } from '../bi.schemas';
import { QUERY_GUARDRAILS } from '../governance/query-guardrails';

export interface QueryCost {
  estimatedRows: number;
  estimatedCardinality: number;
  isSafe: boolean;
  reason?: string;
}

export function estimateQueryCost(query: PivotQuery): QueryCost {
  // Simple heuristics for auto-run safety
  const rowDimCount = query.rows.length;
  const colDimCount = query.columns.length;
  const hasNoFilters = query.filters.length === 0;

  // Very conservative estimates
  const estimatedCardinality = Math.pow(10, rowDimCount + colDimCount);
  const isSafe = estimatedCardinality < 1000 && !hasNoFilters;

  return {
    estimatedRows: estimatedCardinality,
    estimatedCardinality,
    isSafe,
    reason: !isSafe
      ? `Query may return ${estimatedCardinality} combinations. Add filters to reduce.`
      : undefined,
  };
}
```
