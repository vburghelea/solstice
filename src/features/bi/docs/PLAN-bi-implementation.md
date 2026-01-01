# Solstice BI Platform - Implementation Plan

**Status**: Approved
**Date**: 2025-12-30
**Author**: Technical Architecture

---

## Table of Contents

1. [Development Philosophy](#1-development-philosophy)
2. [Vertical Slices](#2-vertical-slices)
3. [Phase Timeline](#3-phase-timeline)
4. [Migration Strategy](#4-migration-strategy)
5. [Dependencies and Risks](#5-dependencies-and-risks)
6. [Acceptance Criteria](#6-acceptance-criteria)

---

## 1. Development Philosophy

### 1.1 Approach by Layer

| Layer                                      | Approach                     | Rationale                                                             |
| ------------------------------------------ | ---------------------------- | --------------------------------------------------------------------- |
| **Engine** (aggregations, filters, parser) | TDD                          | Pure functions, deterministic I/O, high regression risk               |
| **Governance** (ACL, masking, scoping)     | TDD                          | Security-critical, must be provably correct                           |
| **Schemas**                                | Contract-first               | Define Zod schemas before implementation; downstream depends on shape |
| **Server Functions**                       | Integration tests            | Full path verification: API → engine → DB → response                  |
| **UI Components**                          | Prototype → stabilize → test | Visual/interactive; TDD doesn't fit exploration phase                 |
| **E2E Flows**                              | After stabilization          | Verify critical user journeys once UI is stable                       |

### 1.2 Key Principles

**1. Golden Masters for Refactoring**

When extracting `buildPivotResult` from `reports.mutations.ts`:

- Capture current output for representative inputs as fixtures
- Test refactored code produces identical output
- Only then extend with new features

**2. AST-Based SQL Parsing**

Do not rely on regex for SQL validation—it will leak. Use a proper AST parser
(`pgsql-ast-parser` or similar) and test:

- Blocked statement types (INSERT, UPDATE, DELETE, DROP)
- Disallowed tables (not in dataset)
- Disallowed columns (PII without permission)
- Disallowed JOINs (outside dataset configuration)

**3. Contract-First Schemas**

Define Zod schemas before implementing loaders/handlers:

```typescript
// Define schema first
const pivotQuerySchema = z.object({
  datasetId: z.string().uuid(),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  measures: z.array(measureSchema),
  filters: z.array(filterSchema).optional(),
});

// Then implement handler with .inputValidator(schema.parse)
```

**4. Hard Gates for Security Features**

SQL Workbench is disabled until all prerequisites pass. No exceptions. See
[CHECKLIST-sql-workbench-gate.md](./CHECKLIST-sql-workbench-gate.md).

---

## 2. Vertical Slices

### Slice 1: Harden Current Pivot

**Goal**: Extract and stabilize existing pivot functionality before extending.

**Scope**:

- Extract `buildPivotResult` from `reports.mutations.ts` → `engine/pivot-aggregator.ts`
- Golden-master tests to lock current behavior
- TDD new aggregations: `count_distinct`, `median`, `stddev`
- Add totals/subtotals to pivot renderer
- Improve chart formatting options

**Files Created/Modified**:

```
src/features/bi/
├── engine/
│   ├── pivot-aggregator.ts        # Extracted from reports.mutations.ts
│   ├── aggregations.ts            # Aggregation functions
│   └── __tests__/
│       ├── pivot-aggregator.test.ts
│       └── aggregations.test.ts
└── __fixtures__/
    └── pivot-golden-masters.json  # Current output snapshots
```

**Testing**:

- Unit tests for all aggregation functions
- Property-based tests for aggregation invariants
- Golden-master tests for `buildPivotResult`
- Integration test for `runPivotQuery`

**Acceptance Criteria**:

- [x] Pivot aggregator extracted with no behavior change (golden masters pass)
- [x] All existing pivot tests pass
- [x] New aggregations (`median`, `stddev`) implemented with tests
- [x] Pivot table shows subtotals and grand totals

**Estimated Effort**: 2-3 weeks

---

### Slice 2: Typed Filters + Dataset Allowlists

**Goal**: Replace JSON filter input with typed filter builder; formalize datasets.

**Scope**:

- Contract-first: Zod schemas for filter configs, dataset definitions
- Typed filter UI components (replace JSON textarea)
- Dataset configuration system (successor to `DATA_SOURCE_CONFIG`)
- Integration tests for org scoping, PII masking, export step-up

**Files Created/Modified**:

```
src/features/bi/
├── bi.schemas.ts                  # Zod schemas (contract-first)
├── semantic/
│   ├── datasets.config.ts         # Dataset definitions
│   └── field-metadata.ts          # Field labels, types, formats
├── engine/
│   ├── filters.ts                 # Filter normalization
│   └── __tests__/
│       └── filters.test.ts
├── governance/
│   ├── org-scoping.ts             # Extract from reports.mutations.ts
│   ├── field-acl.ts               # Extract from reports.mutations.ts
│   └── __tests__/
│       ├── org-scoping.test.ts
│       └── field-acl.test.ts
└── components/
    └── filters/
        ├── FilterBuilder.tsx
        ├── FilterGroup.tsx
        ├── DateFilter.tsx
        ├── EnumFilter.tsx
        └── NumericFilter.tsx
```

**Testing**:

- Unit tests for filter normalization
- Unit tests for org scoping logic
- Unit tests for field ACL masking
- Integration tests: scoped queries return only tenant data
- Integration tests: exports require step-up auth
- Integration tests: PII fields masked for non-privileged users

**Acceptance Criteria**:

- [x] Filter UI uses typed components, not JSON textarea
- [x] Dataset configuration replaces `DATA_SOURCE_CONFIG`
- [x] Org scoping tests prove tenant isolation
- [x] PII masking tests prove field-level ACL works
- [x] Export step-up tests prove auth required

**Estimated Effort**: 3-4 weeks

---

### Slice 3: Minimal Dashboard Canvas

**Goal**: Enable dashboard composition with basic widgets.

**Scope**:

- Dashboard canvas with `react-grid-layout`
- Widget types: chart, pivot, KPI, text
- Global filters (date range, org selector)
- Dashboard CRUD and sharing
- E2E test: create dashboard + add widget + export

**Files Created/Modified**:

```
src/features/bi/
├── components/
│   └── dashboard/
│       ├── DashboardCanvas.tsx
│       ├── DashboardWidget.tsx
│       ├── WidgetToolbar.tsx
│       ├── DashboardFilters.tsx
│       └── AddWidgetModal.tsx
├── hooks/
│   └── useDashboard.ts
├── bi.mutations.ts                # Dashboard CRUD
└── bi.queries.ts                  # Dashboard loading

src/routes/dashboard/analytics/
├── dashboards/
│   ├── index.tsx                  # Dashboard list
│   ├── $dashboardId.tsx           # Dashboard view/edit
│   └── new.tsx                    # Create dashboard

e2e/tests/authenticated/
└── bi-dashboard.auth.spec.ts      # E2E tests
```

**Testing**:

- Component tests for DashboardCanvas (after stabilization)
- Integration tests for dashboard CRUD
- E2E: create dashboard → add chart widget → verify renders
- E2E: create dashboard → export → verify audit log

**Acceptance Criteria**:

- [x] User can create dashboard with grid layout
- [x] User can add chart/pivot/KPI/text widgets
- [x] Dashboard persists and reloads correctly
- [x] Dashboard sharing (user-level, org-wide) works
- [ ] E2E tests pass for create + share + export flow

**Estimated Effort**: 4-5 weeks

---

### Slice 4: SQL Workbench (Behind Hard Gate)

**Goal**: Provide governed SQL access for power users.

**Prerequisites**: All items in [CHECKLIST-sql-workbench-gate.md](./CHECKLIST-sql-workbench-gate.md) must be complete before this slice can ship.

**Gates & Feature Keys**:

- Slices 1-3 remain under existing `sin_analytics` gating.
- SQL Workbench requires permission `analytics.sql`.
- Add feature key `sin_analytics_sql_workbench` (default false) in tenant configs.
- Gate route + nav + server functions via `requireFeatureInRoute`/`assertFeatureEnabled`.

**Scope**:

- AST-based SQL parser (not regex)
- Query rewriter (table → view substitution)
- Parameter substitution (`{{param}}` syntax)
- Schema-aware autocomplete
- Query history
- Query cost guardrails
- `bi_query_log` audit table with tamper-evident chain

**Files Created/Modified**:

```
src/features/bi/
├── engine/
│   ├── sql-parser.ts              # AST-based parser
│   ├── sql-rewriter.ts            # Table → view substitution
│   └── __tests__/
│       ├── sql-parser.test.ts
│       └── sql-rewriter.test.ts
├── governance/
│   ├── query-audit.ts             # bi_query_log logging
│   └── query-guardrails.ts        # Timeout, row limit, cost
├── components/
│   └── sql-workbench/
│       ├── SqlWorkbench.tsx
│       ├── SqlEditor.tsx
│       ├── QueryHistory.tsx
│       └── ResultsTable.tsx
└── bi.sql-executor.ts             # SQL execution engine

src/db/schema/
└── bi.schema.ts                   # bi_query_log table

src/routes/dashboard/analytics/
└── sql.tsx                        # SQL workbench route
```

**Database Work**:

```sql
-- Create curated views (DBA task)
CREATE VIEW bi_v_organizations
WITH (security_barrier = true) AS
SELECT id, name, slug, type, status, created_at, updated_at
  -- NOTE: Excludes PII columns
FROM organizations
WHERE id = NULLIF(current_setting('app.org_id', true), '')::uuid
   OR COALESCE(NULLIF(current_setting('app.is_global_admin', true), ''), 'false')::boolean = true;

-- Create read-only role (DBA task)
CREATE ROLE bi_readonly NOLOGIN;
GRANT SELECT ON bi_v_organizations TO bi_readonly;
GRANT SELECT ON bi_v_form_submissions TO bi_readonly;
-- etc.
```

**Testing**:

- Unit tests for SQL parser (see GUIDE-bi-testing.md for cases)
- Unit tests for query rewriter
- Integration tests: view scoping enforcement
- Integration tests: non-select statements rejected
- Integration tests: audit entries created with checksums
- E2E: run query → view results → verify audit log

**Acceptance Criteria**:

- [ ] All CHECKLIST-sql-workbench-gate.md prerequisites complete
- [x] SQL parser rejects all non-select statements
- [x] SQL parser rejects tables not in dataset
- [x] Query rewriter substitutes raw tables with views
- [x] DB-level scoping via curated views is enforced
- [x] All queries logged to `bi_query_log` with checksums
- [x] Query guardrails (timeout, row limit) enforced
- [ ] E2E tests pass

**Estimated Effort**: 5-6 weeks (including DBA work)

---

## 3. Phase Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IMPLEMENTATION PHASES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Foundation (Slice 1)                            Weeks 1-3         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Extract pivot aggregator                                          │   │
│  │ • Golden-master tests                                               │   │
│  │ • New aggregations (median, stddev)                                 │   │
│  │ • Totals/subtotals                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Phase 2: Typed Filters + Datasets (Slice 2)              Weeks 4-7         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Contract-first schemas                                            │   │
│  │ • Typed filter UI                                                   │   │
│  │ • Dataset configuration                                             │   │
│  │ • Governance integration tests                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Phase 3: Dashboard Canvas (Slice 3)                      Weeks 8-12        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Dashboard canvas + widgets                                        │   │
│  │ • Dashboard CRUD + sharing                                          │   │
│  │ • E2E tests                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Phase 4: SQL Workbench (Slice 4) [HARD GATE]             Weeks 13-18       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • AST parser + query rewriter                                       │   │
│  │ • DB views + session scoping + read-only role (DBA)                 │   │
│  │ • Audit logging + guardrails                                        │   │
│  │ • Security review                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Phase 5: Polish + Scale (Future)                         Post-MVP          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Cross-filtering between widgets                                   │   │
│  │ • SQL-side GROUP BY ROLLUP                                          │   │
│  │ • Query caching                                                     │   │
│  │ • Export scheduling                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Migration Strategy

### 4.1 Module Transition

The existing `src/features/reports/` module continues to work during migration.
The new `src/features/bi/` module is built alongside it.

```
Current:                          Target:
────────                          ───────
src/features/reports/             src/features/bi/
├── reports.config.ts      →      ├── semantic/datasets.config.ts
├── reports.mutations.ts   →      ├── bi.mutations.ts
│   └── buildPivotResult   →      │   └── engine/pivot-aggregator.ts
├── reports.schemas.ts     →      ├── bi.schemas.ts
├── reports.validation.ts  →      ├── engine/filters.ts
└── components/            →      └── components/pivot-builder/
```

### 4.2 Migration Phases

| Phase | Action                                                | Risk   |
| ----- | ----------------------------------------------------- | ------ |
| 1     | Build `bi/` module alongside `reports/`               | Low    |
| 2     | New routes use `bi/` module                           | Low    |
| 3     | Migrate saved reports: `saved_reports` → `bi_reports` | Medium |
| 4     | Deprecate `reports/` module                           | Low    |
| 5     | Remove `reports/` module after soak period            | Low    |

### 4.3 Data Migration

```typescript
// One-time migration script
async function migrateSavedReports() {
  const oldReports = await db.select().from(savedReports);

  for (const report of oldReports) {
    await db.insert(biReports).values({
      id: report.id, // Preserve IDs
      organizationId: report.organizationId,
      name: report.name,
      description: report.description,
      reportType: "pivot",
      pivotConfig: convertToPivotConfig(report),
      filters: report.filters,
      ownerId: report.ownerId,
      sharedWith: report.sharedWith,
      isOrgWide: report.isOrgWide,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });
  }
}
```

### 4.4 API Compatibility

Existing endpoints remain functional during transition:

```typescript
// Existing (maintain during migration)
export const runPivotQuery = createServerFn({ method: "POST" }); // ...

// New (bi module)
export const runBiPivotQuery = createServerFn({ method: "POST" }); // ...
```

Routes updated to use new module:

- `/dashboard/analytics/*` → `bi/` module
- `/dashboard/reports/*` → `reports/` module (deprecated)

---

## 5. Dependencies and Risks

### 5.1 Dependencies

| Dependency          | Required For                        | Status                 | Owner    |
| ------------------- | ----------------------------------- | ---------------------- | -------- |
| Postgres 15+        | Session settings + security_barrier | Verify RDS version     | DBA      |
| `pgsql-ast-parser`  | SQL validation                      | Add to package.json    | Backend  |
| `react-grid-layout` | Dashboard canvas                    | Add to package.json    | Frontend |
| `fast-check`        | Property tests                      | Add to devDependencies | Backend  |
| DBA time            | Views, roles, scoping               | Schedule               | DBA      |
| Security review     | SQL Workbench                       | Schedule               | Security |

### 5.2 Risks

| Risk                                         | Likelihood | Impact | Mitigation                                                           |
| -------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------- |
| Session context missing/mis-set scopes wrong | Medium     | High   | Fail-closed view filters + enforce SET LOCAL + missing-context tests |
| SQL parser has edge cases                    | Medium     | High   | Extensive test suite; defense-in-depth with views                    |
| Dashboard canvas performance                 | Medium     | Medium | Virtualization; limit widget count                                   |
| Migration breaks existing reports            | Low        | Medium | Preserve IDs; run migration in stages                                |
| Audit chain integrity issues                 | Low        | High   | Use established HMAC patterns; verify on read                        |

### 5.3 Mitigation Details

**SQL Parser Edge Cases**:

- Use established parser library, not custom regex
- Test against SQL injection cheatsheets
- Database views as second line of defense
- Penetration test before enabling

**Dashboard Performance**:

- Virtualize widget rendering
- Lazy-load widget data
- Cap widgets per dashboard (e.g., 20)

---

## 6. Acceptance Criteria

### 6.1 Per-Slice Criteria

See individual slice sections above.

### 6.2 Overall MVP Criteria

The BI platform MVP (Slices 1-3) is complete when:

- [x] Pivot builder works with typed filters (no JSON)
- [x] Pivot supports totals, subtotals, median/stddev aggregations
- [x] Dashboard canvas allows widget composition
- [x] Dashboard sharing works (user + org-wide)
- [x] Exports require step-up auth and are audited
- [x] PII masking enforced across UI and exports
- [x] All integration tests pass
- [ ] E2E tests pass for: pivot run, pivot export, dashboard create, dashboard share

### 6.3 SQL Workbench Criteria

SQL Workbench (Slice 4) is complete when:

- [ ] All CHECKLIST-sql-workbench-gate.md prerequisites pass
- [x] AST parser enforces single SELECT rule
- [x] Query rewriter enforces dataset-only access
- [ ] DB scoping proven via integration tests (views + session context)
- [x] Audit chain integrity verified
- [ ] Security review complete with sign-off
- [ ] E2E tests pass

---

## Links

- [SPEC-bi-platform.md](./SPEC-bi-platform.md) - Platform specification
- [GUIDE-bi-testing.md](./GUIDE-bi-testing.md) - Testing strategy
- [CHECKLIST-sql-workbench-gate.md](./CHECKLIST-sql-workbench-gate.md) - SQL Workbench prerequisites
- [Current Implementation](../../../src/features/reports/reports.mutations.ts)
